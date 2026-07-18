(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.LynxlyPremiumConfig = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const features = {
    manualCardsUnlimited: {
      id: "manualCardsUnlimited",
      label: "Unbegrenzt eigene Study Cards",
      plan: "free",
      implemented: true
    },
    standardReviews: {
      id: "standardReviews",
      label: "Unbegrenzte Standard-Wiederholungen",
      plan: "free",
      implemented: true
    },
    gradesTasksExams: {
      id: "gradesTasksExams",
      label: "Noten, Tasks und Prüfungen",
      plan: "free",
      implemented: true
    },
    manualPlanning: {
      id: "manualPlanning",
      label: "Manuelle Lernplanung",
      plan: "free",
      implemented: true
    },
    mistakeBank: {
      id: "mistakeBank",
      label: "Fehlerbank",
      plan: "free",
      implemented: true
    },
    basicProgress: {
      id: "basicProgress",
      label: "Basis-Fortschritt",
      plan: "free",
      implemented: true
    },
    basicExplanations: {
      id: "basicExplanations",
      label: "Einfache lokale Erklärungen",
      plan: "free",
      implemented: true
    },
    collectionPreviews: {
      id: "collectionPreviews",
      label: "Lynxly-Sammlungen als Vorschau",
      plan: "free",
      implemented: true
    },
    notesToCards: {
      id: "notesToCards",
      label: "Notizen zu Study Cards",
      plan: "plus",
      action: "generate_cards",
      implemented: true
    },
    quizSummary: {
      id: "quizSummary",
      label: "Quiz und Zusammenfassung",
      plan: "plus",
      action: "generate_quiz_summary",
      implemented: true
    },
    smartStudyPlans: {
      id: "smartStudyPlans",
      label: "Smarte Lernpläne",
      plan: "plus",
      action: "smart_study_plan",
      implemented: true
    },
    fullCollections: {
      id: "fullCollections",
      label: "Volle Lynxly-Sammlungen",
      plan: "plus",
      implemented: true
    },
    adaptiveMistakeExplanations: {
      id: "adaptiveMistakeExplanations",
      label: "Adaptive Fehler-Erklärungen",
      plan: "plus",
      action: "adaptive_mistake_explanation",
      implemented: true
    },
    weakTopicDetection: {
      id: "weakTopicDetection",
      label: "Schwachthemen-Erkennung",
      plan: "plus",
      implemented: true
    },
    examReadiness: {
      id: "examReadiness",
      label: "Prüfungsbereitschaft",
      plan: "plus",
      implemented: true
    },
    weeklyReport: {
      id: "weeklyReport",
      label: "Wochenbericht",
      plan: "plus",
      implemented: true
    },
    noAds: {
      id: "noAds",
      label: "Keine Werbung",
      plan: "plus",
      implemented: true
    },
    examSimulation: {
      id: "examSimulation",
      label: "Prüfungssimulation",
      plan: "exam_pass",
      action: "exam_simulation",
      implemented: false,
      comingSoon: true
    },
    intensiveExamPlan: {
      id: "intensiveExamPlan",
      label: "Intensiver Prüfungsplan",
      plan: "exam_pass",
      implemented: false,
      comingSoon: true
    },
    focusedWeakReview: {
      id: "focusedWeakReview",
      label: "Fokussierte Schwachthemen-Runden",
      plan: "exam_pass",
      implemented: true
    },
    photoToCards: {
      id: "photoToCards",
      label: "Foto zu Study Cards",
      plan: "pro",
      action: "extract_image",
      implemented: false,
      comingSoon: true
    },
    advancedAnalytics: {
      id: "advancedAnalytics",
      label: "Erweiterte Analysen",
      plan: "pro",
      implemented: false,
      comingSoon: true
    },
    exportCards: {
      id: "exportCards",
      label: "Study Cards exportieren",
      plan: "pro",
      implemented: false,
      comingSoon: true
    }
  };

  const plans = {
    free: {
      id: "free",
      label: "Free",
      headline: "Organisiere Schule",
      price: { amount: 0, currency: "CHF", interval: "forever", label: "CHF 0" },
      monthlyCredits: 10,
      features: [
        "manualCardsUnlimited",
        "standardReviews",
        "gradesTasksExams",
        "manualPlanning",
        "mistakeBank",
        "basicProgress",
        "basicExplanations",
        "collectionPreviews"
      ]
    },
    plus: {
      id: "plus",
      label: "Lynxly Plus",
      headline: "Lerne smarter",
      recommended: true,
      defaultBillingCycle: "annual",
      price: {
        currency: "CHF",
        monthly: 4.9,
        annual: 39.9,
        annualMonthlyEquivalent: 3.33
      },
      monthlyCredits: 200,
      features: [
        "notesToCards",
        "quizSummary",
        "smartStudyPlans",
        "fullCollections",
        "adaptiveMistakeExplanations",
        "weakTopicDetection",
        "examReadiness",
        "weeklyReport",
        "noAds"
      ]
    },
    exam_pass: {
      id: "exam_pass",
      label: "Exam Pass",
      headline: "14 Tage Prüfungsfokus",
      price: { amount: 6.9, currency: "CHF", interval: "one_time", label: "CHF 6.90 einmalig" },
      days: 14,
      monthlyCredits: 300,
      oneTimeCredits: true,
      purchasable: false,
      comingSoon: true,
      features: ["notesToCards", "quizSummary", "smartStudyPlans", "focusedWeakReview", "examSimulation", "intensiveExamPlan"]
    },
    pro: {
      id: "pro",
      label: "Pro",
      headline: "Bald verfügbar",
      comingSoon: true,
      purchasable: false,
      monthlyCredits: 0,
      features: ["photoToCards", "advancedAnalytics", "exportCards"]
    }
  };

  return {
    trialDays: 7,
    examPassDays: 14,
    defaultBillingCycle: "annual",
    plans,
    features,
    creditCosts: {
      chat_short: 1,
      generate_cards: 3,
      generate_quiz_summary: 3,
      adaptive_mistake_explanation: 2,
      smart_study_plan: 3,
      extract_image: 4,
      extract_pdf: 5,
      exam_simulation: 8
    },
    actionLabels: {
      chat_short: "Kurze KI-Frage",
      generate_cards: "Study Cards generieren",
      generate_quiz_summary: "Quiz und Zusammenfassung",
      adaptive_mistake_explanation: "Adaptive Fehler-Erklärung",
      smart_study_plan: "Smarter Lernplan",
      extract_image: "Bild auslesen",
      extract_pdf: "PDF auslesen",
      exam_simulation: "Prüfungssimulation"
    },
    premiumActions: [
      "generate_cards",
      "generate_quiz_summary",
      "extract_image",
      "extract_pdf",
      "exam_simulation",
      "smart_study_plan",
      "adaptive_mistake_explanation"
    ]
  };
});
