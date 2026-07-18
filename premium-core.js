const PREMIUM_CONFIG = require("./src/premium-config");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const premiumActions = new Set(PREMIUM_CONFIG.premiumActions || []);

const iso = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const monthKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const addDaysIso = (dateValue, days) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  date.setTime(date.getTime() + Number(days || 0) * MS_PER_DAY);
  return date.toISOString();
};

const isFuture = (dateValue, now = new Date()) => Boolean(dateValue && new Date(dateValue).getTime() > now.getTime());

const allowanceForPlan = (plan) => {
  const item = PREMIUM_CONFIG.plans[plan] || PREMIUM_CONFIG.plans.free;
  return Number(item.monthlyCredits || PREMIUM_CONFIG.plans.free.monthlyCredits || 10);
};

const defaultEntitlement = (now = new Date()) => ({
  plan: "free",
  billingCycle: PREMIUM_CONFIG.defaultBillingCycle || "annual",
  paidSubscription: false,
  serverVerified: true,
  trial: { used: false, active: false, startedAt: "", endsAt: "" },
  examPass: { active: false, startedAt: "", endsAt: "" },
  proWaitlist: { active: false, email: "", consentAt: "", signupAt: "", unsubscribedAt: "" },
  aiCredits: {
    month: monthKey(now),
    used: 0,
    reserved: 0,
    allowance: allowanceForPlan("free")
  }
});

const normalizeWaitlist = (value) => {
  if (value && typeof value === "object") {
    return {
      active: Boolean(value.active),
      email: String(value.email || ""),
      consentAt: value.consentAt || "",
      signupAt: value.signupAt || "",
      unsubscribedAt: value.unsubscribedAt || ""
    };
  }
  return { active: Boolean(value), email: "", consentAt: "", signupAt: "", unsubscribedAt: "" };
};

const normalizeEntitlement = (raw = {}, nowValue = new Date()) => {
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);
  const base = defaultEntitlement(now);
  const trial = { ...base.trial, ...(raw.trial || {}) };
  const examPass = { ...base.examPass, ...(raw.examPass || {}) };
  const paidSubscription = Boolean(raw.paidSubscription);
  let plan = ["free", "plus", "exam_pass", "pro"].includes(raw.plan) ? raw.plan : "free";

  trial.active = Boolean(trial.startedAt && isFuture(trial.endsAt, now));
  trial.used = Boolean(trial.used || trial.startedAt);
  examPass.active = Boolean(examPass.startedAt && isFuture(examPass.endsAt, now));

  if (examPass.active) {
    plan = "exam_pass";
  } else if (paidSubscription || trial.active) {
    plan = "plus";
  } else {
    plan = "free";
  }

  const existingCredits = { ...base.aiCredits, ...(raw.aiCredits || {}) };
  const expectedCreditPeriod = plan === "exam_pass"
    ? (String(existingCredits.month || "").startsWith("exam:")
      ? existingCredits.month
      : `exam:${examPass.startedAt || monthKey(now)}`)
    : monthKey(now);
  const sameCreditPeriod = existingCredits.month === expectedCreditPeriod;
  const used = sameCreditPeriod ? Math.max(0, Number(existingCredits.used || 0)) : 0;
  const reserved = sameCreditPeriod ? Math.max(0, Number(existingCredits.reserved || 0)) : 0;
  const allowance = allowanceForPlan(plan);

  return {
    ...base,
    ...raw,
    plan,
    billingCycle: raw.billingCycle === "monthly" ? "monthly" : "annual",
    paidSubscription,
    serverVerified: raw.serverVerified !== false,
    trial,
    examPass,
    proWaitlist: normalizeWaitlist(raw.proWaitlist),
    aiCredits: { month: expectedCreditPeriod, used, reserved, allowance }
  };
};

