const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const {
  normalizeEntitlement,
  startTrialEntitlement,
  activateExamPassEntitlement,
  canUseAction
} = require("./premium-core");

const storePath = process.env.LYNXLY_ENTITLEMENTS_FILE
  || path.join(process.env.LYNXLY_ENTITLEMENTS_DIR || __dirname, ".lynxly-entitlements.json");

let mutationQueue = Promise.resolve();

const RESERVATION_TTL_MS = 15 * 60 * 1000;
const PRIVACY_POLICY_VERSION = process.env.LYNXLY_PRIVACY_POLICY_VERSION || "2026-07";

const emptyStore = () => ({ users: {}, reservations: {}, audit: [] });

const readStore = () => {
  try {
    const data = JSON.parse(fs.readFileSync(storePath, "utf8"));
    return { users: {}, reservations: {}, audit: [], ...data };
  } catch (error) {
    return emptyStore();
  }
};

const writeStore = (data) => {
  const target = storePath;
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(temp, target);
  } catch (error) {
    try {
      fs.rmSync(temp, { force: true });
    } catch (_) {}
    const fallback = path.join(os.tmpdir(), "lynxly-entitlements.json");
    fs.writeFileSync(fallback, JSON.stringify(data, null, 2), "utf8");
  }
};

const safeUserKey = (value) => {
  const id = String(value || "").trim().slice(0, 120);
  if (!/^[a-zA-Z0-9:_-]{12,120}$/.test(id)) {
    const hash = crypto.createHash("sha256").update(id || "anonymous").digest("hex").slice(0, 32);
    return `session:${hash}`;
  }
  return id;
};

const withStoreMutation = (callback) => {
  const run = async () => {
    const store = readStore();
    cleanupExpiredReservations(store);
    const result = await callback(store);
    writeStore(store);
    return result;
  };
  mutationQueue = mutationQueue.then(run, run);
  return mutationQueue;
};

const normalizeForStore = (raw, now = new Date()) => normalizeEntitlement({ ...raw, serverVerified: true }, now);

const audit = (store, userKey, event, details = {}, now = new Date()) => {
  store.audit = Array.isArray(store.audit) ? store.audit : [];
  store.audit.push({
    id: `audit_${crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex")}`,
    userKey,
    event,
    details,
    createdAt: now.toISOString()
  });
  store.audit = store.audit.slice(-1000);
};

const cleanupExpiredReservations = (store, now = new Date()) => {
  const nowMs = now.getTime();
  store.reservations = store.reservations || {};
  for (const reservation of Object.values(store.reservations)) {
    if (!reservation || reservation.status !== "reserved") continue;
    const createdMs = new Date(reservation.createdAt || 0).getTime();
    if (!createdMs || nowMs - createdMs <= RESERVATION_TTL_MS) continue;
    const entitlement = normalizeForStore(store.users[reservation.userKey], now);
    entitlement.aiCredits.reserved = Math.max(0, Number(entitlement.aiCredits.reserved || 0) - Number(reservation.cost || 0));
    reservation.status = "expired_refunded";
    reservation.refundedAt = now.toISOString();
    store.users[reservation.userKey] = normalizeForStore(entitlement, now);
    audit(store, reservation.userKey, "credit_reservation_expired", { reservationId: reservation.id, cost: reservation.cost }, now);
  }
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

const createStoreError = (code, message, status) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
};

const validateWaitlistData = (data = {}) => {
  const email = normalizeEmail(data.email);
  if (!email || !isValidEmail(email)) {
    throw createStoreError("operation_failed", "Bitte gib eine gültige E-Mail-Adresse für die Pro-Warteliste ein.", 400);
  }
  if (!data.consent) {
    throw createStoreError("forbidden", "Bitte bestätige, dass Lynxly dich zur Pro-Warteliste kontaktieren darf.", 403);
  }
  return {
    email,
    consentAt: data.consentAt || "",
    privacyPolicyVersion: String(data.privacyPolicyVersion || PRIVACY_POLICY_VERSION).slice(0, 40)
  };
};

const getEntitlement = async (userKey, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const entitlement = normalizeForStore(store.users[key], now);
  store.users[key] = entitlement;
  return entitlement;
});

const setEntitlement = async (userKey, entitlement, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const normalized = normalizeForStore(entitlement, now);
  store.users[key] = normalized;
  return normalized;
});

const startTrial = async (userKey, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const current = normalizeForStore(store.users[key], now);
  const result = startTrialEntitlement(current, now);
  if (result.started) {
    store.users[key] = normalizeForStore(result.entitlement, now);
    result.entitlement = store.users[key];
    audit(store, key, "trial_started", { endsAt: result.entitlement.trial.endsAt }, now);
  }
  return result;
});

const activateExamPassDemo = async (userKey, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const current = normalizeForStore(store.users[key], now);
  store.users[key] = normalizeForStore(activateExamPassEntitlement(current, now), now);
  audit(store, key, "exam_pass_demo_activated", { endsAt: store.users[key].examPass.endsAt }, now);
  return store.users[key];
});

