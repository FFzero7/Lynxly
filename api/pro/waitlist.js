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
    enforceRateLimit(req, "pro_waitlist", user);
    const action = req.body?.action === "unsubscribe" ? "unsubscribe" : "join";
    const entitlement = action === "unsubscribe"
      ? await entitlements.leaveProWaitlist(user.id)
      : await entitlements.joinProWaitlist(user.id, { email: req.body?.email, consent: Boolean(req.body?.consent) });
    res.status(200).json({
      entitlement,
      message: action === "unsubscribe" ? "Du bist von der Pro-Warteliste abgemeldet." : "Du bist auf der Pro-Warteliste."
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};
