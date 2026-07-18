const path = require("path");

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const UPLOAD_LIMITS = {
  text: 2 * 1024 * 1024,
  pdf: 8 * 1024 * 1024,
  image: 5 * 1024 * 1024
};

const allowedExtensions = new Set([".txt", ".md", ".pdf", ".png", ".jpg", ".jpeg", ".webp"]);
const allowedMimes = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp"
]);

const safeJson = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const readBodyBuffer = (req, limit = MAX_UPLOAD_BYTES) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > limit) {
      reject(Object.assign(new Error("Upload zu groß."), { status: 413, code: "file_too_large" }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
});

const requestBodyBuffer = async (req, limit = MAX_UPLOAD_BYTES) => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body && typeof req.body === "object" && !req.readable) {
    return Buffer.from(JSON.stringify(req.body));
  }
  return readBodyBuffer(req, limit);
};

const safeFileName = (name = "notizen") => {
  const base = path.basename(String(name || "notizen")).replace(/[^\w.\- äöüÄÖÜß]/g, "_").trim();
  return (base || "notizen").slice(0, 120);
};

const kindFrom = (fileName, mimeType = "") => {
  const ext = path.extname(fileName || "").toLowerCase();
  if (mimeType.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return "image";
  if (mimeType === "application/pdf" || ext === ".pdf") return "pdf";
  return "text";
};

const validateUpload = (upload) => {
  const extension = path.extname(upload.fileName || "").toLowerCase();
  const mimeType = String(upload.mimeType || "").split(";")[0].trim().toLowerCase();
  const kind = kindFrom(upload.fileName, mimeType);
  const sizeLimit = UPLOAD_LIMITS[kind] || UPLOAD_LIMITS.text;
  if (!allowedExtensions.has(extension)) {
    throw Object.assign(new Error("Dieses Dateiformat wird nicht unterstützt."), { status: 415, code: "unsupported_file_type" });
  }
  if (mimeType && !allowedMimes.has(mimeType)) {
    throw Object.assign(new Error("Dieser Dateityp ist nicht erlaubt."), { status: 415, code: "unsupported_file_type" });
  }
  if (!upload.buffer?.length) {
    throw Object.assign(new Error("Datei fehlt."), { status: 400 });
  }
  if (upload.buffer.length > sizeLimit) {
    throw Object.assign(new Error("Diese Datei ist zu groß."), { status: 413, code: "file_too_large" });
  }
  return { ...upload, mimeType: mimeType || fallbackMime(extension), kind };
};

const fallbackMime = (extension) => ({
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
})[extension] || "application/octet-stream";

const parseDisposition = (header = "") => {
  const result = {};
  for (const part of String(header).split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawValue.length) continue;
    const key = rawKey.toLowerCase();
    result[key] = rawValue.join("=").trim().replace(/^"|"$/g, "");
  }
  return result;
};

const parseMultipart = (buffer, contentType = "") => {
  const boundaryMatch = String(contentType).match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw Object.assign(new Error("Multipart-Boundary fehlt."), { status: 400 });
  }
  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const raw = buffer.toString("binary");
  const parts = raw.split(boundary).slice(1, -1);
  for (const rawPart of parts) {
    const normalized = rawPart.replace(/^\r\n/, "").replace(/\r\n$/, "");
    const headerEnd = normalized.indexOf("\r\n\r\n");
    if (headerEnd < 0) continue;
    const headerText = normalized.slice(0, headerEnd);
    const bodyBinary = normalized.slice(headerEnd + 4);
    const headers = Object.fromEntries(headerText.split("\r\n").map((line) => {
      const index = line.indexOf(":");
      return index > -1 ? [line.slice(0, index).toLowerCase(), line.slice(index + 1).trim()] : ["", ""];
    }).filter(([key]) => key));
    const disposition = parseDisposition(headers["content-disposition"]);
    if (!disposition.filename) continue;
    return validateUpload({
      fieldName: disposition.name || "file",
      fileName: safeFileName(disposition.filename),
      mimeType: headers["content-type"] || fallbackMime(path.extname(disposition.filename).toLowerCase()),
      buffer: Buffer.from(bodyBinary, "binary")
    });
  }
  throw Object.assign(new Error("Datei fehlt."), { status: 400 });
};

const parseDataUrlUpload = (body = {}) => {
  const fileData = String(body.fileData || "");
  const match = fileData.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
  if (!match) {
    throw Object.assign(new Error("Ungültige Datei."), { status: 400 });
  }
  const mimeType = String(body.mimeType || match[1] || "").toLowerCase();
  const encoded = match[3] || "";
  const buffer = match[2] ? Buffer.from(encoded, "base64") : Buffer.from(decodeURIComponent(encoded));
  return validateUpload({
    fieldName: "file",
    fileName: safeFileName(body.fileName || `notizen${extensionForMime(mimeType)}`),
    mimeType,
    buffer
  });
};

const extensionForMime = (mimeType) => ({
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp"
})[mimeType] || ".txt";

const parseUploadRequest = async (req) => {
  const contentType = String(req.headers?.["content-type"] || req.headers?.["Content-Type"] || "");
  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    return parseMultipart(await requestBodyBuffer(req), contentType);
  }
  const body = req.body && typeof req.body === "object"
    ? req.body
    : safeJson((await requestBodyBuffer(req)).toString("utf8"));
  if (body.fileData) {
    throw Object.assign(new Error("Base64-JSON-Uploads werden nicht unterstützt. Nutze multipart/form-data."), { status: 415, code: "unsupported_file_type" });
  }
  throw Object.assign(new Error("Bitte lade Dateien als multipart/form-data hoch."), { status: 400 });
};

const dataUrlForUpload = (upload) => `data:${upload.mimeType};base64,${upload.buffer.toString("base64")}`;

const textForUpload = (upload) => upload.buffer.toString("utf8").replace(/\0/g, "").slice(0, 24_000);

const scanUpload = async () => ({ ok: true });

module.exports = {
  MAX_UPLOAD_BYTES,
  UPLOAD_LIMITS,
  dataUrlForUpload,
  parseUploadRequest,
  safeFileName,
  scanUpload,
  textForUpload,
  validateUpload
};
