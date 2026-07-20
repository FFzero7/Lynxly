const http = require("http");
const fs = require("fs");
const path = require("path");
const { aiInstructions, buildAiInput, fallbackAnswer } = require("./ai-chat-core");
const {
  studyMaterialsInstructions,
  buildStudyMaterialsInput,
  parseStudyMaterials
} = require("./study-materials-core");
const {
  adaptiveAiContext,
  adaptiveAiInstructions,
  adaptiveMistakeMarkdown,
  buildAdaptiveMistakeExplanation,
  normalizeAdaptiveAiExplanation
} = require("./adaptive-explanation-core");
const entitlements = require("./entitlements-store");
const {
  dataUrlForUpload,
  parseUploadRequest,
  scanUpload,
  textForUpload
} = require("./upload-security");
const {
  PREMIUM_CONFIG,
  assertTrustedOrigin,
  getAuthenticatedUser,
  getCurrentEntitlement,
  enforceRateLimit,
  fetchWithTimeout,
  reserveCredits,
  completeCreditCharge,
  refundReservedCredits,
  clearSessionCookie,
  revokeSessionId,
  sendJson,
  sendError,
  handleApiError,
  setSecurityHeaders
} = require("./server-security");

const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8"
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 9_000_000) {
      reject(new Error("Request too large"));
      req.destroy();
    }
  });
  req.on("end", () => resolve(body));
  req.on("error", reject);
});

const safeJson = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const providerUnavailable = (message) => {
  const error = new Error(message || "AI provider unavailable.");
  error.code = "provider_unavailable";
  error.status = 503;
  return error;
};

const callOpenAI = async (message, imageData, attachmentName) => {
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
  const text = await response.text();
  const data = safeJson(text);
  if (!response.ok) throw providerUnavailable(data.error?.message || "KI-Anfrage fehlgeschlagen");
  return data.output_text || fallbackAnswer(message, Boolean(imageData));
};

const runAiAction = async (req, res, action, operation) => {
  let user = null;
  let reservationId = "";
  try {
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
    sendJson(res, result.status || 200, body);
  } catch (error) {
    await handleApiError(res, error, user, reservationId);
  }
};

const handleChat = async (req, res) => runAiAction(req, res, "chat_short", async () => {
  const body = safeJson(await readBody(req));
  const message = body.message || body.attachmentName || "";
  const imageData = body.imageData || "";
  const attachmentName = body.attachmentName || "";
  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: fallbackAnswer(message, Boolean(imageData)),
      offline: true,
      charge: false,
      warning: "Kein OPENAI_API_KEY konfiguriert. Lynxly nutzt den lokalen Demo-Modus."
    };
  }
  const answer = await callOpenAI(message, imageData, attachmentName);
  return { answer, offline: false };
});

const studyMaterialAction = (options = {}) => {
  const types = Array.isArray(options.types) ? options.types : [];
  if (types.includes("plan")) return "smart_study_plan";
  if (types.includes("quiz") || types.includes("summary")) return "generate_quiz_summary";
  return "generate_cards";
};

const handleStudyMaterials = async (req, res) => {
  const body = safeJson(await readBody(req));
  return runAiAction(req, res, studyMaterialAction(body.options || {}), async () => {
  const notes = String(body.notes || "").trim();
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
      input: buildStudyMaterialsInput(notes, body.options || {})
    })
  });
  const text = await response.text();
  const data = safeJson(text);
  if (!response.ok) throw providerUnavailable(data.error?.message || "KI-Generierung fehlgeschlagen");
  return { materials: parseStudyMaterials(data.output_text), offline: false };
  });
};

