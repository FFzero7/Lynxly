(function () {
  const key = "studyup-state-v6";
  const copy = (value) => JSON.parse(JSON.stringify(value));

  const mergeDefaults = (base, saved) => {
    const result = copy(base);
    Object.entries(saved || {}).forEach(([itemKey, value]) => {
      if (Array.isArray(value)) {
        result[itemKey] = value;
      } else if (
        value &&
        typeof value === "object" &&
        result[itemKey] &&
        typeof result[itemKey] === "object" &&
        !Array.isArray(result[itemKey])
      ) {
        result[itemKey] = { ...result[itemKey], ...value };
      } else {
        result[itemKey] = value;
      }
    });
    return result;
  };

  const load = () => {
    const defaults = copy(window.StudyUpSeed);
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;

    try {
      return mergeDefaults(defaults, JSON.parse(raw));
    } catch (error) {
      console.warn("Lynxly konnte lokale Daten nicht lesen.", error);
      return defaults;
    }
  };

  const save = (state) => localStorage.setItem(key, JSON.stringify(state));
  window.StudyUpStorage = { load, save };
})();

