const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sumFiles = (files) => files.reduce((sum, file) => sum + (fs.existsSync(file) ? fs.statSync(file).size : 0), 0);
const walk = (dir, predicate = () => true) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, predicate);
    return predicate(full) ? [full] : [];
  });
};
const bytes = (size) => `${(size / 1024).toFixed(1)} KB`;

const criticalJs = [
  "src/premium-config.js",
  "src/premium-client.js",
  "src/data.js",
  "src/storage.js",
  "src/components.js",
  "src/modules/shared-state.js",
  "src/modules/formatting.js",
  "src/modules/study-results.js",
  "src/modules/navigation.js",
  "src/modules/accessibility.js",
  "src/app.js"
].map((file) => path.join(root, file));
const css = [
  "src/styles/tokens.css",
  "src/styles/base.css",
  "src/styles/layout.css",
  "src/styles/components.css",
  "src/styles.css",
  "src/styles/pages/home.css",
  "src/styles/pages/study.css",
  "src/styles/pages/progress.css",
  "src/styles/pages/planner.css",
  "src/styles/pages/premium.css",
  "src/styles/utilities.css",
  "src/styles/responsive.css"
].map((file) => path.join(root, file));
const optimizedLeagueImages = walk(path.join(root, "src/assets/leagues-optimized"), (file) => file.endsWith(".webp"));
const legacyLeagueImages = walk(path.join(root, "src/assets/leagues"), (file) => file.endsWith(".png"));
const completeLeagueFallbacks = walk(path.join(root, "src/assets/leagues-complete"), (file) => file.endsWith(".png"));

const report = {
  criticalJs: bytes(sumFiles(criticalJs)),
  css: bytes(sumFiles(css)),
  optimizedLeagueImages: bytes(sumFiles(optimizedLeagueImages)),
  legacyLeagueDuplicateImages: bytes(sumFiles(legacyLeagueImages)),
  completeLeagueFallbackImages: bytes(sumFiles(completeLeagueFallbacks)),
  logoWebp: bytes(sumFiles([path.join(root, "src/assets/lynxly-logo.webp")])),
  avatarWebp: bytes(sumFiles([path.join(root, "src/assets/lynxly-avatar.webp")]))
};

console.table(report);