const handleExtractNotes = async (req, res) => {
  try {
    const upload = await parseUploadRequest(req);
    const scan = await scanUpload(upload);
    if (!scan.ok) {
      sendError(res, 403, "forbidden", { message: "Die Datei konnte nicht sicher geprüft werden." });
      return;
    }
    const action = upload.kind === "image" ? "extract_image" : "extract_pdf";
    return runAiAction(req, res, action, async () => {
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
          { type: "input_file", filename: upload.fileName || "Notizen.pdf", file_data: fileData }
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
      const text = await response.text();
      const data = safeJson(text);
      if (!response.ok) throw providerUnavailable(data.error?.message || "Texterkennung fehlgeschlagen");
      return { text: String(data.output_text || "").trim(), offline: false };
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};
const validateMistakePayload = (mistake = {}) => {
  if (!mistake.question && !mistake.correctAnswer) {
    const error = new Error("Fehlerdaten fehlen.");
    error.code = "operation_failed";
    error.status = 400;
    throw error;
  }
};

const handleAdaptiveMistakeExplanation = async (req, res) => {
  const body = safeJson(await readBody(req));
  const mistake = body.mistake || {};
  try {
    validateMistakePayload(mistake);
  } catch (error) {
    await handleApiError(res, error);
    return;
  }
  if (body.mode === "basic" || !process.env.OPENAI_API_KEY) {
    let user = null;
    try {
      user = getAuthenticatedUser(req, res);
      enforceRateLimit(req, "adaptive_mistake_explanation", user, { limit: 40, windowMs: 60 * 1000 });
      const explanation = buildAdaptiveMistakeExplanation(mistake);
      sendJson(res, 200, {
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
    return;
  }
  return runAiAction(req, res, "adaptive_mistake_explanation", async () => {
    const context = adaptiveAiContext(mistake, body.profile || {});
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
    const data = safeJson(raw);
    if (!response.ok) throw providerUnavailable(data.error?.message || "Adaptive KI-Erklärung fehlgeschlagen");
    const explanation = normalizeAdaptiveAiExplanation(data.output_text || {}, mistake);
    return {
      explanation,
      markdown: adaptiveMistakeMarkdown(mistake, explanation),
      adaptive: true,
      offline: false
    };
  });
};

const handleEntitlements = async (req, res) => {
  if (req.method !== "GET") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res);
    sendJson(res, 200, {
      entitlement: await getCurrentEntitlement(user),
      config: { creditCosts: PREMIUM_CONFIG.creditCosts, plans: PREMIUM_CONFIG.plans }
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};

const handleAuthSession = async (req, res) => {
  if (req.method !== "GET") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res);
    sendJson(res, 200, {
      authenticated: false,
      anonymous: Boolean(user.anonymous),
      account: { type: "anonymous" },
      session: { active: true },
      message: "Lokale anonyme Session aktiv. Konto-Login ist noch nicht verbunden."
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};

const handleAuthLogout = async (req, res) => {
  if (req.method !== "POST") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res, { issue: false });
    revokeSessionId(user.sessionId);
  } catch (error) {
    if (error.code !== "authentication_required") {
      await handleApiError(res, error);
      return;
    }
  }
  res.setHeader("Set-Cookie", clearSessionCookie());
  sendJson(res, 200, {
    ok: true,
    message: "Du wurdest abgemeldet. Lokale Lerninhalte bleiben erhalten."
  });
};

const handleTrialStart = async (req, res) => {
  if (req.method !== "POST") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, "trial_start", user);
    const result = await entitlements.startTrial(user.id);
    sendJson(res, result.started ? 200 : 402, result.started
      ? { entitlement: result.entitlement, message: "Plus-Testphase gestartet." }
      : { error: "plan_required", message: "Die Plus-Testphase wurde bereits genutzt.", reason: result.reason, entitlement: result.entitlement });
  } catch (error) {
    await handleApiError(res, error);
  }
};

const handleExamPassDemo = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    sendError(res, 403, "forbidden", {
      message: "Demo activation is disabled in production. Use checkout creation and signed webhook confirmation."
    });
    return;
  }
  if (req.method !== "POST") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, "checkout_create", user);
    sendJson(res, 200, {
      entitlement: await entitlements.activateExamPassDemo(user.id),
      message: "Development demo: Exam Pass ist 14 Tage aktiv."
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};

const handleExamPassCheckout = async (req, res) => {
  if (req.method !== "POST") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
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

const handleExamPassWebhook = async (req, res) => {
  if (req.method !== "POST") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  if (!req.headers["x-lynxly-webhook-signature"]) {
    sendError(res, 403, "forbidden", {
      message: "Signed webhook verification is required before activating Exam Pass entitlements."
    });
    return;
  }
  sendError(res, 503, "provider_unavailable", {
    message: "Payment webhook handling is a placeholder. Connect and verify a real payment provider before production activation."
  });
};

const handleProWaitlist = async (req, res) => {
  if (req.method !== "POST") {
    sendError(res, 403, "forbidden", { message: "Method not allowed." });
    return;
  }
  try {
    const user = getAuthenticatedUser(req, res);
    enforceRateLimit(req, "pro_waitlist", user);
    const body = safeJson(await readBody(req));
    const action = body.action === "unsubscribe" ? "unsubscribe" : "join";
    const entitlement = action === "unsubscribe"
      ? await entitlements.leaveProWaitlist(user.id)
      : await entitlements.joinProWaitlist(user.id, { email: body.email, consent: Boolean(body.consent) });
    sendJson(res, 200, {
      entitlement,
      message: action === "unsubscribe" ? "Du bist von der Pro-Warteliste abgemeldet." : "Du bist auf der Pro-Warteliste."
    });
  } catch (error) {
    await handleApiError(res, error);
  }
};

const isAllowedStaticPath = (pathname) => {
  const clean = decodeURIComponent(pathname);
  if (clean.includes("\0") || clean.includes("..")) return false;
  if (clean === "/" || clean === "/index.html") return true;
  if (/^\/src\/assets\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|svg|webp|ico)$/i.test(clean)) return true;
  if (/^\/src\/styles\/[a-zA-Z0-9/_-]+\.css$/i.test(clean)) return true;
  if (/^\/src\/modules\/[a-zA-Z0-9_-]+\.js$/i.test(clean)) return true;
  if (/^\/src\/(app|components|data|storage|styles|school-catalog|premium-client|premium-config)\.(js|css)$/i.test(clean)) return true;
  if (/^\/(manifest|site)\.json$/i.test(clean)) return true;
  if (/^\/favicon\.(ico|png|svg)$/i.test(clean)) return true;
  return false;
};

const serveStatic = (url, res) => {
  if (!isAllowedStaticPath(url.pathname)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }
  const requestedPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = path.normalize(path.join(root, requestedPath));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:4173");
  setSecurityHeaders(req, res);
  if (url.pathname.startsWith("/api/") && url.pathname !== "/api/exam-pass/webhook") {
    try {
      assertTrustedOrigin(req);
    } catch (error) {
      handleApiError(res, error);
      return;
    }
  }

  if (url.pathname === "/api/chat") {
    if (req.method !== "POST") return sendError(res, 403, "forbidden", { message: "Method not allowed." });
    handleChat(req, res);
    return;
  }
  if (url.pathname === "/api/generate-study-materials") {
    if (req.method !== "POST") return sendError(res, 403, "forbidden", { message: "Method not allowed." });
    handleStudyMaterials(req, res);
    return;
  }
  if (url.pathname === "/api/extract-notes") {
    if (req.method !== "POST") return sendError(res, 403, "forbidden", { message: "Method not allowed." });
    handleExtractNotes(req, res);
    return;
  }
  if (url.pathname === "/api/adaptive-mistake-explanation") {
    if (req.method !== "POST") return sendError(res, 403, "forbidden", { message: "Method not allowed." });
    handleAdaptiveMistakeExplanation(req, res);
    return;
  }
  if (url.pathname === "/api/entitlements") return handleEntitlements(req, res);
  if (url.pathname === "/api/auth/session") return handleAuthSession(req, res);
  if (url.pathname === "/api/auth/logout") return handleAuthLogout(req, res);
  if (url.pathname === "/api/trial/start") return handleTrialStart(req, res);
  if (url.pathname === "/api/exam-pass/activate-demo") return handleExamPassDemo(req, res);
  if (url.pathname === "/api/exam-pass/create-checkout") return handleExamPassCheckout(req, res);
  if (url.pathname === "/api/exam-pass/webhook") return handleExamPassWebhook(req, res);
  if (url.pathname === "/api/pro/waitlist") return handleProWaitlist(req, res);

  serveStatic(url, res);
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 4173;

  server.listen(port, () => {
    console.log(`Lynxly running on port ${port}`);
  });
}

module.exports = server;
module.exports.server = server;
module.exports.isAllowedStaticPath = isAllowedStaticPath;
