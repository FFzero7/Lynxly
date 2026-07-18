const { aiInstructions, buildAiInput, fallbackAnswer } = require("../ai-chat-core");
const { runSecureAi } = require("./_secure-ai");
const { fetchWithTimeout } = require("../server-security");

const providerUnavailable = (message) => {
  const error = new Error(message || "KI-Anfrage fehlgeschlagen");
  error.code = "provider_unavailable";
  error.status = 503;
  return error;
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }

  await runSecureAi(req, res, "chat_short", async () => {
    const message = req.body?.message || req.body?.attachmentName || "";
    const imageData = req.body?.imageData || "";
    const attachmentName = req.body?.attachmentName || "";

    if (!process.env.OPENAI_API_KEY) {
      return {
        answer: fallbackAnswer(message, Boolean(imageData)),
        offline: true,
        charge: false,
        warning: "Kein OPENAI_API_KEY konfiguriert. Lynxly nutzt den lokalen Demo-Modus."
      };
    }

    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: aiInstructions,
        input: buildAiInput(message, imageData, attachmentName)
      })
    });

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      throw new Error("KI-Antwort war kein JSON.");
    }
    if (!response.ok) throw providerUnavailable(data.error?.message || "KI-Anfrage fehlgeschlagen");
    return { answer: data.output_text || fallbackAnswer(message, Boolean(imageData)), offline: false };
  });
};
