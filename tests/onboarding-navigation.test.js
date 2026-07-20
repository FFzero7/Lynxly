const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "src", "styles.css"), "utf8");

test("bottom navigation has a dedicated onboarding state", () => {
  assert.match(appSource, /const onboardingActive = \(\) => !state\.user\.loggedIn \|\| state\.schoolProfile\?\.onboardingCompleted !== true;/);
  assert.match(appSource, /document\.body\.classList\.toggle\("is-onboarding", active\);/);
});

test("bottom navigation is removed from pointer and keyboard access during onboarding", () => {
  assert.match(appSource, /bottomNav\.hidden = active;/);
  assert.match(appSource, /bottomNav\.inert = active;/);
  assert.match(appSource, /bottomNav\.setAttribute\("aria-hidden", String\(active\)\);/);
  assert.match(appSource, /item\.setAttribute\("tabindex", "-1"\);/);
  assert.match(appSource, /item\.removeAttribute\("tabindex"\);/);
});

test("onboarding CSS hides bottom navigation and removes bottom padding", () => {
  assert.match(stylesSource, /body\.is-onboarding \.bottom-nav\s*\{[\s\S]*display: none !important;/);
  assert.match(stylesSource, /body\.is-onboarding \.main-content\s*\{[\s\S]*padding-bottom: 0;/);
});

test("real auth buttons stay unavailable until providers are configured", () => {
  assert.match(appSource, /google: Boolean\(window\.LYNXLY_GOOGLE_CLIENT_ID && window\.google\?\.accounts\?\.id\)/);
  assert.match(appSource, /apple: Boolean\(window\.LYNXLY_APPLE_CLIENT_ID && window\.AppleID\?\.auth\)/);
  assert.match(appSource, /email: false/);
  assert.match(appSource, /Bald verfügbar/);
});

test("frontend logout calls the server logout route before local reset", () => {
  assert.match(appSource, /const logoutCurrentUser = async \(\) =>/);
  assert.match(appSource, /fetch\("\/api\/auth\/logout"/);
  assert.match(appSource, /document\.querySelector\("\.settings-logout"\)\?\.addEventListener\("click", logoutCurrentUser\);/);
});
