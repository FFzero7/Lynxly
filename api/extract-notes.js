const { runSecureAi } = require("./_secure-ai");
const { fetchWithTimeout } = require("../server-security");
const {
  dataUrlForUpload,
  parseUploadRequest,
  scanUpload,
  textForUpload
} = require("../upload-security");

const safeJson = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const providerUnavailable = (message) => {
  const error = new Error(message || "Texterkennung fehlgeschlagen");
  error.code = "provider_unavailable";
  error.status = 503;
  return error;
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(403).json({ error: "forbidden", message: "Method not allowed." });
    return;
  }

  let upload;
  try {
    upload = await parseUploadRequest(req);
    const scan = await scanUpload(upload);
    if (!scan.ok) {
      res.status(403).json({ error: "forbidden", message: "Die Datei konnte nicht sicher geprüft werden." });
      return;
    }
  } catch (error) {
    res.status(error.status || 400).json({ error: error.code || "operation_failed", message: error.message || "Upload fehlgeschlagen." });
    return;
  }

  const action = upload.kind === "image" ? "extract_image" : "extract_pdf";
  await runSecureAi(req, res, action, async () => {
    if (upload.kind === "text") {
      return { text: textForUpload(upload), offline: false, charge: false };
    }
    if (!process.env.OPENAI_API_KEY) {
      return {
        text: "",
        offline: true,
        charge: false,
        warning: "PDF- und Bilderkennung benötigt ein konfiguriertes OCR/KI-Backend."
      };
    }

    const fileData = dataUrlForUpload(upload);
    const content = upload.kind === "image"
      ? [
        { type: "input_text", text: "Extrahiere den vollständigen sichtbaren Lerntext. Behalte Überschriften und Listen. Antworte nur mit dem extrahierten Text." },
        { type: "input_image", image_url: fileData }
      ]
      : [
        { type: "input_text", text: "Extrahiere den vollständigen Lerntext aus dieser Datei. Behalte Überschriften und Listen. Antworte nur mit dem extrahierten Text." },
        { type: "input_file", filename: upload.fileName, file_data: fileData }
      ];
    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [{ role: "user", content }]
      })
    });
    const raw = await response.text();
    const data = safeJson(raw);
    if (!response.ok) throw providerUnavailable(data.error?.message || "Texterkennung fehlgeschlagen");
    return { text: String(data.output_text || "").trim(), offline: false };
  });
};
