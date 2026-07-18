(function () {
  const modules = window.LynxlyModules || {};

  modules.sharedState = {
    releaseVersion: "0.203.0",
    currentStorageKey: "studyup-state-v6",
    compatibilityNames: ["StudyUpStorage", "StudyUpComponents", "StudyUpSeed"],
    publicRoutes: ["dashboard", "grades", "planner", "cards", "mistakes", "progress", "session", "bot", "premium", "settings"]
  };

  window.LynxlyModules = modules;
})();
