const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "lynxly-security-"));
process.env.LYNXLY_ENTITLEMENTS_FILE = path.join(testDir, "entitlements.json");
process.env.LYNXLY_SESSION_SECRET = "test-only-session-secret";
delete process.env.OPENAI_API_KEY;

const { server } = require("../server");
const entitlements = require("../entitlements-store");
const { COOKIE_NAME, createSessionToken, enforceRateLimit } = require("../server-security");
const { monthKey } = require("../premium-core");

let baseUrl = "";

const jsonBody = (value) => JSON.stringify(value);

const storeSetCookie = (jar, header) => {
  if (!header) return;
  const [pair] = String(header).split(";");
  const index = pair.indexOf("=");
  if (index > 0) jar[pair.slice(0, index)] = pair.slice(index + 1);
};

const cookieHeader = (jar) => Object.entries(jar)
  .map(([key, value]) => `${key}=${value}`)
  .join("; ");

const request = async (pathname, options = {}, jar = {}) => {
  const headers = { ...(options.headers || {}) };
  const cookie = cookieHeader(jar);
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${baseUrl}${pathname}`, { ...options, headers });
  storeSetCookie(jar, response.headers.get("set-cookie"));
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch (error) {
    body = {};
  }
  return { response, status: response.status, text, body };
};

const mockRes = () => ({
  statusCode: 200,
  headers: {},
  getHeader(name) {
    return this.headers[String(name).toLowerCase()];
  },
  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const signedCookieFor = (sessionId) => `${COOKIE_NAME}=${encodeURIComponent(createSessionToken(sessionId))}`;

test.before(async () => {
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(testDir, { recursive: true, force: true });
});

test("sensitive project files cannot be downloaded", async () => {
  const sensitivePaths = [
    "/.env",
    "/.env.example",
    "/.lynxly-entitlements.json",
    "/server.js",
    "/premium-core.js",
    "/entitlements-store.js",
    "/upload-security.js",
    "/package.json",
    "/package-lock.json",
    "/lynxly-server.log",
    "/start-lynxly.bat",
    "/config/production.json",
    "/scripts/performance-audit.js",
    "/api/chat.js",
    "/../server.js"
  ];

  for (const pathname of sensitivePaths) {
    const result = await request(pathname);
    assert.ok([403, 404].includes(result.status), `${pathname} returned ${result.status}`);
  }
});

test("client-supplied user IDs are rejected", async () => {
  const result = await request("/api/entitlements", {
    headers: { "X-Lynxly-User": "local:attacker" }
  });
  assert.equal(result.status, 401);
  assert.equal(result.body.error, "authentication_required");
});

test("missing production secrets stop startup", () => {
  const result = spawnSync(process.execPath, [
    "-e",
    "process.env.NODE_ENV='production'; process.env.LYNXLY_SESSION_SECRET=''; process.env.DATABASE_URL=''; process.env.PAYMENT_WEBHOOK_SECRET=''; process.env.PAYMENT_API_SECRET=''; process.env.OPENAI_API_KEY=''; process.env.ALLOWED_FRONTEND_ORIGIN=''; require('./server-security');"
  ], { cwd: path.join(__dirname, ".."), encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}${result.stdout}`, /Missing required production configuration/);
});

test("state-changing API requests reject untrusted origins", async () => {
  const result = await request("/api/trial/start", {
    method: "POST",
    headers: { Origin: "https://evil.example" }
  });
  assert.equal(result.status, 403);
  assert.equal(result.body.error, "forbidden");
});

test("rate limiting returns structured retry timing", () => {
  const req = { headers: {}, socket: { remoteAddress: "203.0.113.55" } };
  enforceRateLimit(req, "unit_test_rate_limit", null, { limit: 1, windowMs: 10_000 });
  assert.throws(
    () => enforceRateLimit(req, "unit_test_rate_limit", null, { limit: 1, windowMs: 10_000 }),
    (error) => error.code === "rate_limited" && error.retryAfter > 0
  );
});

test("free users cannot call Plus-only AI endpoints", async () => {
  const jar = {};
  await request("/api/entitlements", {}, jar);
  const result = await request("/api/generate-study-materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({ notes: "Kurze Biologie-Notizen" })
  }, jar);

  assert.equal(result.status, 402);
  assert.equal(result.body.error, "plan_required");
});

test("basic mistake explanation is free and does not consume premium credits", async () => {
  const jar = {};
  await request("/api/entitlements", {}, jar);
  const result = await request("/api/adaptive-mistake-explanation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({
      mode: "basic",
      mistake: {
        subject: "Mathe",
        topic: "Brüche",
        question: "1/2 + 1/4",
        userAnswer: "2/6",
        correctAnswer: "3/4"
      }
    })
  }, jar);

  assert.equal(result.status, 200);
  assert.equal(result.body.basic, true);
  assert.equal(result.body.creditsConsumed, 0);
  assert.equal(result.body.entitlement.aiCredits.used, 0);
});

test("Plus users can call Plus-only AI endpoints", async () => {
  const jar = {};
  await request("/api/entitlements", {}, jar);
  const trial = await request("/api/trial/start", { method: "POST" }, jar);
  assert.equal(trial.status, 200);

  const result = await request("/api/generate-study-materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({ notes: "Photosynthese: Pflanzen wandeln Licht in Energie um." })
  }, jar);

  assert.equal(result.status, 200);
  assert.equal(result.body.offline, true);
  assert.equal(result.body.creditsConsumed, 0);
});

