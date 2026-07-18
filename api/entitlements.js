const {
  PREMIUM_CONFIG,
  getAuthenticatedUser,
  getCurrentEntitlement,
  handleApiError,
  setSecurityHeaders
} = require("../server-security");

module.exports = async (req, res) => {
  setSecurityHeaders(req, res);
  if (req.method !== "GET") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res);
    res.status(200).json({
      entitlement: await getCurrentEntitlement(user),
      config: { creditCosts: PREMIUM_CONFIG.creditCosts, plans: PREMIUM_CONFIG.plans }
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};
