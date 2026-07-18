const crypto = require("crypto");
const entitlements = require("./entitlements-store");
const { PREMIUM_CONFIG } = require("./premium-core");

const COOKIE_NAME = "lynxly_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_ROTATE_AFTER_SECONDS = 60 * 60 * 24 * 7;
const DEVELOPMENT_SESSION_SECRET = "development-only-lynxly-session-secret-change-me";
const SESSION_SECRET = process.env.LYNXLY_SESSION_SECRET || DEVELOPMENT_SESSION_SECRET;
const REQUIRED_PRODUCTION_ENV = [
  "LYNXLY_SESSION_SECRET",
  "ALLOWED_FRONTEND_ORIGIN"
];

const errorMessages = {
  authentication_required: "Authentication required.",
  plan_required: "This action is not included in your current plan.",
  credits_exhausted: "No AI credits left.",
  forbidden: "Forbidden.",
  already_exists: "This resource already exists.",
  file_too_large: "The uploaded file is too large.",
  unsupported_file_type: "This file type is not supported.",
  rate_limited: "Too many requests.",
  operation_failed: "The operation failed.",
  provider_unavailable: "The AI provider is temporarily unavailable."
};

const requireProductionConfig = (env = process.env) => {
  if (env.NODE_ENV !== "production") return true;
  const missing = REQUIRED_PRODUCTION_ENV.filter((key) => !String(env[key] || "").trim());
  if (env.LYNXLY_SESSION_SECRET === DEVELOPMENT_SESSION_SECRET) missing.push("LYNXLY_SESSION_SECRET");
  if (missing.length) {
    const error = new Error(`Missing required production configuration: ${[...new Set(missing)].join(", ")}`);
    error.code = "production_config_missing";
    throw error;
  }
  return true;
};

requireProductionConfig();

const parseCookies = (header = "") => Object.fromEntries(
  String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    })
);

const base64url = (value) => Buffer.from(value).toString("base64url");
const unbase64url = (value) => Buffer.from(value, "base64url").toString("utf8");
const hmac = (value) => crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");

