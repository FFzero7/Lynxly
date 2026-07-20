const {
  assertTrustedOrigin,
  clearSessionCookie,
  getAuthenticatedUser,
  handleApiError,
  revokeSessionId,
  sendJson,
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
    const user = getAuthenticatedUser(req, res, { issue: false });
    revokeSessionId(user.sessionId);
  } catch (error) {
    if (error.code !== "authentication_required") {
      await handleApiError(res, error);
      return;
    }
  }
  if (typeof res.setHeader === "function") res.setHeader("Set-Cookie", clearSessionCookie());
  sendJson(res, 200, {
    ok: true,
    message: "Du wurdest abgemeldet. Lokale Lerninhalte bleiben erhalten."
  });
};
