(function () {
  const modules = window.LynxlyModules || {};

  const compactLabel = (value, maxLength = 48) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  };

  const formatBytes = (bytes = 0) => {
    const size = Number(bytes || 0);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  };

  const normalizeGermanCopy = (value) => String(value || "")
    .replaceAll("Smart Study Plan", "smarten Lernplan")
    .replaceAll("Photo-to-Cards", "Foto zu Karten")
    .replaceAll("Coming soon", "Kommt bald")
    .replaceAll("Most popular", "Beliebt");

  modules.formatting = { compactLabel, formatBytes, normalizeGermanCopy };
  window.LynxlyModules = modules;
})();
