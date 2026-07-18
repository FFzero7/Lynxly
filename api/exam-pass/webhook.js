const { sendError, setSecurityHeaders } = require("../../server-security");

module.exports = async (req, res) => {
  setSecurityHeaders(req, res);
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }

  const signature = req.headers?.["x-lynxly-webhook-signature"];
  if (!signature) {
    sendError(res, 403, "forbidden", {
      message: "Signed webhook verification is required before activating Exam Pass entitlements."
    });
    return;
  }

  sendError(res, 503, "provider_unavailable", {
    message: "Payment webhook handling is a placeholder. Connect and verify a real payment provider before production activation."
  });
};
