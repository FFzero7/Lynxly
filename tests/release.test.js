const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("production ignore excludes local-only and sensitive files", () => {
  const ignore = fs.readFileSync(path.join(root, ".vercelignore"), "utf8");
  for (const pattern of [".env", ".lynxly-entitlements.json", "*.log", "start-*.bat", "tests/", "scripts/"]) {
    assert.match(ignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\*", ".*")));
  }
});

test("optimized league images replace duplicate legacy league folder", () => {
  assert.equal(fs.existsSync(path.join(root, "src/assets/leagues")), false);
  const optimized = fs.readdirSync(path.join(root, "src/assets/leagues-optimized")).filter((file) => file.endsWith(".webp"));
  assert.equal(optimized.length, 10);
});

test("new module and stylesheet entries are present in index", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /src\/modules\/study-results\.js/);
  assert.match(html, /src\/styles\/tokens\.css/);
  assert.match(html, /src\/styles\/pages\/progress\.css/);
});
