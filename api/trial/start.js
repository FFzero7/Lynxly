const entitlements = require("../../entitlements-store");
const {
  assertTrustedOrigin,
  enforceRateLimit,
  getAuthenticatedUser,
  handleApiError,
  setSecurityHeaders
} = require("../../server-security");

module.exports = async (req, res) => {
  setSecurityHeaders(req, res);
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }
  try {
    assertTrustedOrigin(req);
    const user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, "trial_start", user);
    const result = await entitlements.startTrial(user.id);
    res.status(result.started ? 200 : 402).json(result.started
      ? { entitlement: result.entitlement, message: "Plus-Testphase gestartet." }
      : { error: "plan_required", message: "Die Plus-Testphase wurde bereits genutzt.", reason: result.reason, entitlement: result.entitlement });
  } catch (error) {
    await handleApiError(res, error);
  }
};
