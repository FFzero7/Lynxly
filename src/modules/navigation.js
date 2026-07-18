(function () {
  const modules = window.LynxlyModules || {};

  modules.navigation = {
    bottomNavigation: [
      { route: "dashboard", label: "Start" },
      { route: "cards", label: "Lernen" },
      { route: "material", label: "Material" },
      { route: "progress", label: "Fortschritt" },
      { route: "settings", label: "Profil" }
    ],
    routeTitles: {
      dashboard: "Start",
      grades: "Noten",
      planner: "Tasks",
      cards: "Lernen",
      progress: "Fortschritt",
      bot: "Coach",
      settings: "Profil"
    }
  };

  window.LynxlyModules = modules;
})();