const currentPlan = (entitlement, now = new Date()) => normalizeEntitlement(entitlement, now).plan;
const isPlus = (entitlement, now = new Date()) => ["plus", "exam_pass"].includes(currentPlan(entitlement, now));
const isExamPass = (entitlement, now = new Date()) => currentPlan(entitlement, now) === "exam_pass";
const isPro = () => false;
const planLabel = (plan) => (PREMIUM_CONFIG.plans[plan] || PREMIUM_CONFIG.plans.free).label;

const actionCost = (action) => Number(PREMIUM_CONFIG.creditCosts[action] || 0);
const requiresPremium = (action) => premiumActions.has(action);

const canUseAction = (rawEntitlement, action, options = {}) => {
  const entitlement = normalizeEntitlement(rawEntitlement, options.now || new Date());
  const cost = actionCost(action);
  if (options.requireServerVerified && entitlement.serverVerified === false) {
    return { allowed: false, reason: "server_required", cost, entitlement };
  }
  if (action === "exam_simulation" && !isExamPass(entitlement)) {
    return { allowed: false, reason: "exam_pass_required", cost, entitlement };
  }
  if (requiresPremium(action) && !isPlus(entitlement)) {
    return { allowed: false, reason: "plan_required", cost, entitlement };
  }
  const remaining = Number(entitlement.aiCredits.allowance || 0)
    - Number(entitlement.aiCredits.used || 0)
    - Number(entitlement.aiCredits.reserved || 0);
  if (cost > 0 && remaining < cost) {
    return { allowed: false, reason: "credits_exhausted", cost, remaining, entitlement };
  }
  return { allowed: true, reason: "ok", cost, remaining, entitlement };
};

const consumeCredits = (rawEntitlement, action, options = {}) => {
  const permission = canUseAction(rawEntitlement, action, options);
  if (!permission.allowed) return { entitlement: permission.entitlement, consumed: 0, permission };
  const cost = options.cost !== undefined ? Number(options.cost || 0) : permission.cost;
  const entitlement = normalizeEntitlement(permission.entitlement, options.now || new Date());
  entitlement.aiCredits.used = Math.min(
    Number(entitlement.aiCredits.allowance || 0),
    Number(entitlement.aiCredits.used || 0) + Math.max(0, cost)
  );
  return { entitlement, consumed: Math.max(0, cost), permission };
};

const startTrialEntitlement = (rawEntitlement, nowValue = new Date()) => {
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);
  const entitlement = normalizeEntitlement(rawEntitlement, now);
  if (entitlement.trial.used) {
    return { entitlement, started: false, reason: "trial_already_used" };
  }
  entitlement.trial = {
    used: true,
    active: true,
    startedAt: now.toISOString(),
    endsAt: addDaysIso(now, PREMIUM_CONFIG.trialDays)
  };
  entitlement.plan = "plus";
  entitlement.paidSubscription = false;
  entitlement.aiCredits.allowance = allowanceForPlan("plus");
  return { entitlement: normalizeEntitlement(entitlement, now), started: true, reason: "ok" };
};

const activateExamPassEntitlement = (rawEntitlement, nowValue = new Date()) => {
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);
  const entitlement = normalizeEntitlement(rawEntitlement, now);
  entitlement.examPass = {
    active: true,
    startedAt: now.toISOString(),
    endsAt: addDaysIso(now, PREMIUM_CONFIG.examPassDays)
  };
  entitlement.plan = "exam_pass";
  entitlement.aiCredits = {
    month: `exam:${entitlement.examPass.startedAt}`,
    used: 0,
    reserved: 0,
    allowance: allowanceForPlan("exam_pass")
  };
  return normalizeEntitlement(entitlement, now);
};

const canActivatePlan = (plan) => plan === "plus" || plan === "free";

module.exports = {
  PREMIUM_CONFIG,
  monthKey,
  addDaysIso,
  normalizeEntitlement,
  currentPlan,
  isPlus,
  isPro,
  isExamPass,
  planLabel,
  actionCost,
  requiresPremium,
  canUseAction,
  consumeCredits,
  startTrialEntitlement,
  activateExamPassEntitlement,
  canActivatePlan,
  iso
};
