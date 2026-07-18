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
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({
      error: "forbidden",
      message: "Demo activation is disabled in production. Use checkout creation and signed webhook confirmation."
    });
    return;
  }
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }
  try {
    assertTrustedOrigin(req);
    const user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, "checkout_create", user);
    res.status(200).json({
      entitlement: await entitlements.activateExamPassDemo(user.id),
      message: "Development demo: Exam Pass ist 14 Tage aktiv."
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};
