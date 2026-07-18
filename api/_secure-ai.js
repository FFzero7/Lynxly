const {
  getAuthenticatedUser,
  assertTrustedOrigin,
  enforceRateLimit,
  reserveCredits,
  completeCreditCharge,
  refundReservedCredits,
  handleApiError,
  setSecurityHeaders
} = require("../server-security");

const runSecureAi = async (req, res, action, operation) => {
  let user = null;
  let reservationId = "";
  try {
    setSecurityHeaders(req, res);
    assertTrustedOrigin(req);
    user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, action, user);
    const reservation = await reserveCredits(user, action);
    reservationId = reservation.reservationId;
    const result = await operation(user, reservation.entitlement);
    const body = result.body || result;
    if (result.charge === false || body.offline || (result.status && result.status >= 400)) {
      const refunded = await refundReservedCredits(user, reservationId);
      body.entitlement = refunded.entitlement;
      body.creditsConsumed = 0;
    } else {
      const charged = await completeCreditCharge(user, reservationId);
      body.entitlement = charged.entitlement;
      body.creditsConsumed = charged.consumed || 0;
    }
    res.status(result.status || 200).json(body);
  } catch (error) {
    await handleApiError(res, error, user, reservationId);
  }
};

const helperRoute = (req, res) => {
  setSecurityHeaders(req, res);
  res.status(404).json({ error: "forbidden", message: "This helper is not a public API route." });
};

helperRoute.runSecureAi = runSecureAi;

module.exports = helperRoute;
