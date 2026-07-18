const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");

const { parseUploadRequest, textForUpload, UPLOAD_LIMITS } = require("../upload-security");

const multipartRequest = (filename, contentType, content) => {
  const boundary = "lynxly-test-boundary";
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
    Buffer.isBuffer(content) ? content : Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
  const req = Readable.from(body);
  req.headers = { "content-type": `multipart/form-data; boundary=${boundary}` };
  return req;
};

test("multipart uploads are parsed without base64 JSON", async () => {
  const req = multipartRequest("notizen.txt", "text/plain", "Photosynthese erklärt Energieumwandlung.");
  const upload = await parseUploadRequest(req);
  assert.equal(upload.fileName, "notizen.txt");
  assert.equal(upload.kind, "text");
  assert.equal(upload.mimeType, "text/plain");
  assert.equal(textForUpload(upload), "Photosynthese erklärt Energieumwandlung.");
});

test("unsafe upload extensions are rejected", async () => {
  const req = multipartRequest("server.js", "text/plain", "console.log('no')");
  await assert.rejects(() => parseUploadRequest(req), /Dateiformat/);
});

test("oversized uploads are rejected before OCR", async () => {
  const tooLarge = Buffer.alloc(UPLOAD_LIMITS.text + 1, "a");
  const req = multipartRequest("notizen.txt", "text/plain", tooLarge);
  await assert.rejects(() => parseUploadRequest(req), /zu groß/);
});

test("frontend extract-notes upload uses FormData instead of fileData JSON", () => {
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "../src/app.js"), "utf8");
  const extractBlock = source.slice(source.indexOf("const extractNotesFromUpload"), source.indexOf("const askLynxlyAI"));
  assert.match(extractBlock, /new FormData\(\)/);
  assert.doesNotMatch(extractBlock, /fileData/);
  assert.doesNotMatch(extractBlock, /Content-Type": "application\/json"/);
});
