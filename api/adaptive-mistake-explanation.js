const {
  adaptiveAiContext,
  adaptiveAiInstructions,
  adaptiveMistakeMarkdown,
  buildAdaptiveMistakeExplanation,
  normalizeAdaptiveAiExplanation
} = require("../adaptive-explanation-core");
const { runSecureAi } = require("./_secure-ai");
const {
  assertTrustedOrigin,
  enforceRateLimit,
  fetchWithTimeout,
  getAuthenticatedUser,
  getCurrentEntitlement,
  handleApiError,
  setSecurityHeaders
} = require("../server-security");

const validateMistake = (mistake = {}) => {
  if (!mistake.question && !mistake.correctAnswer) {
    const error = new Error("Fehlerdaten fehlen.");
    error.code = "operation_failed";
    error.status = 400;
    throw error;
  }
};

const providerUnavailable = (message) => {
  const error = new Error(message || "Adaptive KI-Erklärung fehlgeschlagen.");
  error.code = "provider_unavailable";
  error.status = 503;
  return error;
};

const basicResponse = async (req, res, mistake) => {
  let user = null;
  try {
    setSecurityHeaders(req, res);
    assertTrustedOrigin(req);
    user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, "adaptive_mistake_explanation", user, { limit: 40, windowMs: 60 * 1000 });
    const explanation = buildAdaptiveMistakeExplanation(mistake);
    res.status(200).json({
      explanation,
      markdown: adaptiveMistakeMarkdown(mistake, explanation),
      basic: true,
      offline: true,
      creditsConsumed: 0,
      entitlement: await getCurrentEntitlement(user),
      warning: "Basic-Erklärung ohne KI-Credits."
    });
  } catch (error) {
    await handleApiError(res, error, user);
  }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }

  const mistake = req.body?.mistake || {};
  try {
    validateMistake(mistake);
  } catch (error) {
    await handleApiError(res, error);
    return;
  }

  if (req.body?.mode === "basic" || !process.env.OPENAI_API_KEY) {
    await basicResponse(req, res, mistake);
    return;
  }

  await runSecureAi(req, res, "adaptive_mistake_explanation", async () => {
    const context = adaptiveAiContext(mistake, req.body?.profile || {});
    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: adaptiveAiInstructions,
        input: [
          {
            role: "user",
            content: `Erstelle eine adaptive Fehlererklärung aus diesem JSON-Kontext:\n${JSON.stringify(context)}`
          }
        ]
      })
    });
    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      throw providerUnavailable("Die KI hat keine gültige Antwort geliefert.");
    }
    if (!response.ok) throw providerUnavailable(data.error?.message || "Adaptive KI-Erklärung fehlgeschlagen.");
    const explanation = normalizeAdaptiveAiExplanation(data.output_text || {}, mistake);
    return {
      explanation,
      markdown: adaptiveMistakeMarkdown(mistake, explanation),
      adaptive: true,
      offline: false
    };
  });
};