const createSessionToken = (sessionId = crypto.randomUUID(), nowMs = Date.now()) => {
  const payload = {
    sid: sessionId,
    iat: nowMs,
    exp: nowMs + SESSION_TTL_SECONDS * 1000
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${hmac(encoded)}`;
};

const verifySessionToken = (token, nowMs = Date.now()) => {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) return null;
  const expected = hmac(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(unbase64url(encoded));
    if (!payload.sid || !payload.exp || payload.exp <= nowMs) return null;
    return payload;
  } catch (error) {
    return null;
  }
};

const serializeSessionCookie = (token) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
};

const appendSetCookie = (res, cookie) => {
  if (!res || !cookie) return;
  if (typeof res.getHeader === "function" && typeof res.setHeader === "function") {
    const existing = res.getHeader("Set-Cookie");
    const values = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
    res.setHeader("Set-Cookie", [...values, cookie]);
    return;
  }
  if (typeof res.setHeader === "function") {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  if (typeof res.setHeader !== "function" && typeof res.setHeader === "undefined" && typeof res.set === "function") {
    res.set("Set-Cookie", cookie);
  }
};

const rejectClientIdentityHeaders = (req) => Boolean(req.headers?.["x-lynxly-user"] || req.headers?.["x-studyup-user"]);

const getAuthenticatedUser = (req, res, options = {}) => {
  if (rejectClientIdentityHeaders(req)) {
    const error = new Error("Client-controlled identity headers are not accepted.");
    error.code = "authentication_required";
    throw error;
  }

  const cookies = parseCookies(req.headers?.cookie || "");
  const nowMs = Date.now();
  let payload = verifySessionToken(cookies[COOKIE_NAME], nowMs);
  let token = cookies[COOKIE_NAME];
  if (!payload && options.issue !== false) {
    token = createSessionToken(undefined, nowMs);
    payload = verifySessionToken(token, nowMs);
    appendSetCookie(res, serializeSessionCookie(token));
  }
  if (!payload) {
    const error = new Error("Missing or invalid Lynxly session.");
    error.code = "authentication_required";
    throw error;
  }
  if (payload.iat && nowMs - Number(payload.iat) > SESSION_ROTATE_AFTER_SECONDS * 1000 && options.issue !== false) {
    token = createSessionToken(payload.sid, nowMs);
    appendSetCookie(res, serializeSessionCookie(token));
  }
  return { id: `session:${payload.sid}`, anonymous: true, sessionId: payload.sid };
};

const sendJson = (res, status, data) => {
  if (typeof res.writeHead === "function") {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(JSON.stringify(data));
    return;
  }
  if (typeof res.setHeader === "function") res.setHeader("Cache-Control", "no-store");
  res.status(status).json(data);
};

const sendError = (res, status, code, details = {}) => sendJson(res, status, {
  error: code,
  message: details.message || errorMessages[code] || code,
  ...details
});

const statusForPermission = (reason) => {
  if (reason === "plan_required" || reason === "exam_pass_required") return 402;
  if (reason === "credits_exhausted") return 402;
  if (reason === "rate_limited") return 429;
  if (reason === "server_required") return 403;
  return 403;
};

const statusForErrorCode = (code) => ({
  authentication_required: 401,
  plan_required: 402,
  credits_exhausted: 402,
  forbidden: 403,
  already_exists: 409,
  file_too_large: 413,
  unsupported_file_type: 415,
  rate_limited: 429,
  provider_unavailable: 503,
  operation_failed: 500
})[code] || 500;

const setSecurityHeaders = (req, res) => {
  if (!res || typeof res.setHeader !== "function") return;
  const isProduction = process.env.NODE_ENV === "production";
  const api = String(req?.url || "").startsWith("/api/");
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self'"
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (api) res.setHeader("Cache-Control", "no-store");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
};

const trustedOrigins = () => {
  const configured = String(process.env.ALLOWED_FRONTEND_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    configured.push("http://127.0.0.1:4173", "http://localhost:4173");
  }
  return new Set(configured);
};

const assertTrustedOrigin = (req) => {
  const method = String(req?.method || "GET").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;
  const origin = req?.headers?.origin || "";
  const referer = req?.headers?.referer || "";
  if (!origin && process.env.NODE_ENV !== "production") return true;
  let candidate = origin;
  if (!candidate && referer) {
    try {
      const url = new URL(referer);
      candidate = `${url.protocol}//${url.host}`;
    } catch (_) {}
  }
  if (!candidate || !trustedOrigins().has(candidate)) {
    const error = new Error("Request origin is not allowed.");
    error.code = "forbidden";
    error.status = 403;
    throw error;
  }
  return true;
};

const rateBuckets = new Map();
const RATE_LIMITS = {
  trial_start: { limit: 3, windowMs: 60 * 60 * 1000 },
  pro_waitlist: { limit: 5, windowMs: 60 * 60 * 1000 },
  checkout_create: { limit: 6, windowMs: 60 * 60 * 1000 },
  chat_short: { limit: 30, windowMs: 60 * 1000 },
  generate_cards: { limit: 12, windowMs: 60 * 1000 },
  generate_quiz_summary: { limit: 12, windowMs: 60 * 1000 },
  smart_study_plan: { limit: 8, windowMs: 60 * 1000 },
  adaptive_mistake_explanation: { limit: 20, windowMs: 60 * 1000 },
  extract_image: { limit: 8, windowMs: 60 * 1000 },
  extract_pdf: { limit: 5, windowMs: 60 * 1000 },
  exam_simulation: { limit: 4, windowMs: 60 * 1000 },
  default: { limit: 60, windowMs: 60 * 1000 }
};

const clientIp = (req) => String(req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "local")
  .split(",")[0]
  .trim()
  .slice(0, 80);

