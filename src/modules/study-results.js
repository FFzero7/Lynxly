(function () {
  const modules = window.LynxlyModules || {};

  const trialPromptReady = ({ plan = "free", onboarding = {}, summary = {}, now = Date.now() } = {}) => {
    if (plan !== "free" || onboarding.plusTrialOffered) return false;
    const meaningful = Number(summary.cardsReviewed || 0) > 0
      || Number(summary.correct || 0) > 0
      || Number(summary.wrong || 0) > 0;
    if (!meaningful) return false;
    const dismissed = Date.parse(onboarding.plusTrialDismissedAt || "");
    if (!Number.isFinite(dismissed)) return true;
    return now - dismissed > 14 * 24 * 60 * 60 * 1000;
  };

  modules.studyResults = { trialPromptReady };
  window.LynxlyModules = modules;
})();
