const {
  studyMaterialsInstructions,
  buildStudyMaterialsInput,
  parseStudyMaterials
} = require("../study-materials-core");
const { runSecureAi } = require("./_secure-ai");
const { fetchWithTimeout } = require("../server-security");

const providerUnavailable = (message) => {
  const error = new Error(message || "KI-Generierung fehlgeschlagen");
  error.code = "provider_unavailable";
  error.status = 503;
  return error;
};

const studyMaterialAction = (options = {}) => {
  const types = Array.isArray(options.types) ? options.types : [];
  if (types.includes("plan")) return "smart_study_plan";
  if (types.includes("quiz") || types.includes("summary")) return "generate_quiz_summary";
  return "generate_cards";
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }

  await runSecureAi(req, res, studyMaterialAction(req.body?.options || {}), async () => {
    const notes = String(req.body?.notes || "").trim();
    const options = req.body?.options || {};
    if (!notes) return { status: 400, body: { error: "operation_failed", message: "Notizen fehlen." }, charge: false };
    if (notes.length > 24_000) {
      return { status: 400, body: { error: "operation_failed", message: "Die Notizen sind zu lang. Bitte kürze sie auf etwa 24.000 Zeichen." }, charge: false };
    }
    if (!process.env.OPENAI_API_KEY) {
      return {
        materials: null,
        offline: true,
        charge: false,
        warning: "Kein OPENAI_API_KEY konfiguriert. Lynxly verwendet den lokalen Generator."
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
        instructions: studyMaterialsInstructions,
        input: buildStudyMaterialsInput(notes, options)
      })
    });
    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      throw new Error("Die KI hat keine gültige JSON-Antwort geliefert.");
    }
    if (!response.ok) throw providerUnavailable(data.error?.message || "KI-Generierung fehlgeschlagen");
    return { materials: parseStudyMaterials(data.output_text), offline: false };
  });
};