test("serverless routes enforce the same entitlement rules", async () => {
  const handler = require("../api/generate-study-materials");
  const freeSessionId = crypto.randomUUID();
  const freeRes = mockRes();
  await handler({
    method: "POST",
    headers: { cookie: signedCookieFor(freeSessionId) },
    body: { notes: "Text" }
  }, freeRes);
  assert.equal(freeRes.statusCode, 402);
  assert.equal(freeRes.body.error, "plan_required");

  const plusSessionId = crypto.randomUUID();
  await entitlements.setEntitlement(`session:${plusSessionId}`, {
    plan: "plus",
    paidSubscription: true,
    serverVerified: true
  });
  const plusRes = mockRes();
  await handler({
    method: "POST",
    headers: { cookie: signedCookieFor(plusSessionId) },
    body: { notes: "Text" }
  }, plusRes);
  assert.equal(plusRes.statusCode, 200);
  assert.equal(plusRes.body.offline, true);
});

test("expired trials lose Plus access", async () => {
  const userKey = `session:${crypto.randomUUID()}`;
  const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  await entitlements.setEntitlement(userKey, {
    plan: "plus",
    paidSubscription: false,
    serverVerified: true,
    trial: { used: true, active: true, startedAt: past, endsAt: past }
  });

  const permission = await entitlements.checkAction(userKey, "generate_cards");
  assert.equal(permission.allowed, false);
  assert.equal(permission.reason, "plan_required");
});

test("Exam Pass demo activation is unavailable in production", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const handler = require("../api/exam-pass/activate-demo");
  const res = mockRes();
  await handler({
    method: "POST",
    headers: { cookie: signedCookieFor(crypto.randomUUID()) },
    body: {}
  }, res);
  process.env.NODE_ENV = previousNodeEnv;

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, "forbidden");
});

test("concurrent reservations cannot overspend credits", async () => {
  const userKey = `session:${crypto.randomUUID()}`;
  await entitlements.setEntitlement(userKey, {
    plan: "plus",
    paidSubscription: true,
    serverVerified: true,
    aiCredits: {
      month: monthKey(),
      allowance: 200,
      used: 197,
      reserved: 0
    }
  });

  const results = await Promise.all([
    entitlements.reserveCredits(userKey, "generate_cards"),
    entitlements.reserveCredits(userKey, "generate_cards")
  ]);
  const reservedCount = results.filter((item) => item.reserved).length;
  const deniedCount = results.filter((item) => !item.reserved && item.permission?.reason === "credits_exhausted").length;
  const entitlement = await entitlements.getEntitlement(userKey);

  assert.equal(reservedCount, 1);
  assert.equal(deniedCount, 1);
  assert.equal(entitlement.aiCredits.reserved, 3);
});

test("failed operations refund reserved credits", async () => {
  const userKey = `session:${crypto.randomUUID()}`;
  await entitlements.setEntitlement(userKey, {
    plan: "plus",
    paidSubscription: true,
    serverVerified: true
  });

  const reservation = await entitlements.reserveCredits(userKey, "generate_cards");
  assert.equal(reservation.reserved, true);
  let entitlement = await entitlements.getEntitlement(userKey);
  assert.equal(entitlement.aiCredits.reserved, 3);

  await entitlements.refundReservedCredits(userKey, reservation.reservationId);
  entitlement = await entitlements.getEntitlement(userKey);
  assert.equal(entitlement.aiCredits.reserved, 0);
  assert.equal(entitlement.aiCredits.used, 0);
});

test("direct localStorage-style edits do not grant premium access", async () => {
  const jar = {};
  await request("/api/entitlements", {}, jar);
  const result = await request("/api/generate-study-materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({
      notes: "Bitte mache Karten.",
      settings: { premiumActive: true, plan: "plus", aiLimit: 9999 },
      entitlements: { cached: { paidSubscription: true, plan: "plus" } }
    })
  }, jar);

  assert.equal(result.status, 402);
  assert.equal(result.body.error, "plan_required");
});

test("Pro waitlist requires valid email and consent", async () => {
  const jar = {};
  await request("/api/entitlements", {}, jar);
  const invalidEmail = await request("/api/pro/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({ action: "join", email: "not-an-email", consent: true })
  }, jar);
  assert.equal(invalidEmail.status, 400);
  assert.equal(invalidEmail.body.error, "operation_failed");

  const missingConsent = await request("/api/pro/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({ action: "join", email: "max@example.com", consent: false })
  }, jar);
  assert.equal(missingConsent.status, 403);
  assert.equal(missingConsent.body.error, "forbidden");
});

test("Pro waitlist handles duplicate active signup idempotency safely", async () => {
  const jar = {};
  await request("/api/entitlements", {}, jar);
  const first = await request("/api/pro/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({ action: "join", email: "Max@Example.com", consent: true })
  }, jar);
  assert.equal(first.status, 200);
  assert.equal(first.body.entitlement.proWaitlist.email, "max@example.com");

  const duplicate = await request("/api/pro/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody({ action: "join", email: "max@example.com", consent: true })
  }, jar);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error, "already_exists");
});