const rateIdentity = (req, user) => {
  if (user?.sessionId) return `session:${user.sessionId}`;
  const cookies = parseCookies(req?.headers?.cookie || "");
  const payload = verifySessionToken(cookies[COOKIE_NAME]);
  return payload?.sid ? `session:${payload.sid}` : "anonymous";
};

const enforceSingleRateLimit = (key, limit, windowMs, nowMs) => {
  const existing = rateBuckets.get(key);
  if (!existing || existing.resetAt <= nowMs) {
    rateBuckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return null;
  }
  existing.count += 1;
  if (existing.count > limit) {
    return Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1000));
  }
  return null;
};

const enforceRateLimit = (req, action = "default", user = null, overrides = {}) => {
  const config = { ...(RATE_LIMITS[action] || RATE_LIMITS.default), ...overrides };
  const nowMs = Date.now();
  const keys = [
    `ip:${clientIp(req)}:${action}`,
    `${rateIdentity(req, user)}:${action}`
  ];
  const retryAfter = keys
    .map((key) => enforceSingleRateLimit(key, config.limit, config.windowMs, nowMs))
    .filter(Boolean)[0];
  if (retryAfter) {
    const error = new Error("Too many requests.");
    error.code = "rate_limited";
    error.status = 429;
    error.retryAfter = retryAfter;
    throw error;
  }
  return true;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 45_000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: options.signal || controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Provider request timed out.");
      timeoutError.code = "provider_unavailable";
      timeoutError.status = 503;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const getCurrentEntitlement = async (user, now = new Date()) => entitlements.getEntitlement(user.id, now);

const requirePlanForAction = async (user, action, now = new Date()) => {
  const permission = await entitlements.checkAction(user.id, action, now);
  if (!permission.allowed) {
    const error = new Error(permission.reason);
    error.code = permission.reason === "exam_pass_required" ? "plan_required" : permission.reason;
    error.status = statusForPermission(permission.reason);
    error.permission = permission;
    throw error;
  }
  return permission;
};

const reserveCredits = async (user, action, now = new Date()) => {
  const reservation = await entitlements.reserveCredits(user.id, action, now);
  if (!reservation.reserved) {
    const reason = reservation.permission?.reason || "forbidden";
    const error = new Error(reason);
    error.code = reason === "exam_pass_required" ? "plan_required" : reason;
    error.status = statusForPermission(reason);
    error.permission = reservation.permission;
    throw error;
  }
  return reservation;
};

const completeCreditCharge = async (user, reservationId, now = new Date()) => entitlements.completeCreditCharge(user.id, reservationId, now);
const refundReservedCredits = async (user, reservationId, now = new Date()) => entitlements.refundReservedCredits(user.id, reservationId, now);

const handleApiError = async (res, error, user, reservationId) => {
  if (user && reservationId) await refundReservedCredits(user, reservationId);
  const code = error.code || "operation_failed";
  const status = error.status || statusForErrorCode(code);
  const details = { reason: error.permission?.reason, cost: error.permission?.cost };
  if (error.retryAfter) details.retryAfter = error.retryAfter;
  if (code === "operation_failed" && error.message) details.message = error.message;
  if (code === "provider_unavailable" && error.message) details.message = error.message;
  sendError(res, status, code, details);
};

module.exports = {
  COOKIE_NAME,
  PREMIUM_CONFIG,
  parseCookies,
  createSessionToken,
  verifySessionToken,
  getAuthenticatedUser,
  getCurrentEntitlement,
  requirePlanForAction,
  reserveCredits,
  completeCreditCharge,
  refundReservedCredits,
  sendJson,
  sendError,
  handleApiError,
  serializeSessionCookie,
  requireProductionConfig,
  setSecurityHeaders,
  assertTrustedOrigin,
  enforceRateLimit,
  fetchWithTimeout,
  statusForErrorCode,
  RATE_LIMITS
};
