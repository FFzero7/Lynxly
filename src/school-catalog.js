(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.LynxlySchoolCatalog = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const countries = [
    { id: "CH", label: "Schweiz", language: "de-CH", defaultRegion: "ZH" },
    { id: "DE", label: "Deutschland", language: "de-DE" },
    { id: "AT", label: "Österreich", language: "de-AT" },
    { id: "FR", label: "Frankreich", language: "fr-FR" },
    { id: "IT", label: "Italien", language: "it-IT" },
    { id: "ES", label: "Spanien", language: "es-ES" },
    { id: "US", label: "USA", language: "en-US" },
    { id: "GB", label: "Vereinigtes Königreich", language: "en-GB" },
    { id: "OTHER", label: "Anderes Land", language: "de-CH" }
  ];

  const regions = {
    CH: [
      ["AG", "Aargau"], ["AI", "Appenzell Innerrhoden"], ["AR", "Appenzell Ausserrhoden"],
      ["BE", "Bern"], ["BL", "Basel-Landschaft"], ["BS", "Basel-Stadt"], ["FR", "Freiburg"],
      ["GE", "Genf"], ["GL", "Glarus"], ["GR", "Graubünden"], ["JU", "Jura"], ["LU", "Luzern"],
      ["NE", "Neuenburg"], ["NW", "Nidwalden"], ["OW", "Obwalden"], ["SG", "St. Gallen"],
      ["SH", "Schaffhausen"], ["SO", "Solothurn"], ["SZ", "Schwyz"], ["TG", "Thurgau"],
      ["TI", "Tessin"], ["UR", "Uri"], ["VD", "Waadt"], ["VS", "Wallis"], ["ZG", "Zug"], ["ZH", "Zürich"]
    ].map(([id, label]) => ({ id, label }))
  };

  const internationalSystems = [
    { id: "ib", label: "International Baccalaureate" },
    { id: "cambridge", label: "Cambridge" },
    { id: "us-system", label: "Amerikanisches System" },
    { id: "manual", label: "Anderes / manuell einrichten" }
  ];

  const educationSystemsByCountry = {
    CH: [
      { id: "ch-public", label: "Öffentliche Schule" },
      { id: "ch-secondary-I", label: "Sekundarstufe I" },
      { id: "ch-gymnasium", label: "Gymnasium" },
      { id: "ch-vocational", label: "Berufsschule" },
      { id: "ch-fms", label: "Fachmittelschule" },
      ...internationalSystems
    ],
    DE: [
      { id: "de-primary", label: "Grundschule" },
      { id: "de-secondary", label: "Sekundarstufe" },
      { id: "de-gymnasium", label: "Gymnasium" },
      { id: "de-vocational", label: "Berufsschule" },
      ...internationalSystems
    ],
    AT: [
      { id: "at-public", label: "Österreichisches Schulsystem" },
      { id: "at-ahs", label: "AHS" },
      { id: "at-bhs", label: "BHS" },
      { id: "at-vocational", label: "Berufsschule" },
      ...internationalSystems
    ],
    FR: [
      { id: "fr-national", label: "Französisches Schulsystem" },
      { id: "fr-lycee", label: "Lycée" },
      ...internationalSystems
    ],
    IT: [
      { id: "it-national", label: "Italienisches Schulsystem" },
      { id: "it-liceo", label: "Liceo" },
      ...internationalSystems
    ],
    ES: [
      { id: "es-national", label: "Spanisches Schulsystem" },
      { id: "es-bachillerato", label: "Bachillerato" },
      ...internationalSystems
    ],
    US: [
      { id: "us-public", label: "US Public School" },
      { id: "us-high-school", label: "High School" },
      ...internationalSystems
    ],
    GB: [
      { id: "gb-national", label: "UK National Curriculum" },
      { id: "gb-gcse", label: "GCSE" },
      { id: "gb-a-level", label: "A-Level" },
      ...internationalSystems
    ],
    OTHER: internationalSystems
  };

  const levels = [
    { id: "primary", label: "Primarstufe" },
    { id: "secondary_I", label: "Sekundarstufe I" },
    { id: "secondary_II", label: "Sekundarstufe II" },
    { id: "gymnasium", label: "Gymnasium" },
    { id: "vocational", label: "Berufsschule" },
    { id: "university", label: "Universität" },
    { id: "other", label: "Andere" }
  ];

  const levelIdsBySystem = {
    "ch-public": ["primary", "secondary_I", "secondary_II"],
    "ch-secondary-I": ["secondary_I"],
    "ch-gymnasium": ["secondary_II", "gymnasium"],
    "ch-vocational": ["secondary_II", "vocational"],
    "ch-fms": ["secondary_II"],
    "de-primary": ["primary"],
    "de-secondary": ["secondary_I", "secondary_II"],
    "de-gymnasium": ["secondary_I", "secondary_II", "gymnasium"],
    "de-vocational": ["secondary_II", "vocational"],
    "at-public": ["primary", "secondary_I", "secondary_II"],
    "at-ahs": ["secondary_I", "secondary_II", "gymnasium"],
    "at-bhs": ["secondary_II", "vocational"],
    "at-vocational": ["secondary_II", "vocational"],
    "us-public": ["primary", "secondary_I", "secondary_II"],
    "us-high-school": ["secondary_II"],
    "gb-national": ["primary", "secondary_I", "secondary_II"],
    "gb-gcse": ["secondary_I", "secondary_II"],
    "gb-a-level": ["secondary_II"],
    ib: ["secondary_I", "secondary_II"],
    cambridge: ["secondary_I", "secondary_II"],
    "us-system": ["primary", "secondary_I", "secondary_II"],
    manual: ["primary", "secondary_I", "secondary_II", "gymnasium", "vocational", "university", "other"]
  };

  const gradeYears = [
    { id: "1", label: "1. Schuljahr" },
    { id: "2", label: "2. Schuljahr" },
    { id: "3", label: "3. Schuljahr" },
    { id: "4", label: "4. Schuljahr" },
    { id: "5", label: "5. Schuljahr" },
    { id: "6", label: "6. Schuljahr" },
    { id: "7", label: "7. Schuljahr" },
    { id: "8", label: "8. Schuljahr" },
    { id: "9", label: "9. Schuljahr" },
    { id: "10", label: "10. Schuljahr" },
    { id: "11", label: "11. Schuljahr" },
    { id: "12", label: "12. Schuljahr" },
    { id: "13", label: "13. Schuljahr" },
    { id: "other", label: "Anderes" }
  ];

  const gradingScales = [
    { id: "ch_1_to_6_high_is_good", label: "1 bis 6, wobei 6 die beste Note ist", example: "6 = sehr gut, 4 = genügend, 1 = ungenügend", min: 1, max: 6, passingThreshold: 4, decimalPrecision: 2, higherIsBetter: true, appGradeSystem: "ch", recommendedCountries: ["CH"], language: "de-CH" },
    { id: "de_1_to_6_low_is_good", label: "1 bis 6, wobei 1 die beste Note ist", example: "1 = sehr gut, 4 = genügend, 6 = ungenügend", min: 1, max: 6, passingThreshold: 4, decimalPrecision: 1, higherIsBetter: false, appGradeSystem: "de", recommendedCountries: ["DE", "AT"], language: "de-DE" },
    { id: "one_to_ten", label: "1 bis 10", example: "10 = sehr gut, 6 = genügend", min: 1, max: 10, passingThreshold: 6, decimalPrecision: 1, higherIsBetter: true, appGradeSystem: "it", recommendedCountries: ["IT", "ES", "OTHER"], language: "de-CH" },
    { id: "zero_to_twenty", label: "0 bis 20", example: "20 = sehr gut, 10 = genügend", min: 0, max: 20, passingThreshold: 10, decimalPrecision: 1, higherIsBetter: true, appGradeSystem: "fr", recommendedCountries: ["FR"], language: "fr-FR" },
    { id: "percent_0_to_100", label: "0 bis 100 Prozent", example: "100% = sehr gut, 60% = genügend", min: 0, max: 100, passingThreshold: 60, decimalPrecision: 0, higherIsBetter: true, appGradeSystem: "jp", recommendedCountries: ["US", "GB", "OTHER"], language: "de-CH" },
    { id: "letters_a_to_f", label: "Buchstaben A bis F", example: "A = sehr gut, D = genügend, F = ungenügend", min: 0, max: 4, passingThreshold: 1, decimalPrecision: 1, higherIsBetter: true, appGradeSystem: "us", recommendedCountries: ["US", "GB"], language: "en-US" },
    { id: "points", label: "Punkte", example: "Mehr Punkte sind besser; Bestehensgrenze wird manuell festgelegt", min: 0, max: 100, passingThreshold: 60, decimalPrecision: 0, higherIsBetter: true, appGradeSystem: "jp", recommendedCountries: ["OTHER"], language: "de-CH" },
    { id: "custom", label: "Eigenes System", example: "Minimum, Maximum und Bestehensgrenze selbst festlegen", min: 0, max: 100, passingThreshold: 60, decimalPrecision: 1, higherIsBetter: true, appGradeSystem: "ch", recommendedCountries: ["OTHER"], language: "de-CH", custom: true }
  ];

  const primaryGoals = [
    { id: "better_grades", label: "Bessere Noten" },
    { id: "exam_preparation", label: "Für Prüfungen lernen" },
    { id: "task_organization", label: "Aufgaben organisieren" },
    { id: "regular_study", label: "Regelmässiger lernen" },
    { id: "understand_material", label: "Lernstoff verstehen" },
    { id: "create_cards", label: "Eigene Lernkarten erstellen" }
  ];

  const subjectSuggestions = [
    ["mathematics", "Mathe"], ["german", "Deutsch"], ["french", "Französisch"], ["english", "Englisch"],
    ["biology", "Biologie"], ["geography", "Geographie"], ["history", "Geschichte"], ["music", "Musik"],
    ["art", "BG"], ["latin", "Latein"], ["chemistry", "Chemie"], ["physics", "Physik"]
  ].map(([id, label]) => ({ id, label }));

  const byId = (items, id) => items.find((item) => item.id === id) || items[0];
  const normalizeCountry = (id = "CH") => byId(countries, String(id || "CH").toUpperCase()).id;
  const systemsForCountry = (countryCode = "CH") => educationSystemsByCountry[normalizeCountry(countryCode)] || educationSystemsByCountry.OTHER;
  const defaultEducationSystemForCountry = (countryCode = "CH") => {
    const country = normalizeCountry(countryCode);
    return ({ CH: "ch-gymnasium", DE: "de-gymnasium", AT: "at-ahs", US: "us-high-school", GB: "gb-gcse" })[country] || systemsForCountry(country)[0].id;
  };
  const levelsForSystem = (systemId = "manual") => {
    const ids = levelIdsBySystem[systemId] || levelIdsBySystem.manual;
    return ids.map((id) => byId(levels, id));
  };
  const defaultLevelForSystem = (systemId = "manual") => levelsForSystem(systemId)[0].id;
  const gradingScaleById = (id) => gradingScales.find((scale) => scale.id === id) || gradingScales[0];
  const defaultGradingScaleFor = (countryCode = "CH", systemId = "") => {
    if (systemId === "ib") return "points";
    if (systemId === "cambridge") return "letters_a_to_f";
    const country = normalizeCountry(countryCode);
    return gradingScales.find((scale) => scale.recommendedCountries?.includes(country))?.id || "custom";
  };
  const gradingScalesForCountrySystem = (countryCode = "CH", systemId = "") => {
    const recommended = defaultGradingScaleFor(countryCode, systemId);
    return [...gradingScales].sort((a, b) => (a.id === recommended ? -1 : b.id === recommended ? 1 : 0));
  };
  const countryLabel = (id) => byId(countries, normalizeCountry(id)).label;
  const educationSystemLabel = (countryCode, systemId) => {
    const systems = systemsForCountry(countryCode);
    return (systems.find((system) => system.id === systemId) || systems[0]).label;
  };
  const levelLabel = (systemId, levelId) => {
    const levelsForSelectedSystem = levelsForSystem(systemId);
    return (levelsForSelectedSystem.find((level) => level.id === levelId) || levelsForSelectedSystem[0]).label;
  };
  const suggestCountryFromLocale = (locale = "", timezone = "") => {
    const text = `${locale} ${timezone}`.toLowerCase();
    if (text.includes("zurich") || text.includes("ch-") || text.endsWith(" ch")) return "CH";
    if (text.includes("berlin") || text.includes("de-")) return "DE";
    if (text.includes("vienna") || text.includes("at-")) return "AT";
    if (text.includes("london") || text.includes("gb") || text.includes("en-gb")) return "GB";
    if (text.includes("new_york") || text.includes("los_angeles") || text.includes("en-us")) return "US";
    return "CH";
  };

  return {
    countries,
    regions,
    educationSystemsByCountry,
    levels,
    gradeYears,
    gradingScales,
    primaryGoals,
    subjectSuggestions,
    normalizeCountry,
    countryLabel,
    regionsForCountry: (countryCode) => regions[normalizeCountry(countryCode)] || [],
    requiresRegion: (countryCode) => Boolean(regions[normalizeCountry(countryCode)]?.length),
    systemsForCountry,
    defaultEducationSystemForCountry,
    educationSystemLabel,
    levelsForSystem,
    defaultLevelForSystem,
    levelLabel,
    gradeYearsForLevel: () => gradeYears,
    gradingScalesForCountrySystem,
    defaultGradingScaleFor,
    gradingScaleById,
    suggestCountryFromLocale
  };
});
