const {
  assertTrustedOrigin,
  enforceRateLimit,
  getAuthenticatedUser,
  handleApiError,
  sendError,
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
    enforceRateLimit(req, "checkout_create", user);
  } catch (error) {
    await handleApiError(res, error);
    return;
  }
  sendError(res, 503, "provider_unavailable", {
    message: "Checkout is not connected yet. Add a payment provider integration before enabling Exam Pass purchases."
  });
};