const joinProWaitlist = async (userKey, data = {}, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const entitlement = normalizeForStore(store.users[key], now);
  const waitlist = validateWaitlistData(data);
  if (entitlement.proWaitlist?.active && normalizeEmail(entitlement.proWaitlist.email) === waitlist.email) {
    throw createStoreError("already_exists", "Du bist mit dieser E-Mail bereits auf der Pro-Warteliste.", 409);
  }
  entitlement.proWaitlist = {
    active: true,
    email: waitlist.email.slice(0, 180),
    consentAt: waitlist.consentAt || now.toISOString(),
    privacyPolicyVersion: waitlist.privacyPolicyVersion,
    signupAt: entitlement.proWaitlist?.signupAt || now.toISOString(),
    unsubscribedAt: ""
  };
  store.users[key] = normalizeForStore(entitlement, now);
  audit(store, key, "pro_waitlist_joined", { email: waitlist.email, privacyPolicyVersion: waitlist.privacyPolicyVersion }, now);
  return store.users[key];
});

const leaveProWaitlist = async (userKey, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const entitlement = normalizeForStore(store.users[key], now);
  entitlement.proWaitlist = {
    ...(entitlement.proWaitlist || {}),
    active: false,
    unsubscribedAt: now.toISOString()
  };
  store.users[key] = normalizeForStore(entitlement, now);
  audit(store, key, "pro_waitlist_left", {}, now);
  return store.users[key];
});

const checkAction = async (userKey, action, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const entitlement = normalizeForStore(store.users[key], now);
  store.users[key] = entitlement;
  return canUseAction(entitlement, action, { now, requireServerVerified: true });
});

const reserveCredits = async (userKey, action, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const entitlement = normalizeForStore(store.users[key], now);
  const permission = canUseAction(entitlement, action, { now, requireServerVerified: true });
  if (!permission.allowed) {
    store.users[key] = entitlement;
    return { reserved: false, permission, entitlement };
  }

  const cost = Number(permission.cost || 0);
  const reservationId = `res_${crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex")}`;
  entitlement.aiCredits.reserved = Number(entitlement.aiCredits.reserved || 0) + cost;
  store.users[key] = normalizeForStore(entitlement, now);
  store.reservations[reservationId] = {
    id: reservationId,
    userKey: key,
    action,
    cost,
    status: "reserved",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RESERVATION_TTL_MS).toISOString()
  };
  audit(store, key, "credit_reserved", { reservationId, action, cost }, now);
  return { reserved: true, reservationId, cost, entitlement: store.users[key], permission };
});

const completeCreditCharge = async (userKey, reservationId, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const reservation = store.reservations[reservationId];
  const entitlement = normalizeForStore(store.users[key], now);
  if (!reservation || reservation.userKey !== key || reservation.status !== "reserved") {
    store.users[key] = entitlement;
    return { completed: false, entitlement, reason: "reservation_not_found" };
  }
  entitlement.aiCredits.reserved = Math.max(0, Number(entitlement.aiCredits.reserved || 0) - Number(reservation.cost || 0));
  entitlement.aiCredits.used = Math.min(
    Number(entitlement.aiCredits.allowance || 0),
    Number(entitlement.aiCredits.used || 0) + Number(reservation.cost || 0)
  );
  reservation.status = "completed";
  reservation.completedAt = now.toISOString();
  store.users[key] = normalizeForStore(entitlement, now);
  audit(store, key, "credit_charged", { reservationId, action: reservation.action, cost: reservation.cost }, now);
  return { completed: true, consumed: Number(reservation.cost || 0), entitlement: store.users[key] };
});

const refundReservedCredits = async (userKey, reservationId, now = new Date()) => withStoreMutation((store) => {
  const key = safeUserKey(userKey);
  const reservation = store.reservations[reservationId];
  const entitlement = normalizeForStore(store.users[key], now);
  if (!reservation || reservation.userKey !== key || reservation.status !== "reserved") {
    store.users[key] = entitlement;
    return { refunded: false, entitlement, reason: "reservation_not_found" };
  }
  entitlement.aiCredits.reserved = Math.max(0, Number(entitlement.aiCredits.reserved || 0) - Number(reservation.cost || 0));
  reservation.status = "refunded";
  reservation.refundedAt = now.toISOString();
  store.users[key] = normalizeForStore(entitlement, now);
  audit(store, key, "credit_refunded", { reservationId, action: reservation.action, cost: reservation.cost }, now);
  return { refunded: true, refundedCredits: Number(reservation.cost || 0), entitlement: store.users[key] };
});

module.exports = {
  getEntitlement,
  setEntitlement,
  startTrial,
  activateExamPassDemo,
  joinProWaitlist,
  leaveProWaitlist,
  checkAction,
  reserveCredits,
  completeCreditCharge,
  refundReservedCredits,
  safeUserKey,
  storePath,
  normalizeEmail,
  isValidEmail,
  validateWaitlistData,
  cleanupExpiredReservations,
  RESERVATION_TTL_MS,
  PRIVACY_POLICY_VERSION
};
