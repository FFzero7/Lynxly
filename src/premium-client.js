(function () {
  const PREMIUM_CONFIG = window.LynxlyPremiumConfig || {
    plans: { free: { id: "free", label: "Free", monthlyCredits: 10 } },
    creditCosts: {},
    actionLabels: {},
    premiumActions: []
  };

  const monthKey = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const isFuture = (dateValue, now = new Date()) => Boolean(dateValue && new Date(dateValue).getTime() > now.getTime());
  const allowanceForPlan = (plan) => Number(PREMIUM_CONFIG.plans[plan]?.monthlyCredits || PREMIUM_CONFIG.plans.free?.monthlyCredits || 10);
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
    const trial = { used: false, active: false, startedAt: "", endsAt: "", ...(raw.trial || {}) };
    const examPass = { active: false, startedAt: "", endsAt: "", ...(raw.examPass || {}) };
    trial.active = Boolean(trial.startedAt && isFuture(trial.endsAt, now));
    trial.used = Boolean(trial.used || trial.startedAt);
    examPass.active = Boolean(examPass.startedAt && isFuture(examPass.endsAt, now));
    let plan = "free";
    if (examPass.active) plan = "exam_pass";
    else if (raw.paidSubscription || trial.active) plan = "plus";
    const existingCredits = raw.aiCredits || {};
    const currentPeriod = plan === "exam_pass"
      ? (String(existingCredits.month || "").startsWith("exam:")
        ? existingCredits.month
        : `exam:${examPass.startedAt || monthKey(now)}`)
      : monthKey(now);
    const samePeriod = existingCredits.month === currentPeriod;
    return {
      plan,
      billingCycle: raw.billingCycle === "monthly" ? "monthly" : "annual",
      paidSubscription: Boolean(raw.paidSubscription),
      serverVerified: raw.serverVerified !== false,
      trial,
      examPass,
      proWaitlist: normalizeWaitlist(raw.proWaitlist),
      aiCredits: {
        month: currentPeriod,
        used: samePeriod ? Math.max(0, Number(existingCredits.used || 0)) : 0,
        reserved: samePeriod ? Math.max(0, Number(existingCredits.reserved || 0)) : 0,
        allowance: allowanceForPlan(plan)
      }
    };
  };
  const currentPlan = (entitlement) => normalizeEntitlement(entitlement).plan;
  const isPlus = (entitlement) => ["plus", "exam_pass"].includes(currentPlan(entitlement));
  const isPro = () => false;
  const planLabel = (plan) => (PREMIUM_CONFIG.plans[plan] || PREMIUM_CONFIG.plans.free).label;
  const actionCost = (action) => Number(PREMIUM_CONFIG.creditCosts[action] || 0);
  const actionLabel = (action) => PREMIUM_CONFIG.actionLabels?.[action] || action;
  const requiresPremium = (action) => (PREMIUM_CONFIG.premiumActions || []).includes(action);

  window.LynxlyPremium = {
    PREMIUM_CONFIG,
    normalizeEntitlement,
    currentPlan,
    isPlus,
    isPro,
    planLabel,
    actionCost,
    actionLabel,
    requiresPremium,
    monthKey
  };
})();
