const test = require("node:test");
const assert = require("node:assert/strict");

const catalog = require("../src/school-catalog.js");

test("Switzerland requires canton selection", () => {
  assert.equal(catalog.requiresRegion("CH"), true);
  assert.ok(catalog.regionsForCountry("CH").some((region) => region.id === "ZH"));
  assert.equal(catalog.requiresRegion("DE"), false);
});

test("country controls school system options", () => {
  const swissSystems = catalog.systemsForCountry("CH").map((system) => system.id);
  const germanSystems = catalog.systemsForCountry("DE").map((system) => system.id);

  assert.ok(swissSystems.includes("ch-gymnasium"));
  assert.ok(swissSystems.includes("ch-vocational"));
  assert.ok(germanSystems.includes("de-gymnasium"));
  assert.ok(germanSystems.includes("de-vocational"));
});

test("international systems are available across countries", () => {
  ["CH", "DE", "US", "GB", "OTHER"].forEach((country) => {
    const systemIds = catalog.systemsForCountry(country).map((system) => system.id);
    assert.ok(systemIds.includes("ib"), `${country} should include IB`);
    assert.ok(systemIds.includes("cambridge"), `${country} should include Cambridge`);
    assert.ok(systemIds.includes("us-system"), `${country} should include US system`);
    assert.ok(systemIds.includes("manual"), `${country} should include manual setup`);
  });
});

test("grading-scale recommendations and directions are stable", () => {
  const swiss = catalog.gradingScaleById(catalog.defaultGradingScaleFor("CH", "ch-gymnasium"));
  const german = catalog.gradingScaleById(catalog.defaultGradingScaleFor("DE", "de-gymnasium"));

  assert.equal(swiss.id, "ch_1_to_6_high_is_good");
  assert.equal(swiss.higherIsBetter, true);
  assert.equal(german.id, "de_1_to_6_low_is_good");
  assert.equal(german.higherIsBetter, false);
});

test("custom grading scales are supported", () => {
  const custom = catalog.gradingScaleById("custom");

  assert.equal(custom.custom, true);
  assert.equal(custom.label, "Eigenes System");
  assert.equal(typeof custom.min, "number");
  assert.equal(typeof custom.max, "number");
  assert.equal(typeof custom.passingThreshold, "number");
});

test("onboarding can resume with stable IDs", () => {
  const countryCode = catalog.normalizeCountry("gb");
  const systemId = catalog.defaultEducationSystemForCountry(countryCode);
  const levelId = catalog.defaultLevelForSystem(systemId);
  const scaleId = catalog.defaultGradingScaleFor(countryCode, systemId);

  assert.equal(countryCode, "GB");
  assert.ok(systemId);
  assert.ok(levelId);
  assert.ok(scaleId);
});
