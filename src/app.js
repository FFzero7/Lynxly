(function () {
  const app = document.querySelector("#app");
  const navLinks = document.querySelectorAll("[data-route]");
  const materialNavButtons = document.querySelectorAll("[data-material-menu]");
  const xpPill = document.querySelector("#xp-pill");
  const xpWeekCount = document.querySelector("#xp-week-count");
  const xpToastLayer = document.querySelector("#xp-toast-layer");
  const xpLive = document.querySelector("#xp-live");
  const logoutButton = document.querySelector("#logout-button");
  const C = window.StudyUpComponents;
  let state = window.StudyUpStorage.load();
  let cardSearchTimer = null;
  let matchTimer = null;
  let pendingChatAttachment = null;
  let voiceRecognition = null;
  let cardKeyboardBound = false;

  const routes = ["dashboard", "grades", "planner", "cards", "mistakes", "progress", "session", "bot", "premium", "settings"];
  const accentColors = { blue: "#2563eb", green: "#10b981", violet: "#7c3aed", coral: "#f97316" };
  const subjectChoices = ["Mathe", "Deutsch", "Französisch", "Geschichte", "BG", "Musik", "Biologie", "Geographie", "Latein", "Englisch"];
  const planSteps = ["Wiederholen", "Üben", "Karteikarten", "Mini-Test", "Fehleranalyse", "Prüfungssimulation"];
  const levelDefinitions = [
    { level: 1, title: "Curious Lynx", min: 0, next: 250 },
    { level: 2, title: "Focus Lynx", min: 250, next: 650 },
    { level: 3, title: "Sharp Lynx", min: 650, next: 1250 },
    { level: 4, title: "Study Hunter", min: 1250, next: 2100 },
    { level: 5, title: "Exam Master", min: 2100, next: 3200 }
  ];
  const badgeDefinitions = [
    { id: "first-step", title: "First Step", text: "Erste Lerneinheit abgeschlossen" },
    { id: "mistake-fixer", title: "Mistake Fixer", text: "10 Fehler behoben" },
    { id: "card-master", title: "Card Master", text: "100 Karten wiederholt" },
    { id: "exam-ready", title: "Exam Ready", text: "Vor einer Prüfung gelernt" },
    { id: "comeback-lynx", title: "Comeback Lynx", text: "Ein schwaches Fach verbessert" },
    { id: "planner-pro", title: "Planner Pro", text: "Eine volle Lernwoche geplant" },
    { id: "focus-mode", title: "Focus Mode", text: "5 Lerneinheiten geschafft" }
  ];
  const questTemplates = [
    { id: "cards", title: "5 Karten wiederholen", metric: "cards", target: 5, href: "#cards" },
    { id: "mistakes", title: "1 Fehler beheben", metric: "mistakes", target: 1, href: "#mistakes" },
    { id: "sessions", title: "1 Lerneinheit abschließen", metric: "sessions", target: 1, href: "#session" }
  ];
  const learningModeOptions = [
    { id: "cards", title: "Karten", text: "Drehe Karten um und bewerte mit Again, Hard, Good oder Easy.", duration: "4-7 Min", xp: "Mittel", difficulty: "Leicht", target: 10 },
    { id: "learn", title: "Lernen", text: "Erst Choice-Fragen zum Warmwerden, danach Schreibfragen zum Festigen.", duration: "6-9 Min", xp: "Hoch", difficulty: "Mittel", target: 8 },
    { id: "test", title: "Test", text: "Gemischte Prüfungsrunde mit Schreiben und Choice.", duration: "8-12 Min", xp: "Sehr hoch", difficulty: "Hoch", target: 10 },
    { id: "match", title: "Zuordnen", text: "Verbinde Begriffe mit passenden Lösungen.", duration: "3-5 Min", xp: "Mittel", difficulty: "Mittel", target: 6 }
  ];
  const comboRewards = { 3: 5, 5: 10, 10: 20 };
  const leaderboardCategory = { label: "XP", field: "weeklyXp", unit: "XP", note: "diese Woche gelernt" };
  const uploadLimits = {
    text: 24000,
    chatText: 5000,
    imageBytes: 5 * 1024 * 1024,
    pdfBytes: 8 * 1024 * 1024,
    textBytes: 2 * 1024 * 1024
  };
  const leagueTiers = [
    { id: "snow-paw", name: "Snow Paw Liga", min: 0, image: "/src/assets/leagues-optimized/snow-paw.webp", fallback: "/src/assets/leagues-complete/snow-paw.png" },
    { id: "forest-lynx", name: "Forest Lynx Liga", min: 180, image: "/src/assets/leagues-optimized/forest-lynx.webp", fallback: "/src/assets/leagues-complete/forest-lynx.png" },
    { id: "river-lynx", name: "River Lynx Liga", min: 420, image: "/src/assets/leagues-optimized/river-lynx.webp", fallback: "/src/assets/leagues-complete/river-lynx.png" },
    { id: "mountain-lynx", name: "Mountain Lynx Liga", min: 760, image: "/src/assets/leagues-optimized/mountain-lynx.webp", fallback: "/src/assets/leagues-complete/mountain-lynx.png" },
    { id: "alpine-lynx", name: "Alpine Lynx Liga", min: 1180, image: "/src/assets/leagues-optimized/alpine-lynx.webp", fallback: "/src/assets/leagues-complete/alpine-lynx.png" },
    { id: "shadow-lynx", name: "Shadow Lynx Liga", min: 1680, image: "/src/assets/leagues-optimized/shadow-lynx.webp", fallback: "/src/assets/leagues-complete/shadow-lynx.png" },
    { id: "crystal-lynx", name: "Crystal Lynx Liga", min: 2260, image: "/src/assets/leagues-optimized/crystal-lynx.webp", fallback: "/src/assets/leagues-complete/crystal-lynx.png" },
    { id: "aurora-lynx", name: "Aurora Lynx Liga", min: 2920, image: "/src/assets/leagues-optimized/aurora-lynx.webp", fallback: "/src/assets/leagues-complete/aurora-lynx.png" },
    { id: "northern-light", name: "Northern Light Liga", min: 3660, image: "/src/assets/leagues-optimized/northern-light.webp", fallback: "/src/assets/leagues-complete/northern-light.png" },
    { id: "apex-lynx", name: "Apex Lynx Liga", min: 4500, image: "/src/assets/leagues-optimized/apex-lynx.webp", fallback: "/src/assets/leagues-complete/apex-lynx.png" }
  ];
  const classLeagueCategory = { label: "XP", field: "weeklyXp", unit: "XP", note: "diese Woche gelernt" };
  const countryOptions = [
    { id: "CH", label: "Switzerland" },
    { id: "DE", label: "Germany" },
    { id: "AT", label: "Austria" },
    { id: "US", label: "United States" },
    { id: "UK", label: "United Kingdom" },
    { id: "OTHER", label: "Other" }
  ];
  const schoolLevelOptions = {
    CH: [
      { id: "primary", label: "Primarschule" },
      { id: "secondary", label: "Sekundarschule" },
      { id: "gymi", label: "Gymnasium / Gymi" },
      { id: "apprenticeship", label: "Berufsschule" },
      { id: "university", label: "Universität / FH" },
      { id: "other", label: "Other" }
    ],
    DE: [
      { id: "primary", label: "Grundschule" },
      { id: "hauptschule", label: "Hauptschule" },
      { id: "realschule", label: "Realschule" },
      { id: "gymnasium", label: "Gymnasium" },
      { id: "comprehensive", label: "Gesamtschule" },
      { id: "apprenticeship", label: "Berufsschule" },
      { id: "university", label: "Universität / Hochschule" },
      { id: "other", label: "Other" }
    ],
    AT: [
      { id: "primary", label: "Volksschule" },
      { id: "middle", label: "Mittelschule" },
      { id: "ahs", label: "AHS" },
      { id: "bhs", label: "BHS" },
      { id: "apprenticeship", label: "Berufsschule" },
      { id: "university", label: "Universität / FH" },
      { id: "other", label: "Other" }
    ],
    US: [
      { id: "elementary", label: "Elementary school" },
      { id: "middle", label: "Middle school" },
      { id: "high_school", label: "High school" },
      { id: "university", label: "College / University" },
      { id: "other", label: "Other" }
    ],
    UK: [
      { id: "primary", label: "Primary school" },
      { id: "secondary", label: "Secondary school" },
      { id: "sixth_form", label: "Sixth form / College" },
      { id: "university", label: "University" },
      { id: "other", label: "Other" }
    ],
    OTHER: [
      { id: "elementary", label: "Elementary school" },
      { id: "middle", label: "Middle school" },
      { id: "high_school", label: "High school" },
      { id: "university", label: "University" },
      { id: "other", label: "Other" }
    ]
  };
  const mainGoalOptions = [
    { id: "grades", label: "Track grades" },
    { id: "tests", label: "Prepare for tests" },
    { id: "tasks", label: "Organize tasks" },
    { id: "cards", label: "Study with cards" },
    { id: "all", label: "All of the above" }
  ];
  const schoolGradeSystems = [
    { id: "swiss_1_6", label: "Swiss 1-6", appId: "ch", language: "de-CH", higherIsBetter: true },
    { id: "german_1_6", label: "German 1-6", appId: "de", language: "de-DE", higherIsBetter: false },
    { id: "us_gpa", label: "US GPA 0-4", appId: "us", language: "en-US", higherIsBetter: true },
    { id: "uk_general", label: "UK GCSE 1-9", appId: "uk", language: "en-GB", higherIsBetter: true },
    { id: "generic", label: "Generic average", appId: "ch", language: "en-US", higherIsBetter: true }
  ];
  const schoolGoalLabels = {
    grades: "Track grades",
    tests: "Prepare for tests",
    tasks: "Organize tasks",
    cards: "Study with cards",
    all: "All of the above"
  };
  const gradeSystemBySchoolId = (id) => schoolGradeSystems.find((system) => system.id === id) || schoolGradeSystems[0];
  const countryById = (id) => countryOptions.find((country) => country.id === id) || countryOptions[0];
  const levelsForCountry = (country) => schoolLevelOptions[country] || schoolLevelOptions.OTHER;
  const levelById = (country, id) => levelsForCountry(country).find((level) => level.id === id) || levelsForCountry(country)[0];
  const defaultLevelForCountry = (country) => ({
    CH: "gymi",
    DE: "gymnasium",
    AT: "ahs",
    US: "high_school",
    UK: "secondary",
    OTHER: "high_school"
  })[country] || "high_school";
  const defaultGradeSystemFor = (country) => ({
    CH: "swiss_1_6",
    DE: "german_1_6",
    AT: "german_1_6",
    US: "us_gpa",
    UK: "uk_general"
  })[country] || "generic";
  const defaultLanguageStyleFor = (country) => ({
    CH: "de_ch",
    DE: "de_standard",
    AT: "de_standard",
    US: "en_us",
    UK: "en_uk"
  })[country] || "simple";
  const schoolDefaultsFor = (country = "CH", schoolLevel = "") => {
    const level = schoolLevel || defaultLevelForCountry(country);
    const gradingSystem = defaultGradeSystemFor(country);
    const gradeMeta = gradeSystemBySchoolId(gradingSystem);
    const plusPointsEnabled = country === "CH" && level === "gymi";
    return {
      country,
      countryLabel: countryById(country).label,
      schoolLevel: level,
      schoolLevelLabel: levelById(country, level).label,
      programme: "",
      mainGoal: "all",
      gradingSystem,
      plusPointsEnabled,
      languageStyle: defaultLanguageStyleFor(country),
      gradeDisplayMode: plusPointsEnabled ? "average_pluspunkte" : (gradingSystem === "us_gpa" ? "gpa" : "average"),
      onboardingCompleted: false,
      appGradeSystem: gradeMeta.appId,
      language: gradeMeta.language
    };
  };
  const inferSchoolProfile = () => {
    const oldSystem = state.settings?.gradeSystem || state.user?.region || "ch";
    const country = oldSystem === "us" ? "US" : oldSystem === "de" ? "DE" : oldSystem === "uk" ? "UK" : oldSystem === "at" ? "AT" : "CH";
    const defaults = schoolDefaultsFor(country, defaultLevelForCountry(country));
    return { ...defaults, onboardingCompleted: Boolean(state.user?.loggedIn) };
  };
  const normalizeSchoolProfile = (profile = {}) => {
    const base = profile?.country ? schoolDefaultsFor(profile.country, profile.schoolLevel || defaultLevelForCountry(profile.country)) : inferSchoolProfile();
    const country = countryById(profile.country || base.country).id;
    const level = levelById(country, profile.schoolLevel || base.schoolLevel).id;
    const defaults = schoolDefaultsFor(country, level);
    const gradingSystem = schoolGradeSystems.some((system) => system.id === profile.gradingSystem) ? profile.gradingSystem : defaults.gradingSystem;
    const gradeMeta = gradeSystemBySchoolId(gradingSystem);
    const plusAvailable = country === "CH" && level === "gymi";
    return {
      ...defaults,
      ...profile,
      country,
      countryLabel: countryById(country).label,
      schoolLevel: level,
      schoolLevelLabel: levelById(country, level).label,
      gradingSystem,
      plusPointsEnabled: plusAvailable && profile.plusPointsEnabled !== false,
      languageStyle: profile.languageStyle || defaults.languageStyle,
      gradeDisplayMode: profile.gradeDisplayMode || (plusAvailable ? "average_pluspunkte" : gradingSystem === "us_gpa" ? "gpa" : "average"),
      onboardingCompleted: Boolean(profile.onboardingCompleted),
      appGradeSystem: gradeMeta.appId,
      language: gradeMeta.language
    };
  };
  const buildSchoolProfile = (data = {}, existing = {}, completed = true) => {
    const country = countryById(data.country || existing.country || "CH").id;
    const level = levelById(country, data.schoolLevel || existing.schoolLevel || defaultLevelForCountry(country)).id;
    const defaults = schoolDefaultsFor(country, level);
    const plusAvailable = country === "CH" && level === "gymi";
    return normalizeSchoolProfile({
      ...defaults,
      ...existing,
      country,
      schoolLevel: level,
      mainGoal: data.mainGoal || existing.mainGoal || "all",
      gradingSystem: data.gradingSystem || defaults.gradingSystem,
      plusPointsEnabled: plusAvailable && (data.plusPointsEnabled === "on" || data.plusPointsEnabled === true || existing.plusPointsEnabled === true),
      languageStyle: data.languageStyle || existing.languageStyle || defaults.languageStyle,
      onboardingCompleted: completed
    });
  };
  const schoolProfile = () => state.schoolProfile || normalizeSchoolProfile();
  const isUniversityProfile = () => schoolProfile().schoolLevel === "university";
  const isSwissProfile = () => schoolProfile().country === "CH";
  const isGermanProfile = () => ["CH", "DE", "AT"].includes(schoolProfile().country);
  const isUsProfile = () => schoolProfile().country === "US";
  const isSwissGymiProfile = () => isSwissProfile() && schoolProfile().schoolLevel === "gymi";
  const shouldShowPluspunkte = () => isSwissGymiProfile() && schoolProfile().plusPointsEnabled === true;
  const schoolLabels = () => {
    const profile = schoolProfile();
    const university = profile.schoolLevel === "university";
    if (profile.country === "US") {
      return {
        greeting: "Hi",
        subtitle: "Small steps, big progress.",
        focusLabel: "Today's Focus",
        doneTitle: "Done for today!",
        doneDescription: "Great job. Your small study step is complete.",
        reviewStart: "Start focused review",
        testNoun: "test",
        examNoun: "test",
        homeworkNoun: "assignment",
        gradeTitle: university ? "Courses" : "Grades",
        gradeMetric: "GPA",
        gradeSubtext: "Current average",
        noGrades: university ? "No courses yet" : "No grades yet",
        addGrade: university ? "Add your first course" : "Add your first grade",
        planTitle: "Plan",
        dueToday: "due today",
        aiCoach: "AI Coach",
        askLynxly: "Ask Lynxly",
        progress: "Progress",
        overall: "overall",
        profile: "Profile",
        navGrades: university ? "Courses" : "Grades",
        navProfile: "Profile",
        reminderTitle: "Reminders",
        reminderEmpty: "No reminders right now",
        reminderEmptyText: "You're all caught up.",
        view: "View",
        pointsTitle: "Plus points"
      };
    }
    if (profile.country === "UK") {
      return {
        greeting: "Hi",
        subtitle: "Small steps, big progress.",
        focusLabel: "Today's Focus",
        doneTitle: "Done for today!",
        doneDescription: "Great job. Your small study step is complete.",
        reviewStart: "Start focused review",
        testNoun: "test",
        examNoun: "test",
        homeworkNoun: "assignment",
        gradeTitle: university ? "Courses" : "Grades",
        gradeMetric: "Grade",
        gradeSubtext: "Current average",
        noGrades: university ? "No courses yet" : "No grades yet",
        addGrade: university ? "Add your first course" : "Add your first grade",
        planTitle: "Plan",
        dueToday: "due today",
        aiCoach: "AI Coach",
        askLynxly: "Ask Lynxly",
        progress: "Progress",
        overall: "overall",
        profile: "Profile",
        navGrades: university ? "Courses" : "Grades",
        navProfile: "Profile",
        reminderTitle: "Reminders",
        reminderEmpty: "No reminders right now",
        reminderEmptyText: "You're all caught up.",
        view: "View",
        pointsTitle: "Plus points"
      };
    }
    const swiss = profile.country === "CH" && profile.languageStyle !== "de_standard";
    return {
      greeting: swiss ? "Hoi" : "Hi",
      subtitle: swiss ? "Kleine Schritte, grosse Fortschritte." : "Kleine Schritte, große Fortschritte.",
      focusLabel: "Heutiger Fokus",
      doneTitle: "Für heute erledigt!",
      doneDescription: "Stark gemacht. Dein kleiner Lernschritt ist geschafft.",
      reviewStart: "Review starten",
      testNoun: swiss ? "Prüfung" : "Klausur",
      examNoun: swiss ? "Prüfung" : "Klausur",
      homeworkNoun: "Aufgabe",
      gradeTitle: university ? "Kurse" : "Noten",
      gradeMetric: university ? "Schnitt" : "Schnitt",
      gradeSubtext: "Aktueller Schnitt",
      noGrades: university ? "Noch keine Kurse" : "Noch keine Noten",
      addGrade: university ? "Ersten Kurs hinzufügen" : "Erste Note hinzufügen",
      planTitle: "Plan",
      dueToday: "Heute fällig",
      aiCoach: "AI Coach",
      askLynxly: "Frag Lynxly",
      progress: "Fortschritt",
      overall: "gesamt",
      profile: "Profil",
      navGrades: university ? "Kurse" : "Noten",
      navProfile: "Profil",
      reminderTitle: "Erinnerungen",
      reminderEmpty: "Keine Erinnerungen",
      reminderEmptyText: "Du bist gerade komplett auf dem neuesten Stand.",
      view: "Ansehen",
      pointsTitle: "Pluspunkte"
    };
  };

  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const pad = (value) => String(value).padStart(2, "0");
  const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const todayIso = () => toIso(new Date());
  const dateObject = (iso) => {
    if (iso instanceof Date) return iso;
    const value = String(iso || "").trim();
    if (!value) return new Date(Number.NaN);
    if (value.includes("T")) return new Date(value);
    return new Date(`${value}T12:00:00`);
  };
  const monthKey = () => todayIso().slice(0, 7);
  const weekKey = (iso = todayIso()) => {
    const date = dateObject(iso || todayIso());
    const weekday = date.getDay() || 7;
    date.setDate(date.getDate() - weekday + 1);
    return toIso(date);
  };
  const save = () => window.StudyUpStorage.save(state);
  const formData = (form) => Object.fromEntries(new FormData(form).entries());
  const parseNumberInput = (value, fallback = NaN) => {
    const normalized = String(value ?? "").trim().replace(",", ".");
    if (!normalized) return fallback;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  };
  const parseWeightInput = (value, fallback = 1) => {
    const raw = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(",", ".");
    if (!raw) return fallback;
    const isPercent = raw.endsWith("%");
    const numeric = raw.replace(/%$/, "").replace(/x$/, "");
    const number = Number(numeric);
    if (!Number.isFinite(number) || number <= 0) return fallback;
    return Math.max(0.01, isPercent ? number / 100 : number);
  };
  const formatWeightInput = (value) => {
    const number = Math.max(0.01, Number(value || 1));
    if (!Number.isFinite(number)) return "1";
    if (number > 0 && number < 1) return `${Math.round(number * 100)}%`;
    return String(Number(number.toFixed(2))).replace(".", ",");
  };
  const formatWeightLabel = (value) => {
    const formatted = formatWeightInput(value);
    return formatted.endsWith("%") ? formatted : `${formatted}x`;
  };
  const formatWeightPercentLabel = (value) => `${Math.round(Math.max(0.01, Number(value || 1)) * 100)}%`;
  const normalizePartialGrade = (grade) => ({
    id: grade.id || uid("part"),
    title: grade.title || "Teilprüfung",
    date: grade.date || todayIso(),
    value: Number(grade.value || 0),
    weight: Number(grade.weight || 1),
    categoryId: grade.categoryId || ""
  });
  const defaultGradeCategories = () => [
    { id: uid("cat"), name: "Tests", percentage: 50 },
    { id: uid("cat"), name: "Mitarbeit", percentage: 15 },
    { id: uid("cat"), name: "Hausaufgaben", percentage: 15 },
    { id: uid("cat"), name: "Projekte", percentage: 20 }
  ];
  const normalizeGradeEntry = (grade) => {
    if (grade.type === "partial") {
      return {
        id: grade.id || uid("partial"),
        type: "partial",
        title: grade.title || "Teilnoten",
        date: grade.date || todayIso(),
        weight: Number(grade.weight || 1),
        categoryId: grade.categoryId || "",
        topic: grade.topic || "",
        comment: grade.comment || "",
        linkedDeckId: grade.linkedDeckId || "",
        linkedPlanTaskId: grade.linkedPlanTaskId || "",
        partialGrades: (grade.partialGrades || []).map(normalizePartialGrade)
      };
    }
    return {
      id: grade.id || uid("grade"),
      type: grade.type || grade.category || "exam",
      title: grade.title || "Prüfung",
      date: grade.date || todayIso(),
      value: Number(grade.value ?? grade.grade ?? grade.note ?? 0),
      weight: Number(grade.weight || 1),
      categoryId: grade.categoryId || "",
      topic: grade.topic || "",
      comment: grade.comment || "",
      linkedDeckId: grade.linkedDeckId || "",
      linkedPlanTaskId: grade.linkedPlanTaskId || ""
    };
  };
  const normalizeMistake = (mistake) => {
    const subject = mistake.subject || "Allgemein";
    const topic = mistake.topic || "";
    return {
      id: mistake.id || uid("mistake"),
      topicId: mistake.topicId || `topic:${String(`${subject}:${topic || "grundlagen"}`).toLocaleLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-").replace(/^-|-$/g, "")}`,
      subject,
      topic,
      question: mistake.question || "Unklare Aufgabe",
      correctAnswer: mistake.correctAnswer || "",
      userAnswer: mistake.userAnswer || "",
      explanation: mistake.explanation || "",
      createdDate: mistake.createdDate || todayIso(),
      reviewStatus: mistake.reviewStatus || "open",
      reviewDate: mistake.reviewDate || "",
      aiExplanation: mistake.aiExplanation || "",
      retryQuestion: mistake.retryQuestion || "",
      reviewedAt: mistake.reviewedAt || "",
      fixedAt: mistake.fixedAt || (mistake.reviewStatus === "fixed" ? (mistake.createdDate || todayIso()) : ""),
      source: mistake.source || "manuell",
      reviewCount: Number(mistake.reviewCount || 0),
      attemptCount: Number(mistake.attemptCount || 0)
    };
  };
  const normalizeLearningEntity = (item, prefix) => ({
    ...item,
    id: item?.id || uid(prefix)
  });
  const normalizeFlashcard = (card) => {
    const normalized = {
      source: "private",
      reviewCount: 0,
      published: false,
      deckType: "custom",
      topic: "",
      title: card?.subject || "Study Cards",
      ...card,
      id: card?.id || uid("card")
    };
    normalized.deckId = normalized.deckId || normalized.packId || `deck:${normalizeAnswerText(normalized.title || normalized.subject || "cards").replace(/\s+/g, "-")}`;
    normalized.topicId = normalized.topicId || `topic:${normalizeAnswerText(`${normalized.subject}:${normalized.topic || normalized.title}`).replace(/\s+/g, "-")}`;
    return normalized;
  };
  const premiumCore = () => window.LynxlyPremium;
  const premiumConfig = () => premiumCore()?.PREMIUM_CONFIG || window.LynxlyPremiumConfig || { plans: {}, features: {}, creditCosts: {}, actionLabels: {} };
  const aiLimitForPlan = (plan) => premiumCore()?.PREMIUM_CONFIG?.plans?.[plan]?.monthlyCredits || 10;
  const planLabel = (plan) => premiumCore()?.planLabel?.(plan) || ({ free: "Free", plus: "Lynxly Plus", exam_pass: "Exam Pass", pro: "Pro" })[plan] || "Free";
  const actionCost = (action) => premiumCore()?.actionCost?.(action) || Number(premiumConfig().creditCosts?.[action] || 0);
  const actionLabel = (action) => premiumCore()?.actionLabel?.(action) || premiumConfig().actionLabels?.[action] || action;
  const planConfig = (plan) => premiumConfig().plans?.[plan] || {};
  const featureConfig = (id) => premiumConfig().features?.[id] || { id, label: id, implemented: false };
  const planFeatureItems = (plan) => (planConfig(plan).features || []).map(featureConfig);
  const ensureEntitlementClientId = () => {
    state.entitlements = state.entitlements || {};
    if (!state.entitlements.clientId) {
      const random = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      state.entitlements.clientId = `local:${random}`;
    }
    return state.entitlements.clientId;
  };
  const normalizeEntitlement = (entitlement = null) => premiumCore()?.normalizeEntitlement?.(entitlement || state.entitlements?.cached || {}) || {
    plan: "free",
    billingCycle: "annual",
    paidSubscription: false,
    serverVerified: false,
    trial: { used: false, active: false, startedAt: "", endsAt: "" },
    examPass: { active: false, startedAt: "", endsAt: "" },
    proWaitlist: false,
    aiCredits: { month: monthKey(), used: 0, allowance: 10 }
  };
  const updateEntitlementCache = (entitlement) => {
    if (!entitlement) return normalizeEntitlement();
    state.entitlements = state.entitlements || {};
    state.entitlements.cached = normalizeEntitlement(entitlement);
    state.entitlements.lastSyncAt = new Date().toISOString();
    state.settings.plan = state.entitlements.cached.plan === "exam_pass" ? "plus" : state.entitlements.cached.plan;
    state.settings.premiumActive = ["plus", "exam_pass"].includes(state.entitlements.cached.plan);
    state.settings.planName = planLabel(state.entitlements.cached.plan);
    state.settings.aiLimit = Number(state.entitlements.cached.aiCredits.allowance || 10);
    state.settings.aiCreditsAllowance = Number(state.entitlements.cached.aiCredits.allowance || 10);
    state.settings.aiCreditsUsed = Number(state.entitlements.cached.aiCredits.used || 0);
    state.settings.aiCreditsMonth = state.entitlements.cached.aiCredits.month || monthKey();
    return state.entitlements.cached;
  };
  const currentEntitlement = () => updateEntitlementCache(state.entitlements?.cached);
  const entitlementHeaders = (extra = {}) => ({ ...extra });
  const syncEntitlements = async () => {
    try {
      const response = await fetch("/api/entitlements", { headers: entitlementHeaders(), credentials: "same-origin" });
      const data = await response.json();
      if (response.ok && data.entitlement) {
        updateEntitlementCache(data.entitlement);
        save();
      }
      return data.entitlement || currentEntitlement();
    } catch (error) {
      console.warn("Entitlements konnten nicht synchronisiert werden.", error);
      return currentEntitlement();
    }
  };
  const defaultWeeklyStats = () => ({
    weekKey: weekKey(),
    xp: 0,
    cardsReviewed: 0,
    mistakesFixed: 0,
    mistakesReviewed: 0,
    studySessions: 0,
    studyDays: [],
    studyTasksAdded: 0,
    questsCompleted: 0
  });
  const defaultRecords = () => ({
    bestWeeklyXp: 0,
    bestCardsWeek: 0,
    bestMistakesWeek: 0,
    bestSessionsWeek: 0,
    totalCardsReviewed: 0,
    totalMistakesFixed: 0,
    totalStudySessions: 0
  });
  const defaultFriends = () => copy(window.StudyUpSeed.friends || []);
  const defaultChallenge = () => ({ ...window.StudyUpSeed.friendsChallenge, weekKey: weekKey() });
  const defaultClassLeague = () => ({ ...copy(window.StudyUpSeed.classLeague || {}), weekKey: weekKey() });
  const defaultWeeklyLeagueStats = () => ({
    weekKey: weekKey(),
    weeklyXp: 0,
    cardsReviewed: 0,
    mistakesFixed: 0,
    studySessions: 0,
    improved: 0
  });
  const defaultDailyDeckStats = () => ({
    date: todayIso(),
    fullSessions: 0,
    sessionsCompleted: 0,
    cardXp: 0,
    deckXp: 0
  });
  const defaultWeeklyDeckChallenge = () => ({
    weekKey: weekKey(),
    target: 5,
    progress: 0,
    rewardXp: 150,
    rewarded: false
  });
  const defaultCardStudySession = () => ({
    choosing: false,
    active: false,
    completed: false,
    mode: "",
    testStarted: false,
    testSetup: { write: true, choice: true, mixed: true, direction: "front" },
    currentAnswer: "",
    selectedChoice: "",
    selectedPromptId: "",
    selectedAnswerId: "",
    selectedMatchTileId: "",
    awaitingNext: false,
    lastResult: null,
    answers: [],
    testQuestions: [],
    matchPairs: [],
    promptOrder: [],
    answerOrder: [],
    matchTileOrder: [],
    matchedIds: [],
    lastWrongTileIds: [],
    matchStartedAt: "",
    matchCompletedAt: "",
    matchPenaltySeconds: 0,
    matchTimed: false
  });
  const defaultMistakeReviewSession = () => ({
    active: false,
    completed: false,
    mistakeIds: [],
    reviewedIds: [],
    index: 0,
    phase: "question",
    answer: "",
    attempts: 0,
    correct: 0,
    reviewed: 0,
    reason: "",
    startedAt: "",
    completedAt: ""
  });
  const tierForXp = (xp) => [...leagueTiers].reverse().find((tier) => Number(xp || 0) >= tier.min) || leagueTiers[0];
  const tierAliases = { snow: "snow-paw", forest: "forest-lynx", alpine: "alpine-lynx", shadow: "shadow-lynx", northern: "northern-light" };
  const tierById = (id) => {
    const normalized = tierAliases[id] || id;
    return leagueTiers.find((tier) => tier.id === normalized) || leagueTiers[1];
  };
  const leagueSymbolMarkup = {
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><circle cx="12" cy="12" r="2.2"/>',
    forest: '<path d="M5 13c5.5-8 12-8 14-8-1 8-5 14-14 14 0-2 0-4 0-6Z"/><path d="M7 16c4-1 7-4 10-8"/>',
    alpine: '<path d="M3 19 9 7l3 5 3-7 6 14H3Z"/><path d="m9 7 2 4-3-1M15 5l2.3 5-3.3-1"/>',
    shadow: '<path d="M16.5 3.5c-4.7 1-8 4.7-8 8.5s3.3 7.5 8 8.5C10.1 20.5 5 16.8 5 12s5.1-8.5 11.5-8.5Z"/><path d="m17 8 1 2.2 2.4.2-1.8 1.5.6 2.3-2.2-1.2-2.1 1.2.5-2.3-1.8-1.5 2.4-.2Z"/>',
    northern: '<path d="M4 17c2-7 4.4-10 8-10s6 3 8 10"/><path d="M7 17c1.2-4 3-6 5-6s3.8 2 5 6"/><path d="M12 2l1.1 2.9 3.1.2-2.4 1.9.8 3-2.6-1.7L9.4 10l.8-3-2.4-1.9 3.1-.2Z"/>'
  };
  const leagueSymbol = (tierId, withName = false) => {
    const tier = tierById(typeof tierId === "string" ? tierId : tierId?.id);
    if (tier.image) {
      return `
        <span class="league-symbol league-image-symbol league-${C.escapeHtml(tier.id)}" title="${C.escapeHtml(tier.name)}" aria-label="${C.escapeHtml(tier.name)}">
          <img src="${C.escapeHtml(tier.image)}" alt="" width="96" height="96" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${C.escapeHtml(tier.fallback || tier.image)}';" />
          ${withName ? `<small>${C.escapeHtml(tier.name)}</small>` : ""}
        </span>
      `;
    }
    const icon = leagueSymbolMarkup[tier.id] || leagueSymbolMarkup.forest;
    return `
      <span class="league-symbol league-${C.escapeHtml(tier.id)}" title="${C.escapeHtml(tier.name)}" aria-label="${C.escapeHtml(tier.name)}">
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">${icon}</svg>
        ${withName ? `<small>${C.escapeHtml(tier.name)}</small>` : ""}
      </span>
    `;
  };
  const makeDailyQuests = () => questTemplates.map((quest) => ({
    ...quest,
    progress: 0,
    completed: false,
    rewarded: false
  }));
  const levelForXp = (xp) => {
    const total = Number(xp || 0);
    return [...levelDefinitions].reverse().find((level) => total >= level.min) || levelDefinitions[0];
  };
  const nextLevelFor = (level) => levelDefinitions.find((item) => item.level === level.level + 1) || null;
  const levelProgress = () => {
    const current = levelForXp(state.xpTotal);
    const next = nextLevelFor(current);
    const end = next ? next.min : current.next;
    const span = Math.max(1, end - current.min);
    const gained = Math.max(0, Number(state.xpTotal || 0) - current.min);
    return { current, next, percent: Math.min(100, Math.round((gained / span) * 100)), remaining: Math.max(0, end - Number(state.xpTotal || 0)), end };
  };
  const normalizeQuest = (quest) => {
    const template = questTemplates.find((item) => item.id === quest.id) || questTemplates[0];
    const progress = Number(quest.progress || 0);
    return {
      ...template,
      ...quest,
      progress,
      completed: Boolean(quest.completed || progress >= Number(quest.target || template.target)),
      rewarded: Boolean(quest.rewarded)
    };
  };
  const normalizeBadge = (badge) => {
    if (typeof badge === "string") return { id: badge, unlockedAt: todayIso() };
    return { id: badge.id, unlockedAt: badge.unlockedAt || todayIso() };
  };
  const updatePersonalRecords = () => {
    state.personalRecords.bestWeeklyXp = Math.max(Number(state.personalRecords.bestWeeklyXp || 0), Number(state.weeklyStats.xp || 0));
    state.personalRecords.bestCardsWeek = Math.max(Number(state.personalRecords.bestCardsWeek || 0), Number(state.weeklyStats.cardsReviewed || 0));
    state.personalRecords.bestMistakesWeek = Math.max(Number(state.personalRecords.bestMistakesWeek || 0), Number(state.weeklyStats.mistakesFixed || 0));
    state.personalRecords.bestSessionsWeek = Math.max(Number(state.personalRecords.bestSessionsWeek || 0), Number(state.weeklyStats.studySessions || 0));
  };
  const ensureGamification = () => {
    const currentWeek = weekKey();
    state.xpTotal = Number(state.xpTotal || 0);
    state.level = levelForXp(state.xpTotal).level;
    state.badges = (state.badges || []).map(normalizeBadge).filter((badge) => badge.id);
    state.personalRecords = { ...defaultRecords(), ...(state.personalRecords || {}) };
    if (!state.weeklyStats || state.weeklyStats.weekKey !== currentWeek) {
      if (state.weeklyStats) {
        state.personalRecords.bestWeeklyXp = Math.max(Number(state.personalRecords.bestWeeklyXp || 0), Number(state.weeklyStats.xp || 0));
        state.personalRecords.bestCardsWeek = Math.max(Number(state.personalRecords.bestCardsWeek || 0), Number(state.weeklyStats.cardsReviewed || 0));
        state.personalRecords.bestMistakesWeek = Math.max(Number(state.personalRecords.bestMistakesWeek || 0), Number(state.weeklyStats.mistakesFixed || 0));
        state.personalRecords.bestSessionsWeek = Math.max(Number(state.personalRecords.bestSessionsWeek || 0), Number(state.weeklyStats.studySessions || 0));
      }
      state.weeklyStats = defaultWeeklyStats();
      state.xpThisWeek = 0;
    } else {
      state.weeklyStats = { ...defaultWeeklyStats(), ...state.weeklyStats, weekKey: currentWeek };
      state.weeklyStats.studyDays = Array.isArray(state.weeklyStats.studyDays) ? state.weeklyStats.studyDays : [];
      state.xpThisWeek = Number(state.weeklyStats.xp || state.xpThisWeek || 0);
    }
    if (state.dailyQuestDate !== todayIso() || !Array.isArray(state.dailyQuests) || state.dailyQuests.length !== questTemplates.length) {
      state.dailyQuestDate = todayIso();
      state.dailyQuests = makeDailyQuests();
    } else {
      state.dailyQuests = state.dailyQuests.map(normalizeQuest);
    }
    state.friends = state.friends?.length ? state.friends : defaultFriends();
    state.friendsChallenge = { ...defaultChallenge(), ...(state.friendsChallenge || {}), weekKey: currentWeek };
    state.leaderboardPrivacy = {
      visible: false,
      displayName: state.user?.name || "Du",
      ...(state.leaderboardPrivacy || {})
    };
    if (!state.leaderboardPrivacy.displayName) state.leaderboardPrivacy.displayName = state.user?.name || "Du";
    if (!state.weeklyLeagueStats || state.weeklyLeagueStats.weekKey !== currentWeek) {
      state.weeklyLeagueStats = defaultWeeklyLeagueStats();
    } else {
      state.weeklyLeagueStats = { ...defaultWeeklyLeagueStats(), ...state.weeklyLeagueStats, weekKey: currentWeek };
    }
    state.weeklyLeagueStats.weeklyXp = Math.max(Number(state.weeklyLeagueStats.weeklyXp || 0), Number(state.xpThisWeek || 0));
    state.weeklyLeagueStats.cardsReviewed = Math.max(Number(state.weeklyLeagueStats.cardsReviewed || 0), Number(state.weeklyStats.cardsReviewed || 0));
    state.weeklyLeagueStats.mistakesFixed = Math.max(Number(state.weeklyLeagueStats.mistakesFixed || 0), Number(state.weeklyStats.mistakesFixed || 0));
    state.weeklyLeagueStats.studySessions = Math.max(Number(state.weeklyLeagueStats.studySessions || 0), Number(state.weeklyStats.studySessions || 0));
    state.weeklyLeagueStats.improved = Math.max(Number(state.weeklyLeagueStats.improved || 0), Math.round(Number(state.xpThisWeek || 0) / 25));
    const oldClassWeek = state.classLeague?.weekKey || "";
    state.classLeague = { ...defaultClassLeague(), ...(state.classLeague || {}), weekKey: currentWeek };
    if (oldClassWeek && oldClassWeek !== currentWeek) state.classLeague.bonusAwarded = false;
    state.classLeague.goals = {
      cardsReviewed: 400,
      mistakesFixed: 80,
      studySessions: 40,
      ...(state.classLeague.goals || {})
    };
    state.classLeague.classmates = state.classLeague.classmates?.length ? state.classLeague.classmates : copy(window.StudyUpSeed.classLeague.classmates);
    state.classLeaguePrivacy = {
      joined: false,
      visible: false,
      displayName: state.user?.name || "Du",
      ...(state.classLeaguePrivacy || {})
    };
    if (!state.classLeaguePrivacy.displayName) state.classLeaguePrivacy.displayName = state.user?.name || "Du";
    state.classLeagueDemo = state.classLeagueDemo !== false;
    state.recentXpEvents = Array.isArray(state.recentXpEvents) ? state.recentXpEvents.slice(0, 12) : [];
    state.leagueTier = tierById(state.leagueTier || state.classLeague.tier || "forest-lynx").id;
    state.classCode = state.classCode || state.classLeague.classCode || "LYNX-2B";
    state.classLeague.tier = state.leagueTier;
    state.classLeague.classCode = state.classCode;
    state.deckSessions = state.deckSessions && typeof state.deckSessions === "object" && !Array.isArray(state.deckSessions) ? state.deckSessions : {};
    state.deckSessionHistory = Array.isArray(state.deckSessionHistory) ? state.deckSessionHistory.slice(0, 80) : [];
    state.cardXpHistory = state.cardXpHistory && typeof state.cardXpHistory === "object" && !Array.isArray(state.cardXpHistory) ? state.cardXpHistory : {};
    state.learningMode = state.learningMode || "";
    state.activeModeSession = state.activeModeSession && typeof state.activeModeSession === "object" && !Array.isArray(state.activeModeSession) ? state.activeModeSession : {};
    state.modeHistory = Array.isArray(state.modeHistory) ? state.modeHistory.slice(0, 120) : [];
    state.deckModeRewards = state.deckModeRewards && typeof state.deckModeRewards === "object" && !Array.isArray(state.deckModeRewards) ? state.deckModeRewards : {};
    state.testResults = Array.isArray(state.testResults) ? state.testResults.slice(0, 80) : [];
    state.matchResults = Array.isArray(state.matchResults) ? state.matchResults.slice(0, 80) : [];
    if (!state.dailyDeckStats || state.dailyDeckStats.date !== todayIso()) {
      state.dailyDeckStats = defaultDailyDeckStats();
    } else {
      state.dailyDeckStats = { ...defaultDailyDeckStats(), ...state.dailyDeckStats, date: todayIso() };
    }
    if (!state.weeklyDeckChallenge || state.weeklyDeckChallenge.weekKey !== currentWeek) {
      state.weeklyDeckChallenge = defaultWeeklyDeckChallenge();
    } else {
      state.weeklyDeckChallenge = { ...defaultWeeklyDeckChallenge(), ...state.weeklyDeckChallenge, weekKey: currentWeek };
      state.weeklyDeckChallenge.progress = Math.min(Number(state.weeklyDeckChallenge.target || 5), Number(state.weeklyDeckChallenge.progress || 0));
    }
    state.cardStudySession = {
      ...defaultCardStudySession(),
      ...(state.cardStudySession || {})
    };
    state.cardStudySession.cardIds = Array.isArray(state.cardStudySession.cardIds) ? state.cardStudySession.cardIds : [];
    state.cardStudySession.reviewedIds = Array.isArray(state.cardStudySession.reviewedIds) ? state.cardStudySession.reviewedIds : [];
    state.cardStudySession.ratings = Array.isArray(state.cardStudySession.ratings) ? state.cardStudySession.ratings : [];
    state.cardStudySession.comboAwards = Array.isArray(state.cardStudySession.comboAwards) ? state.cardStudySession.comboAwards : [];
    state.cardStudySession.dueCardIds = Array.isArray(state.cardStudySession.dueCardIds) ? state.cardStudySession.dueCardIds : [];
    state.cardStudySession.testSetup = { ...defaultCardStudySession().testSetup, ...(state.cardStudySession.testSetup || {}) };
    state.cardStudySession.testQuestions = Array.isArray(state.cardStudySession.testQuestions) ? state.cardStudySession.testQuestions : [];
    state.cardStudySession.matchPairs = Array.isArray(state.cardStudySession.matchPairs) ? state.cardStudySession.matchPairs : [];
    state.cardStudySession.matchTileOrder = Array.isArray(state.cardStudySession.matchTileOrder) ? state.cardStudySession.matchTileOrder : [];
    state.cardStudySession.matchedIds = Array.isArray(state.cardStudySession.matchedIds) ? state.cardStudySession.matchedIds : [];
    state.cardStudySession.lastWrongTileIds = Array.isArray(state.cardStudySession.lastWrongTileIds) ? state.cardStudySession.lastWrongTileIds : [];
    if (state.cardStudySession.mode === "match" && state.cardStudySession.matchPairs.length > 6) {
      state.cardStudySession.matchPairs = state.cardStudySession.matchPairs.slice(0, 6);
      const matchPairIds = new Set(state.cardStudySession.matchPairs.map((pair) => pair.id));
      state.cardStudySession.matchTileOrder = state.cardStudySession.matchTileOrder.filter((tileId) => matchPairIds.has(parseMatchTileId(tileId).pairId));
      state.cardStudySession.matchedIds = state.cardStudySession.matchedIds.filter((id) => matchPairIds.has(id));
      state.cardStudySession.lastWrongTileIds = state.cardStudySession.lastWrongTileIds.filter((tileId) => matchPairIds.has(parseMatchTileId(tileId).pairId));
      state.cardStudySession.target = state.cardStudySession.matchPairs.length;
    }
    state.cardStudySession.matchPenaltySeconds = Number(state.cardStudySession.matchPenaltySeconds || 0);
    state.ui.progressTab = state.ui.progressTab || "me";
    state.ui.leaderboardTab = "xp";
    state.ui.classLeagueTab = "xp";
    updatePersonalRecords();
  };
  const recordStudyDay = () => {
    const today = todayIso();
    if (!state.weeklyStats.studyDays.includes(today)) state.weeklyStats.studyDays.push(today);
  };
  const showXpToast = (amount, reason = "XP erhalten", options = {}) => {
    const xp = Math.max(0, Number(amount || 0));
    if (!xp) return;
    const cleanReason = String(reason || "XP erhalten");
    state.recentXpEvents = [
      { id: uid("xp"), amount: xp, reason: cleanReason, date: new Date().toISOString() },
      ...(state.recentXpEvents || [])
    ].slice(0, 12);
    if (xpLive) xpLive.textContent = `${xp} XP erhalten: ${cleanReason}`;
    if (xpPill) {
      xpPill.classList.remove("gain");
      void xpPill.offsetWidth;
      xpPill.classList.add("gain");
    }
    if (!xpToastLayer) return;
    const toast = document.createElement("div");
    toast.className = `xp-toast ${options.levelUp ? "level-up" : ""}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-label", `${xp} XP erhalten: ${C.escapeHtml(cleanReason)}`);
    toast.innerHTML = `<strong>+${xp}</strong><i aria-hidden="true"></i><span>${C.escapeHtml(cleanReason)}</span>`;
    xpToastLayer.appendChild(toast);
    window.setTimeout(() => toast.remove(), options.levelUp ? 1800 : 1250);
  };
  const showLevelUpToast = (level) => {
    const name = level?.title || "Sharp Lynx";
    if (xpLive) xpLive.textContent = `Neue Liga! Du bist jetzt ${name}.`;
    if (!xpToastLayer) return;
    const toast = document.createElement("div");
    toast.className = "xp-toast level-up-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `${C.mascot("mascot-small")}<div><strong>Neue Liga!</strong><span>Du bist jetzt ${C.escapeHtml(name)}.</span></div>`;
    xpToastLayer.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  };
  const unlockBadge = (id) => {
    if (state.badges.some((badge) => badge.id === id)) return;
    state.badges.push({ id, unlockedAt: todayIso() });
  };
  const awardXp = (amount, reason = "XP erhalten") => {
    ensureGamification();
    const xp = Math.max(0, Number(amount || 0));
    if (!xp) return;
    const previousLevel = state.level;
    state.xpTotal = Number(state.xpTotal || 0) + xp;
    state.xpThisWeek = Number(state.xpThisWeek || 0) + xp;
    state.weeklyStats.xp = Number(state.weeklyStats.xp || 0) + xp;
    state.weeklyLeagueStats.weeklyXp = Number(state.weeklyLeagueStats.weeklyXp || 0) + xp;
    state.weeklyLeagueStats.improved = Math.max(Number(state.weeklyLeagueStats.improved || 0), Math.round(Number(state.xpThisWeek || 0) / 25));
    state.level = levelForXp(state.xpTotal).level;
    state.leagueTier = tierById(state.leagueTier || state.classLeague?.tier || "forest-lynx").id;
    state.classLeague.tier = state.leagueTier;
    recordStudyDay();
    updatePersonalRecords();
    showXpToast(xp, reason);
    if (state.level > previousLevel) showLevelUpToast(levelForXp(state.xpTotal));
  };
  const addQuestProgress = (metric, amount = 1) => {
    ensureGamification();
    state.dailyQuests.forEach((quest) => {
      if (quest.metric !== metric || quest.rewarded) return;
      quest.progress = Math.min(Number(quest.target || 1), Number(quest.progress || 0) + Number(amount || 1));
      quest.completed = quest.progress >= Number(quest.target || 1);
      if (quest.completed && !quest.rewarded) {
        quest.rewarded = true;
        state.weeklyStats.questsCompleted = Number(state.weeklyStats.questsCompleted || 0) + 1;
        awardXp(100, "Quest geschafft");
      }
    });
  };
  const classUserStats = () => ({
    id: "you",
    displayName: state.classLeaguePrivacy.visible ? (state.classLeaguePrivacy.displayName || "Du") : "Privat",
    initials: state.classLeaguePrivacy.visible ? (state.classLeaguePrivacy.displayName || state.user.name || "D").slice(0, 1).toUpperCase() : "P",
    private: !state.classLeaguePrivacy.visible,
    weeklyXp: Number(state.weeklyLeagueStats.weeklyXp || 0),
    cardsReviewed: Number(state.weeklyLeagueStats.cardsReviewed || 0),
    mistakesFixed: Number(state.weeklyLeagueStats.mistakesFixed || 0),
    studySessions: Number(state.weeklyLeagueStats.studySessions || 0),
    improved: Number(state.weeklyLeagueStats.improved || 0),
    tier: tierById(state.leagueTier || "forest-lynx").id
  });
  const classTeamTotals = () => {
    const own = classUserStats();
    const demo = state.classLeague.classmates || [];
    return {
      cardsReviewed: demo.reduce((sum, item) => sum + Number(item.cardsReviewed || 0), 0) + own.cardsReviewed,
      mistakesFixed: demo.reduce((sum, item) => sum + Number(item.mistakesFixed || 0), 0) + own.mistakesFixed,
      studySessions: demo.reduce((sum, item) => sum + Number(item.studySessions || 0), 0) + own.studySessions
    };
  };
  const checkClassBonus = () => {
    if (!state.classLeaguePrivacy.joined) return;
    const totals = classTeamTotals();
    const goals = state.classLeague.goals || {};
    const completed = totals.cardsReviewed >= Number(goals.cardsReviewed || 1)
      && totals.mistakesFixed >= Number(goals.mistakesFixed || 1)
      && totals.studySessions >= Number(goals.studySessions || 1);
    if (completed && !state.classLeague.bonusAwarded) {
      state.classLeague.bonusAwarded = true;
      awardXp(100, "Klassenbonus");
    }
  };
  const evaluateBadges = () => {
    if (Number(state.personalRecords.totalStudySessions || 0) >= 1) unlockBadge("first-step");
    if (Number(state.personalRecords.totalMistakesFixed || 0) >= 10) unlockBadge("mistake-fixer");
    if (Number(state.personalRecords.totalCardsReviewed || 0) >= 100) unlockBadge("card-master");
    if (Number(state.personalRecords.totalStudySessions || 0) >= 5) unlockBadge("focus-mode");
    if (Number(state.weeklyStats.studyTasksAdded || 0) >= 7) unlockBadge("planner-pro");
    if (state.exams.some((exam) => exam.date >= todayIso()) && Number(state.weeklyStats.studySessions || 0) > 0) unlockBadge("exam-ready");
    if (state.subjects.some((subject) => subjectTrend(subject) === "Verbessert")) unlockBadge("comeback-lynx");
  };
  const trackStudyAction = (type, amount = 1) => {
    ensureGamification();
    const count = Math.max(1, Number(amount || 1));
    if (type === "studySession") {
      awardXp(50 * count, "Lerneinheit geschafft");
      state.weeklyStats.studySessions = Number(state.weeklyStats.studySessions || 0) + count;
      state.weeklyLeagueStats.studySessions = Number(state.weeklyLeagueStats.studySessions || 0) + count;
      state.personalRecords.totalStudySessions = Number(state.personalRecords.totalStudySessions || 0) + count;
      addQuestProgress("sessions", count);
    }
    if (type === "cardReviewed") {
      awardXp(10 * count, "Karte gelernt");
      state.weeklyStats.cardsReviewed = Number(state.weeklyStats.cardsReviewed || 0) + count;
      state.weeklyLeagueStats.cardsReviewed = Number(state.weeklyLeagueStats.cardsReviewed || 0) + count;
      state.personalRecords.totalCardsReviewed = Number(state.personalRecords.totalCardsReviewed || 0) + count;
      addQuestProgress("cards", count);
    }
    if (type === "mistakeSaved") {
      awardXp(10 * count, "Fehler gespeichert");
    }
    if (type === "mistakeReviewed") {
      awardXp(20 * count, "Fehler wiederholt");
      state.weeklyStats.mistakesReviewed = Number(state.weeklyStats.mistakesReviewed || 0) + count;
    }
    if (type === "mistakeFixed") {
      awardXp(40 * count, "Fehler behoben");
      state.weeklyStats.mistakesFixed = Number(state.weeklyStats.mistakesFixed || 0) + count;
      state.weeklyLeagueStats.mistakesFixed = Number(state.weeklyLeagueStats.mistakesFixed || 0) + count;
      state.personalRecords.totalMistakesFixed = Number(state.personalRecords.totalMistakesFixed || 0) + count;
      addQuestProgress("mistakes", count);
    }
    if (type === "studyTaskAdded") {
      awardXp(10 * count, "Planung erledigt");
      state.weeklyStats.studyTasksAdded = Number(state.weeklyStats.studyTasksAdded || 0) + count;
    }
    state.weeklyLeagueStats.improved = Math.max(Number(state.weeklyLeagueStats.improved || 0), Math.round(Number(state.xpThisWeek || 0) / 25));
    updatePersonalRecords();
    evaluateBadges();
    checkClassBonus();
  };
  const markMistakeFixed = (mistake) => {
    if (!mistake) return;
    if (!mistake.reviewedAt) {
      mistake.reviewedAt = todayIso();
      trackStudyAction("mistakeReviewed");
    }
    const wasFixed = mistake.reviewStatus === "fixed";
    mistake.reviewStatus = "fixed";
    if (!wasFixed && !mistake.fixedAt) {
      mistake.fixedAt = todayIso();
      trackStudyAction("mistakeFixed");
    }
  };

  const ensureCollections = () => {
    state.user = { ...window.StudyUpSeed.user, ...(state.user || {}) };
    state.user.password = "";
    state.user.authMode = state.user.authMode || "local-demo";
    const savedSettings = state.settings || {};
    state.settings = { ...window.StudyUpSeed.settings, ...savedSettings };
    state.settings.dashboardVisibility = { ...window.StudyUpSeed.settings.dashboardVisibility, ...(savedSettings.dashboardVisibility || {}) };
    state.settings.reminderPreferences = { ...window.StudyUpSeed.settings.reminderPreferences, ...(savedSettings.reminderPreferences || {}) };
    if (!savedSettings.theme || savedSettings.theme === "system") state.settings.theme = "dark";
    state.onboarding = { ...(window.StudyUpSeed.onboarding || {}), ...(state.onboarding || {}) };
    state.onboarding.onboardingStep = Math.max(0, Math.min(6, Number(state.onboarding.onboardingStep || 0)));
    state.onboarding.selectedGoal = state.onboarding.selectedGoal || state.onboarding.goal || "";
    state.onboarding.selectedSubject = state.onboarding.selectedSubject || "";
    state.onboarding.targetDate = state.onboarding.targetDate || "";
    state.onboarding.uploadedNotesText = String(state.onboarding.uploadedNotesText || "");
    state.onboarding.uploadedFileName = state.onboarding.uploadedFileName || "";
    state.onboarding.uploadStatus = state.onboarding.uploadStatus || "";
    state.onboarding.generatedPreview = state.onboarding.generatedPreview && typeof state.onboarding.generatedPreview === "object" ? state.onboarding.generatedPreview : null;
    state.onboarding.temporaryDeck = state.onboarding.temporaryDeck && typeof state.onboarding.temporaryDeck === "object" ? state.onboarding.temporaryDeck : null;
    state.onboarding.guestMode = Boolean(state.onboarding.guestMode);
    state.onboarding.signInSkipped = Boolean(state.onboarding.signInSkipped);
    state.onboarding.firstReviewCompleted = Boolean(state.onboarding.firstReviewCompleted);
    state.onboarding.valueMomentSeen = Boolean(state.onboarding.valueMomentSeen || state.onboarding.generatedPreview || state.onboarding.temporaryDeck);
    state.onboarding.plusTrialOffered = Boolean(state.onboarding.plusTrialOffered);
    state.onboarding.plusTrialStartedAt = state.onboarding.plusTrialStartedAt || "";
    state.onboarding.plusTrialEndsAt = state.onboarding.plusTrialEndsAt || "";
    state.onboarding.plusTrialDismissedAt = state.onboarding.plusTrialDismissedAt || "";
    state.entitlements = {
      clientId: "",
      lastSyncAt: "",
      cached: null,
      ...(state.entitlements || {})
    };
    ensureEntitlementClientId();
    if (!state.entitlements.cached) {
      state.entitlements.cached = normalizeEntitlement({
        plan: "free",
        billingCycle: savedSettings.billingCycle || "annual",
        paidSubscription: false,
        trial: {
          used: Boolean(state.onboarding.plusTrialStartedAt),
          active: false,
          startedAt: state.onboarding.plusTrialStartedAt || "",
          endsAt: state.onboarding.plusTrialEndsAt || ""
        },
        aiCredits: {
          month: savedSettings.aiCreditsMonth || savedSettings.aiQuestionsMonth || monthKey(),
          used: Number(savedSettings.aiCreditsUsed ?? savedSettings.aiQuestionsUsed ?? 0),
          allowance: Number(savedSettings.aiCreditsAllowance || savedSettings.aiLimit || 10)
        }
      });
    }
    updateEntitlementCache(state.entitlements.cached);
    state.settings.billingCycle = state.settings.billingCycle === "monthly" ? "monthly" : "annual";
    if (state.settings.aiQuestionsMonth !== monthKey()) {
      state.settings.aiQuestionsMonth = monthKey();
      state.settings.aiQuestionsUsed = 0;
    }
    state.gradeSystems = state.gradeSystems?.length ? state.gradeSystems : copy(window.StudyUpSeed.gradeSystems);
    state.gradeSystems = state.gradeSystems.map((system) => (
      system.id === "ch" ? { ...system, step: 0.01, example: "5.75" } : system
    ));
    state.languages = state.languages?.length ? state.languages : copy(window.StudyUpSeed.languages);
    state.schoolProfile = normalizeSchoolProfile(state.schoolProfile?.country ? state.schoolProfile : inferSchoolProfile());
    state.settings.gradeSystem = state.schoolProfile.appGradeSystem || state.settings.gradeSystem;
    state.settings.language = state.schoolProfile.language || state.settings.language;
    state.notifications = (state.notifications || []).map((note) => ({
      ...note,
      title: String(note.title || "").replaceAll("StudyUp", "Lynxly"),
      text: String(note.text || "").replaceAll("StudyUp", "Lynxly")
    }));
    state.homework = (state.homework || []).map((item) => normalizeLearningEntity(item, "hw", "dueDate"));
    if (Array.isArray(state.grades) && state.grades.length) {
      const existingSubjects = Array.isArray(state.subjects) ? state.subjects : [];
      state.grades.forEach((oldGrade) => {
        const subjectName = String(oldGrade.subject || oldGrade.name || oldGrade.course || "Allgemein").trim() || "Allgemein";
        let subject = existingSubjects.find((item) => String(item.name || "").toLocaleLowerCase() === subjectName.toLocaleLowerCase());
        if (!subject) {
          subject = {
            id: oldGrade.subjectId || uid("sub"),
            name: subjectName,
            weight: Number(oldGrade.subjectWeight || 1),
            targetGrade: oldGrade.targetGrade || "",
            gradeMode: "weight",
            gradeCategories: defaultGradeCategories(),
            grades: []
          };
          existingSubjects.push(subject);
        }
        subject.grades = Array.isArray(subject.grades) ? subject.grades : [];
        if (!subject.grades.some((entry) => entry.id && entry.id === oldGrade.id)) {
          subject.grades.push(normalizeGradeEntry(oldGrade));
        }
      });
      state.subjects = existingSubjects;
      state.grades = [];
    }
    state.subjects = (state.subjects || []).map((subject) => ({
      weight: 1,
      targetGrade: "",
      nextExamDate: "",
      color: "",
      icon: "",
      relatedDeckIds: [],
      relatedTopics: [],
      gradeMode: "simple",
      gradeCategories: defaultGradeCategories(),
      normalizeCategories: false,
      grades: [],
      ...subject,
      id: subject.id || uid("sub"),
      name: subject.name || subject.subject || "Fach",
      relatedDeckIds: Array.isArray(subject.relatedDeckIds) ? subject.relatedDeckIds : [],
      relatedTopics: Array.isArray(subject.relatedTopics) ? subject.relatedTopics : [],
      gradeMode: ["simple", "weight", "category"].includes(subject.gradeMode) ? subject.gradeMode : "simple",
      gradeCategories: Array.isArray(subject.gradeCategories) && subject.gradeCategories.length
        ? subject.gradeCategories.map((category) => ({
          id: category.id || uid("cat"),
          name: category.name || "Kategorie",
          percentage: Number(category.percentage || 0)
        }))
        : defaultGradeCategories(),
      normalizeCategories: Boolean(subject.normalizeCategories),
      grades: (subject.grades || []).map(normalizeGradeEntry)
    }));
    state.exams = (state.exams || []).map((item) => normalizeLearningEntity(item, "exam"));
    state.planEvents = (state.planEvents || []).map((item) => normalizeLearningEntity(item, "event"));
    state.studyTasks = (state.studyTasks || []).map((item) => normalizeLearningEntity(item, "task"));
    state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, ...(state.todaysFocus || {}) };
    state.mistakes = (state.mistakes || []).map(normalizeMistake);
    state.flashcards = (state.flashcards || []).map((card) => {
      const normalized = normalizeFlashcard(card);
      if (normalized.title === "StudyUp KI") normalized.title = "Lynxly AI";
      return normalized;
    });
    state.mistakeReviewSession = {
      ...defaultMistakeReviewSession(),
      ...(state.mistakeReviewSession || {})
    };
    state.mistakeReviewSession.mistakeIds = Array.isArray(state.mistakeReviewSession.mistakeIds)
      ? state.mistakeReviewSession.mistakeIds.filter((id) => state.mistakes.some((mistake) => mistake.id === id))
      : [];
    state.mistakeReviewSession.reviewedIds = Array.isArray(state.mistakeReviewSession.reviewedIds)
      ? state.mistakeReviewSession.reviewedIds
      : [];
    state.generatedStudySets = Array.isArray(state.generatedStudySets) ? state.generatedStudySets.slice(0, 30) : [];
    state.cardSchedule = state.cardSchedule || {};
    state.streak = { current: 0, weeklySessions: 0, lastStudyDate: "", ...(state.streak || {}) };
    state.cardLibrary = state.cardLibrary?.length ? state.cardLibrary : copy(window.StudyUpSeed.cardLibrary);
    state.cardLibrary = state.cardLibrary.map((pack) => ({
      ...pack,
      author: pack.author === "StudyUp Database" ? "Lynxly Datenbank" : pack.author
    }));
    state.chat = (state.chat || []).map((message) => (
      message.role === "bot" && (String(message.text || "").includes("Unexpected token") || String(message.text || "").includes("Not found"))
        ? { ...message, text: "Diese alte KI-Antwort kam aus einer nicht verbundenen API. Stelle die Frage einfach noch einmal." }
        : { ...message, text: String(message.text || "").replaceAll("StudyUp KI", "Lynxly AI").replaceAll("StudyUp", "Lynxly") }
    ));
    state.ui = { ...window.StudyUpSeed.ui, ...(state.ui || {}) };
    state.ui.notificationCenterOpen = Boolean(state.ui.notificationCenterOpen);
    state.ui.selectedPartialGroup = state.ui.selectedPartialGroup || null;
    state.ui.plannerMonthOffset = Number(state.ui.plannerMonthOffset || 0);
    state.ui.plannerView = state.ui.plannerView === "month" ? "month" : "agenda";
    state.ui.selectedPlannerDate = state.ui.selectedPlannerDate || todayIso();
    state.ui.selectedCardPackId = state.ui.selectedCardPackId || "";
    state.ui.cardStudyIndex = Number(state.ui.cardStudyIndex || 0);
    state.ui.studySessionStep = Number(state.ui.studySessionStep || 0);
    state.ui.studySessionCardIndex = Number(state.ui.studySessionCardIndex || 0);
    state.ui.mistakeFilter = state.ui.mistakeFilter || "open";
    state.ui.settingsTab = state.ui.settingsTab || "profile";
    state.ui.designOpen = Boolean(state.ui.designOpen);
    state.ui.aiOfflineMode = state.ui.aiOfflineMode !== false;
    state.ui.showMistakeForm = Boolean(state.ui.showMistakeForm);
    state.ui.showTargetGradeForm = Boolean(state.ui.showTargetGradeForm);
    state.ui.showPartialEntryForm = Boolean(state.ui.showPartialEntryForm);
    state.ui.showPartialWeightForm = Boolean(state.ui.showPartialWeightForm);
    state.ui.aiAttachMenuOpen = Boolean(state.ui.aiAttachMenuOpen);
    state.ui.aiNotesFileName = state.ui.aiNotesFileName || "";
    state.ui.aiNotesFileType = state.ui.aiNotesFileType || "";
    state.ui.aiNotesFileSize = state.ui.aiNotesFileSize || "";
    state.ui.aiNotesStatus = state.ui.aiNotesStatus || "";
    state.ui.aiNotesPreview = state.ui.aiNotesPreview || "";
    state.ui.aiNotesError = state.ui.aiNotesError || "";
    state.ui.aiNotesDraft = state.ui.aiNotesDraft || "";
    state.ui.aiNotesFocus = Boolean(state.ui.aiNotesFocus);
    state.ui.materialSheetOpen = Boolean(state.ui.materialSheetOpen);
    state.ui.aiGenerationMode = state.ui.aiGenerationMode || "";
    state.ui.aiGenerationLastMode = state.ui.aiGenerationLastMode || "";
    state.ui.aiGenerationSource = state.ui.aiGenerationSource || "";
    state.ui.editingGradeId = state.ui.editingGradeId || "";
    state.ui.targetGradeWeight = state.ui.targetGradeWeight || "1";
    state.ui.targetGradeCategoryId = state.ui.targetGradeCategoryId || "";
    state.ui.whatIfResult = state.ui.whatIfResult || null;
    ensureGamification();
    if (!state.ui.cleanedHundredthsTest) {
      state.subjects.forEach((subject) => {
        subject.grades = subject.grades.filter((grade) => grade.title !== "Hundertstel-Test");
      });
      state.ui.cleanedHundredthsTest = true;
    }
  };

  const currentPlan = () => currentEntitlement().plan || "free";
  const isPlus = () => premiumCore()?.isPlus?.(currentEntitlement()) || ["plus", "exam_pass"].includes(currentPlan());
  const isPro = () => false;
  const plusTrialPromptReady = (summary = {}) => {
    const trialPromptReady = window.LynxlyModules?.studyResults?.trialPromptReady;
    if (trialPromptReady) {
      return trialPromptReady({ plan: currentPlan(), onboarding: state.onboarding, summary });
    }
    return false;
  };
  const startPlusTrial = async () => {
    try {
      const response = await fetch("/api/trial/start", { method: "POST", headers: entitlementHeaders({ "Content-Type": "application/json" }), credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Testphase konnte nicht gestartet werden.");
      updateEntitlementCache(data.entitlement);
      state.onboarding.plusTrialOffered = true;
      state.onboarding.plusTrialStartedAt = data.entitlement?.trial?.startedAt || "";
      state.onboarding.plusTrialEndsAt = data.entitlement?.trial?.endsAt || "";
      pushNotification("Plus-Testphase gestartet", "Du testest Lynxly Plus 7 Tage gratis. Free bleibt vollständig nutzbar.");
      return true;
    } catch (error) {
      pushNotification("Testphase nicht gestartet", error.message || "Diese Testphase wurde bereits genutzt.");
      return false;
    }
  };
  const currentSystem = () => state.gradeSystems.find((system) => system.id === state.settings.gradeSystem) || state.gradeSystems[0];
  const formatDate = (date, options = { day: "2-digit", month: "short" }) => {
    const value = dateObject(date);
    if (Number.isNaN(value.getTime())) return "";
    return new Intl.DateTimeFormat(state.settings.language || currentSystem().language, options).format(value);
  };
  const gradeValue = (grade) => {
    if (grade.type === "partial") {
      return grade.partialGrades?.length ? average(grade.partialGrades) : null;
    }
    const value = Number(grade.value);
    return Number.isFinite(value) ? value : null;
  };
  const gradeValues = (grades) => grades.map(gradeValue).filter((value) => Number.isFinite(value));
  const average = (grades) => {
    const values = gradeValues(grades);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };
  const gradeWeight = (grade) => Math.max(0.01, Number(grade.weight || 1));
  const weightedGradeAverage = (grades) => {
    const weighted = (grades || [])
      .map((grade) => ({ value: gradeValue(grade), weight: gradeWeight(grade) }))
      .filter((grade) => Number.isFinite(grade.value));
    const weightSum = weighted.reduce((sum, grade) => sum + grade.weight, 0);
    return weightSum ? weighted.reduce((sum, grade) => sum + grade.value * grade.weight, 0) / weightSum : null;
  };
  const categoryBreakdown = (subject, gradesOverride = null) => {
    const categories = subject.gradeCategories?.length ? subject.gradeCategories : defaultGradeCategories();
    const grades = gradesOverride || subject.grades || [];
    const totalPercent = categories.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
    const rows = categories.map((category) => {
      const entries = grades.filter((grade) => grade.categoryId === category.id);
      const avg = weightedGradeAverage(entries);
      return {
        ...category,
        grades: entries,
        average: avg,
        contribution: Number.isFinite(avg) ? avg * (Number(category.percentage || 0) / 100) : null
      };
    });
    const filledPercent = rows.filter((row) => Number.isFinite(row.average)).reduce((sum, row) => sum + Number(row.percentage || 0), 0);
    const contributionTotal = rows.reduce((sum, row) => sum + (Number.isFinite(row.contribution) ? row.contribution : 0), 0);
    return { rows, totalPercent, filledPercent, contributionTotal, openPercent: Math.max(0, 100 - filledPercent) };
  };
  const subjectAverage = (subject, gradesOverride = null) => {
    const grades = gradesOverride || subject.grades || [];
    if ((subject.gradeMode || "simple") === "weight") return weightedGradeAverage(grades);
    if (subject.gradeMode === "category") {
      const breakdown = categoryBreakdown(subject, grades);
      const filled = breakdown.rows.filter((row) => Number.isFinite(row.average) && Number(row.percentage || 0) > 0);
      if (!filled.length) return weightedGradeAverage(grades);
      const denominator = subject.normalizeCategories
        ? filled.reduce((sum, row) => sum + Number(row.percentage || 0), 0)
        : 100;
      return denominator ? filled.reduce((sum, row) => sum + row.average * (Number(row.percentage || 0) / denominator), 0) : null;
    }
    return weightedGradeAverage(grades);
  };
  const subjectDisplayAverage = (subject) => subjectAverage(subject);
  const subjectHasGrades = (subject) => Number.isFinite(subjectDisplayAverage(subject));
  const formatSchoolNumber = (value, digits = 1) => {
    if (!Number.isFinite(value)) return "–";
    const text = value.toFixed(digits);
    return isGermanProfile() ? text.replace(".", ",") : text;
  };
  const formatSchoolAverage = (value, options = {}) => {
    if (!Number.isFinite(value)) return "–";
    const profile = schoolProfile();
    const digits = options.digits ?? 1;
    if (profile.gradingSystem === "us_gpa") return `GPA ${formatSchoolNumber(value, digits)}`;
    if (profile.gradingSystem === "uk_general") return formatSchoolNumber(value, digits);
    return `Ø ${formatSchoolNumber(value, digits)}`;
  };
  const gradeEmptyCopy = () => {
    const labels = schoolLabels();
    if (isUniversityProfile()) return { title: labels.noGrades, text: isGermanProfile() ? "Tracke Prüfungen, Credits und Fortschritt." : "Track exams, credits, and progress." };
    if (shouldShowPluspunkte()) return { title: labels.noGrades, text: "Füge deine erste Note hinzu. Lynxly berechnet Schnitt und Pluspunkte." };
    if (isUsProfile()) return { title: labels.noGrades, text: "Track your GPA automatically." };
    return { title: labels.noGrades, text: "Lynxly berechnet deinen Schnitt automatisch." };
  };
  const sortedSubjectsByAverage = () => [...state.subjects].sort((a, b) => {
    const avgA = subjectDisplayAverage(a);
    const avgB = subjectDisplayAverage(b);
    const hasA = Number.isFinite(avgA);
    const hasB = Number.isFinite(avgB);
    if (hasA && hasB) {
      const system = currentSystem();
      const order = system.higherIsBetter ? avgB - avgA : avgA - avgB;
      return order || String(a.name || "").localeCompare(String(b.name || ""), "de");
    }
    if (hasA) return -1;
    if (hasB) return 1;
    return String(a.name || "").localeCompare(String(b.name || ""), "de");
  });

  const weightedAverage = () => {
    const weighted = state.subjects
      .filter(subjectHasGrades)
      .map((subject) => ({ value: subjectDisplayAverage(subject), weight: Number(subject.weight || 1) }));
    const weightSum = weighted.reduce((sum, item) => sum + item.weight, 0);
    return weightSum ? weighted.reduce((sum, item) => sum + item.value * item.weight, 0) / weightSum : null;
  };

  const swissPlusPointsForAverage = (value) => {
    if (!Number.isFinite(value)) return 0;
    if (value < 1.25) return -6;
    if (value < 1.75) return -5;
    if (value < 2.25) return -4;
    if (value < 2.75) return -3;
    if (value < 3.25) return -2;
    if (value < 3.75) return -1;
    if (value < 4.25) return 0;
    if (value < 4.75) return 0.5;
    if (value < 5.25) return 1;
    if (value < 5.75) return 1.5;
    return 2;
  };

  const plusPointsForAverage = (value) => {
    if (!Number.isFinite(value)) return 0;
    if (shouldShowPluspunkte()) return swissPlusPointsForAverage(value);
    const system = currentSystem();
    const delta = system.higherIsBetter ? value - system.pass : system.pass - value;
    return Math.round(delta * 10) / 10;
  };

  const plusPointsFor = (subject) => subjectHasGrades(subject) ? plusPointsForAverage(subjectDisplayAverage(subject)) * Number(subject.weight || 1) : 0;
  const calculatePluspunkte = (subjects = state.subjects, settings = schoolProfile()) => {
    const enabled = settings.country === "CH" && settings.schoolLevel === "gymi" && settings.plusPointsEnabled === true;
    const gradedSubjects = (subjects || []).filter(subjectHasGrades);
    if (!enabled) return { available: false, value: null, subjects: gradedSubjects.length, reason: "Pluspunkte sind nur für Schweizer Gymi-Profile aktiviert." };
    if (!gradedSubjects.length) return { available: true, value: null, subjects: 0, reason: "Füge deine Promotionsfächer hinzu." };
    // Vereinfachte Standard-Regel: Jede gerundete Schweizer Note wird gegen 4.0 verglichen.
    // Schulen/Kantone können andere Promotionsregeln haben; deshalb bleibt diese Logik zentral anpassbar.
    const value = gradedSubjects.reduce((sum, subject) => sum + plusPointsFor(subject), 0);
    return { available: true, value: Math.round(value * 10) / 10, subjects: gradedSubjects.length, reason: "" };
  };
  const plusPointsTotal = () => {
    const result = calculatePluspunkte();
    return Number.isFinite(result.value) ? result.value : null;
  };
  const formatPlusPoints = (value) => {
    if (!Number.isFinite(value)) return "Noch nicht berechenbar";
    const rounded = Math.round(value * 10) / 10;
    const clean = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    const localized = isGermanProfile() ? clean.replace(".", ",") : clean;
    return `${rounded > 0 ? "+" : ""}${localized} P`;
  };
  const topicList = (topics) => Array.isArray(topics) ? topics : String(topics || "").split(",").map((topic) => topic.trim()).filter(Boolean);

  const applySampleData = () => {
    state.user = { loggedIn: true, name: state.user.name || "Beispiel-Schüler", email: state.user.email || "", password: state.user.password || "lynx1234", region: state.user.region || "ch" };
    state.settings.gradeSystem = state.settings.gradeSystem || "ch";
    state.settings.language = state.settings.language || "de-CH";
    state.schoolProfile = normalizeSchoolProfile({
      ...schoolDefaultsFor("CH", "gymi"),
      onboardingCompleted: true
    });
    state.subjects = [
      { id: uid("sub"), name: "Mathe", weight: 1, targetGrade: "5.0", grades: [{ id: uid("grade"), type: "exam", title: "Algebra-Test", date: addDays(todayIso(), -8), value: 4.5 }, { id: uid("grade"), type: "exam", title: "Geometrie-Quiz", date: addDays(todayIso(), -2), value: 5.0 }] },
      { id: uid("sub"), name: "Französisch", weight: 1, targetGrade: "5.0", grades: [{ id: uid("grade"), type: "exam", title: "Unit 1 Vokabeln", date: addDays(todayIso(), -5), value: 4.0 }] },
      { id: uid("sub"), name: "Biologie", weight: 1, targetGrade: "", grades: [{ id: uid("grade"), type: "exam", title: "Zellen", date: addDays(todayIso(), -3), value: 5.5 }] }
    ];
    state.exams = [{ id: uid("exam"), subject: "Mathe", title: "Lineare Funktionen", date: addDays(todayIso(), 6), targetGrade: "5.0", minutesPerDay: 25, topics: ["Steigung", "y-Achsenabschnitt"] }];
    state.homework = [{ id: uid("hw"), subject: "Französisch", title: "Vokabeln Unit 1", description: "10 Wörter wiederholen", dueDate: addDays(todayIso(), 2), priority: "Mittel", status: "Offen" }];
    state.planEvents = [{ id: uid("event"), subject: "Mathe", title: "15 Minuten Gleichungen üben", date: todayIso(), minutes: 15, type: "Üben", auto: false }];
    state.flashcards = [
      { id: uid("card"), subject: "Französisch", title: "Unit 1", question: "bonjour", answer: "hallo / guten Tag", difficulty: 2, reviewCount: 0, source: "private", published: false },
      { id: uid("card"), subject: "Französisch", title: "Unit 1", question: "la famille", answer: "die Familie", difficulty: 1, reviewCount: 0, source: "private", published: false },
      { id: uid("card"), subject: "Biologie", title: "Zellen", question: "Zellkern", answer: "Steuert die Zelle und enthält DNA.", difficulty: 2, reviewCount: 0, source: "private", published: false }
    ];
    state.mistakes = [
      normalizeMistake({ subject: "Mathe", topic: "Klammern", question: "2*(3+4)", userAnswer: "10", correctAnswer: "14", explanation: "Zuerst die Klammer rechnen: 3+4=7, danach 2*7=14.", source: "Beispiel" }),
      normalizeMistake({ subject: "Französisch", topic: "Vokabeln", question: "au revoir", userAnswer: "Hallo", correctAnswer: "auf Wiedersehen", explanation: "Bonjour ist hallo, au revoir ist auf Wiedersehen.", source: "Beispiel" })
    ];
    state.studyTasks = [{ id: uid("task"), subject: "Mathe", title: "Klammerregel wiederholen", date: todayIso(), done: false }];
    state.cardSchedule = {};
    state.streak = { current: 1, weeklySessions: 1, lastStudyDate: todayIso() };
    state.xpTotal = 220;
    state.xpThisWeek = 120;
    state.level = 1;
    state.weeklyStats = { ...defaultWeeklyStats(), xp: 120, cardsReviewed: 3, mistakesFixed: 1, mistakesReviewed: 1, studySessions: 1, studyDays: [todayIso()] };
    state.personalRecords = { ...defaultRecords(), bestWeeklyXp: 120, bestCardsWeek: 3, bestMistakesWeek: 1, bestSessionsWeek: 1, totalCardsReviewed: 3, totalMistakesFixed: 1, totalStudySessions: 1 };
    state.badges = [{ id: "first-step", unlockedAt: todayIso() }];
    state.dailyQuestDate = todayIso();
    state.dailyQuests = makeDailyQuests().map((quest) => quest.id === "sessions" ? { ...quest, progress: 1, completed: true, rewarded: true } : quest);
    state.leaderboardPrivacy = { visible: false, displayName: state.user.name || "Du" };
    state.weeklyLeagueStats = { ...defaultWeeklyLeagueStats(), weeklyXp: 120, cardsReviewed: 3, mistakesFixed: 1, studySessions: 1, improved: 5 };
    state.classLeague = defaultClassLeague();
    state.classLeaguePrivacy = { joined: false, visible: false, displayName: state.user.name || "Du" };
    state.classLeagueDemo = true;
    state.leagueTier = "snow-paw";
    state.classCode = "LYNX-2B";
    state.recentXpEvents = [];
    state.ui.showMistakeForm = false;
    state.ui.cardCreateOpen = false;
    state.ui.studySessionStep = 0;
    state.ui.studySessionCardIndex = 0;
  };

  const applyTheme = () => {
    const system = currentSystem();
    document.title = "Lynxly";
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.dataset.cardStyle = state.settings.cardStyle || "stacked";
    document.documentElement.dataset.reducedMotion = state.settings.reducedAnimations ? "true" : "false";
    document.documentElement.lang = state.settings.language || system.language;
    document.body.classList.toggle("is-locked", !state.user.loggedIn);
    const accent = accentColors[state.settings.accent] || accentColors.blue;
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-soft", `${accent}1A`);
    if (xpWeekCount) xpWeekCount.textContent = String(Number(state.xpThisWeek || 0));
    if (xpPill) {
      xpPill.title = `${Number(state.xpThisWeek || 0)} XP diese Woche`;
      xpPill.setAttribute("aria-label", `${Number(state.xpThisWeek || 0)} XP diese Woche`);
    }
  };

  const getRoute = () => {
    const route = location.hash.replace("#", "");
    if (route === "homework") return "planner";
    return routes.includes(route) ? route : "dashboard";
  };

  const navLabels = () => {
    return isGermanProfile()
      ? { dashboard: "Start", cards: "Lernen", bot: "KI", progress: "Fortschritt", settings: "Profil" }
      : { dashboard: "Home", cards: "Study", bot: "AI", progress: "Progress", settings: "Profile" };
  };
  const applyNavigationLabels = () => {
    const labels = navLabels();
    navLinks.forEach((link) => {
      const route = link.dataset.route;
      const label = labels[route];
      const text = link.querySelector("span:last-child");
      if (!label || !text) return;
      text.textContent = label;
      link.title = label;
      link.setAttribute("aria-label", label);
    });
  };
  const setActiveNav = (route) => {
    applyNavigationLabels();
    const visibleRoute = {
      mistakes: "cards",
      session: "cards",
      grades: "progress",
      planner: "dashboard",
      premium: "settings"
    }[route] || route;
    navLinks.forEach((link) => link.classList.toggle("active", link.dataset.route === visibleRoute));
    materialNavButtons.forEach((button) => button.classList.toggle("active", state.ui.materialSheetOpen || route === "bot"));
  };

  const pushNotification = async (title, text, ask = false) => {
    state.notifications.unshift({ id: uid("note"), title, text, date: todayIso(), read: false });
    state.notifications = state.notifications.slice(0, 12);
    save();
    if (!("Notification" in window)) return;
    const permission = ask && Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission === "granted") new Notification(title, { body: text });
  };

  const requestNotifications = async () => {
    const next = calendarItems().find((item) => item.date >= todayIso());
    const text = next ? `${next.subject}: ${next.title} ist als Nächstes dran.` : "Lynxly kann dir Geräte-Mitteilungen schicken.";
    await pushNotification("Lynxly Erinnerung", text, true);
    render();
  };

  const renderLevelOptions = (country, selected = "") => levelsForCountry(country).map((level) => (
    `<option value="${level.id}" ${level.id === selected ? "selected" : ""}>${C.escapeHtml(level.label)}</option>`
  )).join("");

  const onboardingGoals = [
    { id: "exam", title: "Prüfung vorbereiten", text: "Karten, Quiz und Tagesplan aus deinen Notizen." },
    { id: "grades", title: "Noten verbessern", text: "Fokus auf das Fach, das als Nächstes zählt." },
    { id: "homework", title: "Hausaufgaben verstehen", text: "Fragen klären, ohne nur abzuschreiben." },
    { id: "routine", title: "Lernroutine aufbauen", text: "Jeden Tag ein kleiner klarer Schritt." }
  ];
  const onboardingGoalTitle = (id) => onboardingGoals.find((goal) => goal.id === id)?.title || "Lernen starten";
  const onboardingSubject = () => String(state.onboarding.selectedSubject || "").trim() || "Lernen";
  const onboardingFallbackNotes = () => {
    const subject = onboardingSubject();
    const goal = onboardingGoalTitle(state.onboarding.selectedGoal);
    return [
      `${subject}: wichtige Grundlagen wiederholen.`,
      `Ziel: ${goal}.`,
      `${subject}: Begriffe erklären, Beispiele üben und Fehler notieren.`,
      "Mache zuerst eine kurze Kartenrunde, danach ein Mini-Quiz."
    ].join("\n");
  };
  const buildOnboardingMaterials = () => {
    const notes = String(state.onboarding.uploadedNotesText || "").trim() || onboardingFallbackNotes();
    const subject = onboardingSubject();
    const deckTitle = `${subject} Starter Set`;
    const materials = normalizeGeneratedMaterials(generateStudyMaterials(notes, { subject, deckTitle }), notes, { subject, deckTitle });
    if (!materials.flashcards.length) {
      materials.flashcards = normalizeGeneratedMaterials(generateStudyMaterials(onboardingFallbackNotes(), { subject, deckTitle }), onboardingFallbackNotes(), { subject, deckTitle }).flashcards;
    }
    materials.flashcards = materials.flashcards.slice(0, 10).map((card) => normalizeFlashcard({
      ...card,
      subject,
      title: deckTitle,
      deckId: `deck:${normalizeAnswerText(deckTitle).replace(/\s+/g, "-")}`,
      source: "onboarding"
    }));
    materials.quiz = materials.quiz.slice(0, 8);
    materials.studyPlan = (materials.studyPlan || materials.plan || []).slice(0, 4);
    materials.plan = materials.studyPlan;
    return materials;
  };
  const ensureOnboardingPreview = () => {
    if (!state.onboarding.temporaryDeck?.flashcards?.length) {
      const materials = buildOnboardingMaterials();
      state.onboarding.temporaryDeck = materials;
      state.onboarding.generatedPreview = {
        cards: materials.flashcards.length,
        quiz: materials.quiz.length,
        topics: materials.topics?.length || materials.weakTopics?.length || 0,
        minutes: Math.min(15, Math.max(5, Math.ceil((materials.flashcards.length || 5) * 1.2))),
        subject: materials.subject,
        deckTitle: materials.deckTitle,
        offline: true
      };
      state.onboarding.valueMomentSeen = true;
    }
    return state.onboarding.generatedPreview;
  };
  const renderOnboardingStepDots = (active) => `
    <div class="onboarding-step-dots" aria-label="Onboarding Fortschritt">
      ${[0, 1, 2, 3, 4].map((step) => `<i class="${step <= active ? "active" : ""}"></i>`).join("")}
    </div>
  `;
  const renderOnboardingFrame = (content, step = 0) => `
    <section class="onboarding-screen value-onboarding">
      <div class="onboarding-glow" aria-hidden="true"></div>
      <div class="value-onboarding-shell">
        <header class="value-onboarding-brand">
          <img src="src/assets/lynxly-logo.webp" alt="" width="48" height="48" loading="eager" decoding="async" onerror="this.onerror=null;this.src='src/assets/lynxly-logo.png';" />
          <strong>Lynxly</strong>
        </header>
        ${renderOnboardingStepDots(step)}
        ${content}
      </div>
    </section>
  `;
  const renderOnboarding = (schoolOnly = false) => {
    if (schoolOnly) state.onboarding.onboardingStep = Math.max(0, Number(state.onboarding.onboardingStep || 0));
    const step = Math.max(0, Math.min(5, Number(state.onboarding.onboardingStep || 0)));
    if (step === 1) {
      return renderOnboardingFrame(`
        <form class="value-onboarding-card" id="onboarding-goal-form">
          <span class="onboarding-kicker">1 Minute Setup</span>
          <h1>Was willst du verbessern?</h1>
          <div class="onboarding-choice-grid">
            ${onboardingGoals.map((goal) => `
              <label class="onboarding-choice ${state.onboarding.selectedGoal === goal.id ? "selected" : ""}">
                <input name="selectedGoal" type="radio" value="${goal.id}" ${state.onboarding.selectedGoal === goal.id ? "checked" : ""} />
                <strong>${C.escapeHtml(goal.title)}</strong>
                <small>${C.escapeHtml(goal.text)}</small>
              </label>
            `).join("")}
          </div>
          <button class="primary-button" type="submit">Weiter</button>
        </form>
      `, 1);
    }
    if (step === 2) {
      return renderOnboardingFrame(`
        <form class="value-onboarding-card" id="onboarding-subject-form">
          <span class="onboarding-kicker">${C.escapeHtml(onboardingGoalTitle(state.onboarding.selectedGoal))}</span>
          <h1>Womit starten wir?</h1>
          <label>Fach<input name="selectedSubject" required value="${C.escapeHtml(state.onboarding.selectedSubject || "")}" placeholder="Mathe" /></label>
          <label>Nächste Prüfung <small>optional</small><input name="targetDate" type="date" value="${C.escapeHtml(state.onboarding.targetDate || "")}" /></label>
          <button class="primary-button" type="submit">Weiter</button>
          <button class="text-button onboarding-back" data-step="1" type="button">Zurück</button>
        </form>
      `, 2);
    }
    if (step === 3) {
      return renderOnboardingFrame(`
        <form class="value-onboarding-card notes-onboarding-card" id="onboarding-notes-form">
          <span class="onboarding-kicker">${C.escapeHtml(onboardingSubject())}</span>
          <h1>Lade deine Notizen hoch</h1>
          <p>PDF, Foto, Screenshot oder Text — Lynxly macht daraus Karten, Quiz und einen Tagesplan.</p>
          <label class="onboarding-upload-tile">${C.icon("upload")} Datei auswählen
            <input name="notesFile" type="file" accept=".txt,.md,.pdf,image/*" />
          </label>
          <label>Text einfügen<textarea name="uploadedNotesText" rows="7" placeholder="Füge hier deine Notizen ein...">${C.escapeHtml(state.onboarding.uploadedNotesText || "")}</textarea></label>
          ${state.onboarding.uploadStatus ? `<p class="onboarding-status">${C.escapeHtml(state.onboarding.uploadStatus)}</p>` : ""}
          <div class="onboarding-create-list">
            <span>Study Cards</span><span>Mini-Quiz</span><span>Zusammenfassung</span><span>Tagesplan</span>
          </div>
          <button class="primary-button" type="submit">Preview erstellen</button>
          <button class="secondary-button onboarding-manual-preview" type="button">Manuell starten</button>
        </form>
      `, 3);
    }
    if (step === 4) {
      const preview = ensureOnboardingPreview();
      return renderOnboardingFrame(`
        <section class="value-onboarding-card preview-onboarding-card">
          <span class="onboarding-kicker">Gefunden</span>
          <h1>${C.escapeHtml(preview.subject || onboardingSubject())}</h1>
          <div class="preview-metric-grid">
            <article><strong>${Number(preview.cards || 0)}</strong><span>Study Cards</span></article>
            <article><strong>${Number(preview.quiz || 0)}</strong><span>Quizfragen</span></article>
            <article><strong>${Number(preview.topics || 0)}</strong><span>Fokus-Themen</span></article>
            <article><strong>${Number(preview.minutes || 5)}</strong><span>Minuten Plan</span></article>
          </div>
          <p class="onboarding-status">Demo/Offline Preview: Alles wird lokal vorbereitet. Du kannst es speichern oder ohne Account testen.</p>
          <button class="primary-button onboarding-save-start" type="button">Speichern und erste Runde starten</button>
          <button class="secondary-button onboarding-guest-start" type="button">Ohne Account testen</button>
          <button class="text-button onboarding-back" data-step="3" type="button">Notizen ändern</button>
        </section>
      `, 4);
    }
    if (step === 5) {
      return renderOnboardingFrame(`
        <section class="value-onboarding-card sign-in-value-card">
          <span class="onboarding-kicker">Study Set speichern</span>
          <h1>Deine erste Lernrunde ist bereit.</h1>
          <p>Lynxly hat Karten, Quiz und einen kleinen Plan vorbereitet. Erstelle einen kostenlosen lokalen Demo-Account, damit Karten, Fortschritt, Noten und Pläne in diesem Browser gespeichert bleiben.</p>
          <div class="auth-choice-list">
            <button class="secondary-button onboarding-auth-choice" data-method="apple" type="button">Continue with Apple <small>Demo lokal</small></button>
            <button class="secondary-button onboarding-auth-choice" data-method="google" type="button">Continue with Google <small>Demo lokal</small></button>
            <button class="primary-button onboarding-auth-choice" data-method="email" type="button">Continue with Email <small>Demo lokal</small></button>
          </div>
          <button class="text-button onboarding-guest-start" type="button">Ohne Account testen</button>
        </section>
      `, 4);
    }
    return `
      ${renderOnboardingFrame(`
        <section class="value-onboarding-card promise-card">
          ${C.mascot("mascot-floating")}
          <span class="onboarding-kicker">Lynxly</span>
          <h1>Aus deinen Notizen wird ein Lernplan.</h1>
          <div class="value-pill-grid">
            <span>Study Cards</span>
            <span>Mini-Quiz</span>
            <span>Fehleranalyse</span>
            <span>Noten-Fokus</span>
          </div>
          <button class="primary-button onboarding-start" type="button">Loslegen</button>
          <div class="onboarding-actions compact">
            <button class="secondary-button onboarding-demo" type="button">Demo ansehen</button>
            <button class="text-button onboarding-later" type="button">Später starten</button>
          </div>
        </section>
      `, 0)}
    `;
  };

  const createOnboardingPlannerData = (materials) => {
    const subject = onboardingSubject();
    const targetDate = state.onboarding.targetDate || "";
    if (targetDate && !state.exams.some((exam) => exam.source === "Onboarding" && exam.subject === subject && exam.date === targetDate)) {
      state.exams.unshift({
        id: uid("exam"),
        subject,
        title: `${subject} Prüfung`,
        date: targetDate,
        topics: materials.topics?.slice(0, 4) || [],
        targetGrade: "",
        minutesPerDay: state.settings.dailyGoalMinutes || 5,
        source: "Onboarding"
      });
    }
    if (state.onboarding.selectedGoal === "grades" && !state.subjects.some((item) => normalizeAnswerText(item.name) === normalizeAnswerText(subject))) {
      state.subjects.unshift({
        id: uid("sub"),
        name: subject,
        weight: 1,
        targetGrade: "",
        gradeMode: "simple",
        gradeCategories: defaultGradeCategories(),
        grades: [],
        relatedTopics: materials.topics?.slice(0, 4) || [],
        relatedDeckIds: []
      });
    }
    const planned = (materials.studyPlan || materials.plan || []).slice(0, 3);
    planned.forEach((task, index) => {
      const title = task.title || `${subject}: kurze Wiederholung`;
      if (state.studyTasks.some((item) => item.source === "Onboarding" && item.title === title)) return;
      state.studyTasks.unshift({
        id: task.id || uid("task"),
        subject,
        title,
        topic: task.topic || materials.topics?.[index] || subject,
        date: task.date || addDays(todayIso(), index),
        done: false,
        source: "Onboarding",
        linkedDeckTitle: materials.deckTitle
      });
    });
  };
  const saveOnboardingMaterials = () => {
    const preview = ensureOnboardingPreview();
    const materials = state.onboarding.temporaryDeck || buildOnboardingMaterials();
    saveGeneratedCards(materials);
    createOnboardingPlannerData(materials);
    state.onboarding.generatedPreview = preview;
    state.onboarding.valueMomentSeen = true;
    state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
    return materials;
  };
  const signInOnboardingUser = (mode = "guest") => {
    const subject = onboardingSubject();
    state.user = {
      ...state.user,
      loggedIn: true,
      name: state.user.name || (mode === "guest" ? "Gast" : "Lynxly Nutzer"),
      email: state.user.email || "",
      password: "",
      authMode: mode === "guest" ? "guest-local" : `demo-${mode}`,
      region: state.settings.gradeSystem
    };
    state.onboarding.guestMode = mode === "guest";
    state.onboarding.signInSkipped = mode === "guest";
    state.schoolProfile = normalizeSchoolProfile({ ...schoolProfile(), onboardingCompleted: true });
    state.settings.theme = state.settings.theme || "dark";
    state.settings.dailyGoalMinutes = state.settings.dailyGoalMinutes || 5;
    state.onboarding.completedAt = state.onboarding.completedAt || new Date().toISOString();
    state.onboarding.firstAction = "review";
    if (!state.onboarding.selectedSubject) state.onboarding.selectedSubject = subject;
  };
  const startOnboardingFirstReview = (mode = "guest") => {
    const materials = saveOnboardingMaterials();
    signInOnboardingUser(mode);
    state.onboarding.awaitingFirstReview = true;
    prepareDeckForStudy("personal", { subject: materials.deckTitle });
    startDeckSession("learn");
    state.ui.cardStudyOpen = true;
    location.hash = "#cards";
    save();
    render();
  };

  const bindSchoolLevelSync = (countrySelector, levelSelector) => {
    const countrySelect = document.querySelector(countrySelector);
    const levelSelect = document.querySelector(levelSelector);
    if (!countrySelect || !levelSelect) return;
    countrySelect.addEventListener("change", () => {
      const country = countrySelect.value || "OTHER";
      const selected = defaultLevelForCountry(country);
      levelSelect.innerHTML = renderLevelOptions(country, selected);
      const form = countrySelect.closest("form");
      const gradeSelect = form?.querySelector('select[name="gradingSystem"]');
      const languageStyle = form?.querySelector('select[name="languageStyle"]');
      if (gradeSelect) gradeSelect.value = defaultGradeSystemFor(country);
      if (languageStyle) languageStyle.value = defaultLanguageStyleFor(country);
    });
  };

  const calendarItems = () => [
    ...state.planEvents,
    ...state.exams.map((exam) => ({ id: exam.id, subject: exam.subject, title: exam.title, date: exam.date, time: exam.time || "", minutes: exam.minutesPerDay || 30, type: schoolLabels().examNoun, exam: true, done: Boolean(exam.completed) })),
    ...state.homework.map((task) => ({ id: task.id, subject: task.subject, title: task.title, date: task.dueDate, time: "", minutes: 20, type: schoolLabels().homeworkNoun, homework: true, done: task.status === "Erledigt" }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  const addDays = (iso, days) => {
    const date = dateObject(iso || todayIso());
    date.setDate(date.getDate() + days);
    return toIso(date);
  };
  const openMistakes = () => state.mistakes.filter((mistake) => mistake.reviewStatus !== "fixed");
  const mistakeLabel = (count) => `${count} ${count === 1 ? "offener Fehler" : "offene Fehler"}`;
  const cardScheduleFor = (id) => state.cardSchedule[id] || {};
  const libraryCardsForReview = () => state.cardLibrary.flatMap((pack) => {
    const limit = isPlus() ? pack.cards.length : Math.min(pack.freeCount || pack.cards.length, pack.cards.length);
    return pack.cards.slice(0, limit).map((card, index) => ({
      id: `${pack.id}-${index}`,
      subject: pack.subject,
      title: pack.title,
      packId: pack.id,
      source: "database",
      published: true,
      ...card
    }));
  });
  const allCardsForReview = () => [
    ...state.flashcards,
    ...libraryCardsForReview()
  ].map((card) => ({ ...card, ...cardScheduleFor(card.id) }));
  const cardIsDue = (card) => !card.nextReview || card.nextReview <= todayIso();
  const cardWasDueToday = (card) => cardIsDue(card) || (state.cardXpHistory?.[card.id]?.date === todayIso() && state.cardXpHistory?.[card.id]?.due);
  const cardReviewedToday = (card) => state.cardSchedule?.[card.id]?.lastReviewed === todayIso() || state.cardXpHistory?.[card.id]?.date === todayIso();
  const dueCards = () => allCardsForReview().filter(cardWasDueToday);
  const pendingDueCards = () => allCardsForReview().filter((card) => cardIsDue(card) && !cardReviewedToday(card));
  const rememberCardDueToday = (card, wasDue) => {
    if (!card?.id || !wasDue) return;
    const previous = state.cardXpHistory?.[card.id] || {};
    state.cardXpHistory[card.id] = {
      ...previous,
      date: todayIso(),
      due: true,
      xp: Number(previous.xp || 0)
    };
  };
  const recordCardReviewAction = (count = 1) => {
    ensureGamification();
    const amount = Math.max(1, Number(count || 1));
    state.weeklyStats.cardsReviewed = Number(state.weeklyStats.cardsReviewed || 0) + amount;
    state.weeklyLeagueStats.cardsReviewed = Number(state.weeklyLeagueStats.cardsReviewed || 0) + amount;
    state.personalRecords.totalCardsReviewed = Number(state.personalRecords.totalCardsReviewed || 0) + amount;
    addQuestProgress("cards", amount);
    updatePersonalRecords();
    evaluateBadges();
    checkClassBonus();
  };
  const awardCardReviewXp = (card, wasDue) => {
    if (!card?.id) return 0;
    ensureGamification();
    const today = todayIso();
    const previous = state.cardXpHistory[card.id];
    recordCardReviewAction(1);
    if (previous?.date === today && Number(previous.xp || 0) > 0) return 0;
    const xp = wasDue ? 4 : 1;
    state.cardXpHistory[card.id] = { ...previous, date: today, xp, due: Boolean(previous?.due || wasDue) };
    if (xp > 0) {
      awardXp(xp, "Karte gelernt");
      state.dailyDeckStats.cardXp = Number(state.dailyDeckStats.cardXp || 0) + xp;
    }
    return xp;
  };
  const nextExamOrHomework = () => calendarItems().find((item) => (item.exam || item.homework) && item.date >= todayIso());
  const weakestSubject = () => {
    const risk = gradeRiskSubjects()[0];
    if (risk) {
      return {
        name: risk.subject.name,
        reason: `${formatGradeDelta(risk.gap)} unter deiner Zielnote`,
        href: "#grades",
        type: "grade-risk"
      };
    }
    const system = currentSystem();
    const graded = [...state.subjects].filter(subjectHasGrades).sort((a, b) => {
      const avgA = subjectAverage(a);
      const avgB = subjectAverage(b);
      return system.higherIsBetter ? avgA - avgB : avgB - avgA;
    })[0];
    if (graded) {
      const avg = subjectAverage(graded);
      const reason = shouldShowPluspunkte()
        ? `${formatPlusPoints(plusPointsFor(graded))} und ${formatSchoolAverage(avg)}`
        : formatSchoolAverage(avg);
      return { name: graded.name, reason, href: "#grades" };
    }
    const byMistake = openMistakes().reduce((map, mistake) => {
      map[mistake.subject] = (map[mistake.subject] || 0) + 1;
      return map;
    }, {});
    const subject = Object.entries(byMistake).sort((a, b) => b[1] - a[1])[0];
    return subject ? { name: subject[0], reason: `${subject[1]} offene Fehler`, href: "#mistakes" } : null;
  };
  const studyTasksToday = () => {
    const today = todayIso();
    const manual = state.studyTasks.filter((task) => !task.done && (!task.date || task.date <= today)).map((task) => ({ ...task, href: "#planner", kind: "Lernaufgabe" }));
    const calendar = calendarItems().filter((item) => item.date === today).map((item) => ({ id: item.id, title: item.title, subject: item.subject, href: "#planner", kind: item.type }));
    const cards = pendingDueCards().slice(0, 3).map((card) => ({ id: card.id, title: card.question, subject: card.subject, href: "#cards", kind: "Karte fällig" }));
    const mistakes = openMistakes().slice(0, 3).map((mistake) => ({ id: mistake.id, title: mistake.question, subject: mistake.subject, href: "#mistakes", kind: "Fehler wiederholen" }));
    return [...manual, ...calendar, ...mistakes, ...cards].slice(0, 6);
  };
  const weakTopicStats = () => [...openMistakes().reduce((map, mistake) => {
    const subject = mistake.subject || "Allgemein";
    const topic = mistake.topic || mistake.title || "Grundlagen";
    const key = `${subject} · ${topic}`;
    const current = map.get(key) || { subject, topic, count: 0, mistakeIds: [] };
    current.count += 1;
    current.mistakeIds.push(mistake.id);
    map.set(key, current);
    return map;
  }, new Map()).values()].sort((a, b) => b.count - a.count);
  const deckMasteryScore = (deck) => {
    const cards = deck?.cards || [];
    if (!cards.length) return 0;
    const mastered = cards.filter((card) => ["good", "easy"].includes(state.cardSchedule?.[card.id]?.rating || state.cardReviewStatus?.[card.id])).length;
    return Math.round((mastered / cards.length) * 100);
  };
  const mostRecentAiDeck = () => personalDecks()
    .filter((deck) => deck.cards.some((card) => card.source === "ai"))
    .sort((a, b) => String(b.cards[0]?.createdDate || "").localeCompare(String(a.cards[0]?.createdDate || "")))[0] || null;
  const lowestMasteryDeck = () => personalDecks()
    .filter((deck) => deck.cards.length)
    .sort((a, b) => deckMasteryScore(a) - deckMasteryScore(b))[0] || null;
  const prepareDeckForStudy = (mode, options = {}) => {
    state.ui.cardStudyMode = mode;
    state.ui.cardStudyOpen = true;
    state.ui.cardStudyIndex = 0;
    state.ui.selectedCardPackId = options.packId || "";
    state.ui.selectedCardSubject = options.subject || "";
    state.cardStudySession = { ...defaultCardStudySession(), choosing: false };
  };
  const prioritizedMistakes = (subject = "") => {
    const counts = openMistakes().reduce((map, mistake) => {
      map.set(mistake.topicId, Number(map.get(mistake.topicId) || 0) + 1);
      return map;
    }, new Map());
    return openMistakes()
      .filter((mistake) => !subject || normalizeAnswerText(mistake.subject) === normalizeAnswerText(subject))
      .sort((a, b) => {
        const repeated = Number(counts.get(b.topicId) || 0) - Number(counts.get(a.topicId) || 0);
        if (repeated) return repeated;
        const reviews = Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
        if (reviews) return reviews;
        return String(a.createdDate || "").localeCompare(String(b.createdDate || ""));
      });
  };
  const startMistakeReviewSession = (options = {}) => {
    const focus = prioritizedMistakes(options.subject || "").slice(0, Math.max(1, Number(options.limit || 5)));
    if (!focus.length) return false;
    state.mistakeReviewSession = {
      ...defaultMistakeReviewSession(),
      active: true,
      mistakeIds: focus.map((mistake) => mistake.id),
      reason: options.reason || `${focus[0].subject}: ${focus.length} offene Fehler`,
      startedAt: new Date().toISOString()
    };
    state.ui.studySessionStep = 0;
    location.hash = "#session";
    return true;
  };
  const currentMistakeReview = () => {
    const session = state.mistakeReviewSession || defaultMistakeReviewSession();
    const id = session.mistakeIds?.[Number(session.index || 0)];
    return state.mistakes.find((mistake) => mistake.id === id) || null;
  };
  const recordMistakeReview = (mistake, fixed = false) => {
    const session = state.mistakeReviewSession;
    if (!mistake || session.reviewedIds.includes(mistake.id)) return;
    session.reviewedIds.push(mistake.id);
    session.reviewed = Number(session.reviewed || 0) + 1;
    mistake.reviewCount = Number(mistake.reviewCount || 0) + 1;
    mistake.reviewedAt = todayIso();
    trackStudyAction("mistakeReviewed");
    if (fixed) {
      markMistakeFixed(mistake);
      session.correct = Number(session.correct || 0) + 1;
    } else {
      mistake.reviewStatus = "review";
      mistake.reviewDate = addDays(todayIso(), 1);
    }
  };
  const answerMistakeReview = (answer) => {
    const mistake = currentMistakeReview();
    const session = state.mistakeReviewSession;
    if (!mistake || !session.active || session.phase !== "question") return;
    const correct = answerMatches(answer, mistake.correctAnswer);
    session.answer = String(answer || "").trim();
    session.attempts = Number(session.attempts || 0) + 1;
    session.phase = correct ? "correct" : "retry";
    mistake.attemptCount = Number(mistake.attemptCount || 0) + 1;
    if (correct) recordMistakeReview(mistake, true);
  };
  const revealMistakeExplanation = () => {
    const mistake = currentMistakeReview();
    const session = state.mistakeReviewSession;
    if (!mistake || !session.active) return;
    session.phase = "explanation";
    if (!mistake.aiExplanation) mistake.aiExplanation = mistakeExplanation(mistake, "simple");
    recordMistakeReview(mistake, false);
  };
  const advanceMistakeReview = () => {
    const session = state.mistakeReviewSession;
    if (!session.active) return;
    const nextIndex = Number(session.index || 0) + 1;
    if (nextIndex >= session.mistakeIds.length) {
      session.active = false;
      session.completed = true;
      session.completedAt = new Date().toISOString();
      updateStreak();
      trackStudyAction("studySession");
      awardXp(25, "Fehler-Review abgeschlossen");
      return;
    }
    session.index = nextIndex;
    session.phase = "question";
    session.answer = "";
    session.attempts = 0;
  };
  const startBestStudySession = (options = {}) => {
    const preferredMode = options.mode || "learn";
    if (options.focusType === "grade-risk") {
      const subject = state.subjects.find((item) => normalizeAnswerText(item.name) === normalizeAnswerText(options.subject)) || gradeRiskSubjects()[0]?.subject;
      if (subject && startMistakeReviewSession({
        subject: subject.name,
        limit: options.limit || 3,
        reason: options.reason || `Empfohlen, weil ${subject.name} unter deiner Zielnote liegt.`
      })) {
        return { started: true, reason: "grade-mistakes" };
      }
      const deck = subject
        ? (subjectRelatedDecks(subject)[0] || personalDecks().find((item) => normalizeAnswerText(item.subject || item.title).includes(normalizeAnswerText(subject.name))))
        : null;
      if (deck) {
        prepareDeckForStudy("personal", { subject: deck.title || deck.subject });
        startDeckSession(preferredMode);
        location.hash = "#cards";
        return { started: true, reason: "grade-deck" };
      }
      const title = ensureGradeStudyTask(subject);
      state.ui.selectedPlannerDate = todayIso();
      location.hash = "#planner";
      if (subject) pushNotification("Lernblock geplant", `${title} wurde für heute eingetragen.`);
      return { started: Boolean(subject), reason: "grade-task" };
    }
    const repeatedMistakes = prioritizedMistakes(options.subject || "").filter((mistake, index, items) => (
      items.filter((entry) => entry.topicId === mistake.topicId).length >= 2 || Number(mistake.reviewCount || 0) > 0
    ));
    if ((options.focusType === "mistakes" || (!state.cardStudySession?.active && repeatedMistakes.length)) && startMistakeReviewSession({
      subject: options.subject || repeatedMistakes[0]?.subject || "",
      limit: options.limit || 5,
      reason: options.reason || (repeatedMistakes.length
        ? `Empfohlen, weil ${repeatedMistakes[0].subject} wiederholte Fehler enthält.`
        : "Empfohlen, weil offene Fehler zuerst am meisten bringen.")
    })) {
      return { started: true, reason: "mistakes" };
    }
    if (state.cardStudySession?.active && state.cardStudySession?.cardIds?.length) {
      state.ui.cardStudyOpen = true;
      location.hash = "#cards";
      return { started: true, reason: "active" };
    }
    const last = lastStudySession();
    const due = pendingDueCards();
    if (last?.deckId?.startsWith("personal:")) {
      const title = last.deckId.replace(/^personal:/, "");
      const dueInLast = due.filter((card) => (card.title || card.subject) === title || card.subject === title);
      if (dueInLast.length) {
        prepareDeckForStudy("personal", { subject: title });
        startDeckSession(preferredMode);
        location.hash = "#cards";
        return { started: true, reason: "last-due" };
      }
    }
    if (due.length) {
      prepareDeckForStudy("due");
      startDeckSession("cards");
      location.hash = "#cards";
      return { started: true, reason: "due" };
    }
    if (openMistakes().length && startMistakeReviewSession({
      limit: options.limit || 5,
      reason: "Empfohlen, weil offene Fehler deinen nächsten Lernschritt zeigen."
    })) {
      return { started: true, reason: "mistakes" };
    }
    const aiDeck = mostRecentAiDeck();
    if (aiDeck) {
      prepareDeckForStudy("personal", { subject: aiDeck.title });
      startDeckSession(preferredMode);
      location.hash = "#cards";
      return { started: true, reason: "ai-deck" };
    }
    const weakDeck = lowestMasteryDeck();
    if (weakDeck) {
      prepareDeckForStudy("personal", { subject: weakDeck.title });
      startDeckSession(preferredMode);
      location.hash = "#cards";
      return { started: true, reason: "low-mastery" };
    }
    location.hash = "#bot";
    state.ui.aiNotesFocus = true;
    return { started: false, reason: "upload-notes" };
  };
  const saveMistake = (mistake, options = {}) => {
    state.mistakes.unshift(normalizeMistake(mistake));
    state.mistakes = state.mistakes.slice(0, 200);
    if (options.reward !== false) trackStudyAction("mistakeSaved");
  };
  const mistakeExplanation = (mistake, mode = "full") => {
    const subject = mistake?.subject || "dieses Thema";
    const topic = mistake?.topic || mistake?.question || "die Aufgabe";
    const correct = mistake?.correctAnswer || "die richtige Lösung";
    const wrong = mistake?.userAnswer || "deine Antwort";
    if (mode === "simple") {
      return `Kurz gesagt: Bei ${topic} war der wichtige Punkt noch unsicher. Richtig ist: ${correct}. Vergleiche diesen Schritt direkt mit deiner Antwort: ${wrong}.`;
    }
    if (mode === "example") {
      return `Beispiel zu ${subject}: Nimm eine ähnliche Aufgabe, löse zuerst nur den ersten Schritt und prüfe dann, ob er zur Regel passt. Für diese Karte heißt das: Frage: ${mistake?.question || topic}. Zielantwort: ${correct}.`;
    }
    return `Richtig ist: ${correct}\n\nWarum es falsch war: Deine Antwort "${wrong}" passt noch nicht zum Kern von ${topic}.\n\nEinfach erklärt: Suche zuerst die Regel oder Definition, die zur Frage gehört. Danach vergleichst du Schritt für Schritt mit der richtigen Lösung.\n\nBeispiel: Formuliere die Frage neu und beantworte nur den ersten Teil. Wenn der erste Teil stimmt, wird die ganze Lösung viel leichter.\n\nRetry-Frage: Kannst du ${topic} jetzt mit eigenen Worten erklären?`;
  };
  const explainMistakeAdaptively = async (mistake) => {
    const relatedMistakes = state.mistakes
      .filter((item) => item.id !== mistake.id && item.subject === mistake.subject && (item.topic || "") === (mistake.topic || ""))
      .slice(0, 4)
      .map((item) => `${item.question || item.topic}: ${item.userAnswer || ""} -> ${item.correctAnswer || ""}`);
    const response = await fetch("/api/adaptive-mistake-explanation", {
      method: "POST",
      headers: entitlementHeaders({ "Content-Type": "application/json" }),
      credentials: "same-origin",
      body: JSON.stringify({
        mistake,
        profile: {
          studentLevel: state.schoolProfile?.level || "",
          explanationStyle: state.settings?.preferredExplanationStyle || "einfach, Schritt für Schritt",
          previousMistakes: relatedMistakes
        }
      })
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : {};
    if (data.entitlement) updateEntitlementCache(data.entitlement);
    if (!response.ok) throw apiError(data, response.status);
    return data;
  };
  const makeFlashcardFromMistake = (mistake) => {
    if (!mistake) return null;
    const card = {
      id: uid("card"),
      deckType: "mistake",
      subject: mistake.subject || "Fehlerbank",
      title: `${mistake.subject || "Fehler"} Fehlerkarten`,
      topic: mistake.topic || "Fehler",
      question: mistake.question || "Was war der Fehler?",
      answer: mistake.correctAnswer || mistake.explanation || "Richtige Lösung ergänzen",
      explanation: mistake.explanation || mistakeExplanation(mistake, "simple"),
      difficulty: 3,
      reviewCount: 0,
      source: "mistake",
      published: false,
      linkedMistakeId: mistake.id,
      createdDate: todayIso()
    };
    state.flashcards.unshift(card);
    return card;
  };
  const scheduleMistakeReview = (mistake, days = 2) => {
    if (!mistake) return;
    mistake.reviewStatus = "review";
    mistake.reviewDate = addDays(todayIso(), days);
    mistake.reviewedAt = mistake.reviewedAt || todayIso();
    trackStudyAction("mistakeReviewed");
  };
  const reviewOffsetForRating = (rating) => ({ again: 1, hard: 2, good: 4, easy: 7 })[rating] || 3;
  const scheduleCardReview = (card, rating, options = {}) => {
    const wasDue = cardIsDue(card);
    rememberCardDueToday(card, wasDue);
    state.cardSchedule[card.id] = { rating, nextReview: addDays(todayIso(), reviewOffsetForRating(rating)), lastReviewed: todayIso() };
    state.cardReviewStatus = state.cardReviewStatus || {};
    state.cardReviewStatus[card.id] = rating;
    const ownedCard = state.flashcards.find((item) => item.id === card.id);
    if (ownedCard) ownedCard.reviewCount = Number(ownedCard.reviewCount || 0) + 1;
    if (options.rewardCard) awardCardReviewXp(card, wasDue);
    if (rating === "again" || rating === "hard") {
      saveMistake({
        subject: card.subject,
        topic: card.title || card.subject,
        question: card.question,
        correctAnswer: card.answer,
        userAnswer: rating === "again" ? "Nicht gewusst" : "Unsicher",
        explanation: "Aus Karteikarten-Wiederholung gespeichert.",
        source: "Karten"
      }, { reward: options.mistakeReward === true });
    }
    return { wasDue };
  };
  const updateStreak = () => {
    const today = todayIso();
    if (state.streak.lastStudyDate === today) return;
    const yesterday = addDays(today, -1);
    state.streak.current = state.streak.lastStudyDate === yesterday ? Number(state.streak.current || 0) + 1 : 1;
    state.streak.weeklySessions = Number(state.streak.weeklySessions || 0) + 1;
    state.streak.lastStudyDate = today;
  };
  const requiredNextGrade = (subject, options = {}) => {
    if (!subject?.targetGrade || !subjectHasGrades(subject)) return null;
    const target = Number(subject.targetGrade);
    if (!Number.isFinite(target)) return null;
    const system = currentSystem();
    const min = Number(system.min);
    const max = Number(system.max);
    const weight = Math.max(0.01, Number(options.weight || 1));
    const categoryId = subject.gradeMode === "category" ? (options.categoryId || subject.gradeCategories?.[0]?.id || "") : "";
    const projectedMin = projectSubjectAverage(subject, min, { weight, categoryId });
    const projectedMax = projectSubjectAverage(subject, max, { weight, categoryId });
    if (system.higherIsBetter && projectedMax < target) return null;
    if (!system.higherIsBetter && projectedMin > target) return null;
    if (system.higherIsBetter && projectedMin >= target) return min;
    if (!system.higherIsBetter && projectedMax <= target) return max;
    let low = min;
    let high = max;
    for (let index = 0; index < 42; index += 1) {
      const mid = (low + high) / 2;
      const projected = projectSubjectAverage(subject, mid, { weight, categoryId });
      if (system.higherIsBetter) {
        if (projected >= target) high = mid;
        else low = mid;
      } else if (projected <= target) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return system.higherIsBetter ? high : low;
  };
  const requiredPassingGrade = (subject, options = {}) => {
    if (!subjectHasGrades(subject)) return null;
    const system = currentSystem();
    const pass = Number(system.pass || 4);
    const avg = subjectDisplayAverage(subject);
    if (!Number.isFinite(avg) || !Number.isFinite(pass)) return null;
    const belowPass = system.higherIsBetter ? avg < pass : avg > pass;
    if (!belowPass) return null;
    return requiredNextGrade({ ...subject, targetGrade: pass }, options);
  };
  const subjectTrend = (subject) => {
    const values = gradeValues(subject.grades);
    if (values.length < 2) return "Noch kein Trend";
    const system = currentSystem();
    const delta = values.at(-1) - values.at(-2);
    const improving = system.higherIsBetter ? delta > 0.05 : delta < -0.05;
    const falling = system.higherIsBetter ? delta < -0.05 : delta > 0.05;
    if (improving) return "Verbessert";
    if (falling) return "Fällt";
    return "Stabil";
  };
  const gradeIsValid = (value) => {
    const number = parseNumberInput(value);
    const system = currentSystem();
    return Number.isFinite(number) && number >= Number(system.min) && number <= Number(system.max);
  };
  const gradeRangeText = () => {
    const system = currentSystem();
    return `${formatSchoolAverage(Number(system.min), { digits: 1 })} bis ${formatSchoolAverage(Number(system.max), { digits: 1 })}`;
  };
  const targetAverage = () => {
    const targets = state.subjects
      .map((subject) => ({ value: Number(subject.targetGrade), weight: Number(subject.weight || 1) }))
      .filter((item) => Number.isFinite(item.value));
    const totalWeight = targets.reduce((sum, item) => sum + item.weight, 0);
    if (!totalWeight) return null;
    return targets.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
  };
  const targetGap = (subject) => {
    const avg = subjectDisplayAverage(subject);
    const target = Number(subject.targetGrade);
    if (!Number.isFinite(avg) || !Number.isFinite(target)) return null;
    const system = currentSystem();
    return system.higherIsBetter ? target - avg : avg - target;
  };
  const formatGradeDelta = (value) => String(Number(Math.abs(Number(value || 0)).toFixed(2))).replace(".", ",");
  const isBelowTarget = (subject) => {
    const gap = targetGap(subject);
    return Number.isFinite(gap) && gap > 0.004;
  };
  const gradeRiskSubjects = () => state.subjects
    .filter((subject) => subjectHasGrades(subject) && Number.isFinite(Number(subject.targetGrade)) && isBelowTarget(subject))
    .map((subject) => ({
      subject,
      average: subjectDisplayAverage(subject),
      target: Number(subject.targetGrade),
      gap: targetGap(subject),
      trend: subjectTrend(subject)
    }))
    .sort((a, b) => Number(b.gap || 0) - Number(a.gap || 0));
  const gradeInsights = () => {
    const graded = state.subjects.filter(subjectHasGrades);
    const system = currentSystem();
    const overall = weightedAverage();
    const target = targetAverage();
    const risks = gradeRiskSubjects();
    const sorted = [...graded].sort((a, b) => {
      const avgA = subjectDisplayAverage(a);
      const avgB = subjectDisplayAverage(b);
      return system.higherIsBetter ? avgB - avgA : avgA - avgB;
    });
    return {
      overall,
      target,
      totalSubjects: state.subjects.length,
      totalGrades: state.subjects.reduce((sum, subject) => sum + (subject.grades || []).length, 0),
      belowTarget: risks,
      belowTargetCount: risks.length,
      nextSubject: risks[0]?.subject || sorted.at(-1) || null,
      bestSubject: sorted[0] || null,
      weakestSubject: sorted.at(-1) || null
    };
  };
  const subjectRelatedDecks = (subject) => {
    if (!subject) return [];
    const wanted = new Set((subject.relatedDeckIds || []).filter(Boolean));
    const subjectName = normalizeAnswerText(subject.name);
    return personalDecks().filter((deck) => (
      wanted.has(deck.id)
      || normalizeAnswerText(deck.title).includes(subjectName)
      || normalizeAnswerText(deck.subject).includes(subjectName)
    ));
  };
  const gradeStudyTaskTitle = (subject) => {
    const topic = subject?.relatedTopics?.find(Boolean);
    return topic ? `${topic} üben` : `${subject?.name || "Fach"} gezielt üben`;
  };
  const ensureGradeStudyTask = (subject) => {
    if (!subject) return null;
    const title = gradeStudyTaskTitle(subject);
    const exists = state.studyTasks.some((task) => !task.done && task.date === todayIso() && task.subject === subject.name && task.title === title);
    if (!exists) {
      state.studyTasks.unshift({
        id: uid("task"),
        subject: subject.name,
        title,
        date: todayIso(),
        done: false,
        source: "grades",
        gradeGoal: subject.targetGrade ? `Zielnote ${formatSchoolAverage(Number(subject.targetGrade), { digits: 2 })}` : ""
      });
      trackStudyAction("studyTaskAdded");
    }
    return title;
  };
  const gradeAdviceMarkdown = (subject, action = "next") => {
    if (!subject) return "## Empfehlung\n\nTrage zuerst ein Fach ein, damit Lynxly dir helfen kann.";
    const avg = subjectDisplayAverage(subject);
    const target = Number(subject.targetGrade);
    const needed = requiredNextGrade(subject, { weight: 1, categoryId: subject.gradeMode === "category" ? subject.gradeCategories?.[0]?.id || "" : "" });
    const passNeeded = requiredPassingGrade(subject, { weight: 1, categoryId: subject.gradeMode === "category" ? subject.gradeCategories?.[0]?.id || "" : "" });
    const decks = subjectRelatedDecks(subject);
    const topics = subject.relatedTopics?.length ? subject.relatedTopics.join(", ") : "Grundlagen und aktuelle Fehler";
    const targetLine = Number.isFinite(target) ? `Zielnote: **${formatSchoolAverage(target, { digits: 2 })}**` : "Setze eine Zielnote, damit die Empfehlung genauer wird.";
    const neededLine = Number.isFinite(needed)
      ? `Für dein Ziel brauchst du in der nächsten Prüfung ungefähr **${formatSchoolAverage(needed, { digits: 2 })}**.`
      : Number.isFinite(passNeeded)
        ? `Zum Bestehen brauchst du in der nächsten Prüfung ungefähr **${formatSchoolAverage(passNeeded, { digits: 2 })}**.`
      : (Number.isFinite(target) && subjectHasGrades(subject) ? "Mit einer einzigen nächsten Note ist dieses Ziel wahrscheinlich nicht erreichbar." : "Sobald du Zielnote und Noten hast, berechnet Lynxly die nächste nötige Note.");
    const planTitle = action === "plan" ? "Lernplan" : action === "quiz" ? "Quiz-Fokus" : "Nächster Lernschritt";
    return `## ${planTitle}\n\n**${subject.name}** liegt aktuell bei **${avg === null ? "–" : formatSchoolAverage(avg, { digits: 2 })}**. ${targetLine}\n\n${neededLine}\n\n### Empfohlen\n\n1. Wiederhole 10 Minuten: ${topics}.\n2. Bearbeite ${openMistakes().filter((mistake) => mistake.subject === subject.name).length || 1} Fehler oder Beispielaufgaben.\n3. ${decks.length ? `Starte den Stapel **${decks[0].title}**.` : "Erstelle 5 Study Cards aus deinen Notizen."}\n\n### Warum?\n\nNoten unter Ziel werden höher priorisiert, damit du vor Prüfungen früher reagieren kannst.`;
  };

  const nextFocus = () => calendarItems().find((item) => item.date >= todayIso());
  const recommendation = () => {
    const subjectWithoutGrade = state.subjects.find((subject) => !subjectHasGrades(subject));
    if (subjectWithoutGrade) return { title: `${subjectWithoutGrade.name}: erste Note eintragen`, href: "#grades" };
    const weakSubject = [...state.subjects].filter(subjectHasGrades).sort((a, b) => plusPointsFor(a) - plusPointsFor(b))[0];
    if (weakSubject) return { title: `${weakSubject.name} gezielt üben`, href: "#grades" };
    const due = calendarItems().find((item) => item.date >= todayIso());
    if (due) return { title: `${due.subject}: ${due.title}`, href: "#planner" };
    return { title: "Ersten Lerntermin planen", href: "#planner" };
  };

  const smartRecommendation = () => {
    const weak = weakestSubject();
    if (openMistakes().length) return { title: `${openMistakes().length} Fehler gezielt reparieren`, href: "#mistakes" };
    if (pendingDueCards().length) return { title: `${pendingDueCards().length} Karte(n) heute wiederholen`, href: "#cards" };
    if (weak) return { title: `${weak.name} gezielt üben`, href: weak.href };
    const due = nextFocus();
    if (due) return { title: `${due.subject}: ${due.title}`, href: "#planner" };
    return { title: "Ersten Lerntermin planen", href: "#planner" };
  };

  const smartCoachSentence = () => {
    const mistakeCounts = openMistakes().reduce((counts, mistake) => {
      counts[mistake.subject] = (counts[mistake.subject] || 0) + 1;
      return counts;
    }, {});
    const mistakeFocus = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];
    if (mistakeFocus) {
      return `Heute solltest du 15 Minuten ${mistakeFocus[0]} machen, weil du dort ${mistakeLabel(mistakeFocus[1])} hast.`;
    }
    const dueBySubject = pendingDueCards().reduce((counts, card) => {
      counts[card.subject] = (counts[card.subject] || 0) + 1;
      return counts;
    }, {});
    const cardFocus = Object.entries(dueBySubject).sort((a, b) => b[1] - a[1])[0];
    if (cardFocus) {
      return `Heute sind ${cardFocus[1]} Karten in ${cardFocus[0]} fällig. Starte eine kurze Wiederholung.`;
    }
    const weak = weakestSubject();
    if (weak) return `Dein nächster sinnvoller Fokus ist ${weak.name}, weil Lynxly dort den größten Übungsbedarf sieht.`;
    const next = nextExamOrHomework();
    if (next) return `Bereite dich heute kurz auf ${next.subject} vor: ${next.title} ist am ${formatDate(next.date)} dran.`;
    return "Starte mit einem Fach, einer Karte oder einem Fehler. Lynxly baut daraus deinen Lerncoach.";
  };
  const questPercent = (quest) => Math.min(100, Math.round((Number(quest.progress || 0) / Math.max(1, Number(quest.target || 1))) * 100));
  const renderDailyQuestsCard = () => `
    <article class="daily-quests-card focus-card">
      <div class="quest-card-head">
        <div><span>Tagesquests</span><h2>Heute ruhig Punkte sammeln</h2></div>
        <strong>+100 XP</strong>
      </div>
      <div class="quest-list">
        ${state.dailyQuests.map((quest) => `
          <a class="quest-row ${quest.completed ? "completed" : ""}" href="${quest.href}">
            <div>
              <strong>${C.escapeHtml(quest.title)}</strong>
              <small>${Math.min(Number(quest.progress || 0), Number(quest.target || 1))} / ${quest.target}</small>
            </div>
            ${progressBar(Math.min(Number(quest.progress || 0), Number(quest.target || 1)), quest.target, `Tagesquest ${quest.title}`, "quest-progress")}
          </a>
        `).join("")}
      </div>
    </article>
  `;
  const renderProgressTeaser = () => {
    const progress = levelProgress();
    const currentTier = tierById(state.leagueTier);
    return `
      <a class="progress-teaser-card focus-card" href="#progress">
        <div class="mascot-card-head">${C.mascot("mascot-small")}<div><span>Fortschritt</span><h2>${leagueSymbol(currentTier.id)}</h2></div></div>
        <p>${progress.next ? `${progress.remaining} XP bis ${C.escapeHtml(progress.next.title)}` : "Höchstes Ziel erreicht"} · ${state.xpThisWeek} XP diese Woche</p>
        ${progressBar(Number(state.xpTotal || 0) - progress.current.min, progress.end - progress.current.min, `Fortschritt bis ${progress.next ? progress.next.title : currentTier.name}`)}
        <em>Fortschritt öffnen</em>
      </a>
    `;
  };

  const renderDashboard = () => {
    const next = nextFocus();
    const tip = recommendation();
    const avg = weightedAverage();
    const points = calculatePluspunkte();
    const labels = schoolLabels();
    return `
      <section class="home-page">
        <h1>Home</h1>
        <div class="home-metric-row">
          <article><span>${C.escapeHtml(labels.gradeMetric)}</span><strong>${avg === null ? "–" : C.escapeHtml(formatSchoolAverage(avg, { digits: 2 }))}</strong></article>
          ${shouldShowPluspunkte() ? `<article><span>${C.escapeHtml(labels.pointsTitle)}</span><strong>${formatPlusPoints(points.value)}</strong></article>` : ""}
        </div>
        <div class="home-vertical-stack">
          <article class="focus-card latest-card"><span>Aktuell</span><h2>${next ? C.escapeHtml(next.title) : "Noch nichts eingetragen"}</h2><p>${next ? `${C.escapeHtml(next.subject)} · ${formatDate(next.date)} · ${C.escapeHtml(next.type)}` : "Sobald du im Kalender etwas einträgst, erscheint es hier."}</p><a class="primary-button" href="#planner">Kalender öffnen</a></article>
          <article class="focus-card recommendation-card"><span>Empfohlen</span><h2>${C.escapeHtml(tip.title)}</h2><a class="secondary-button" href="${tip.href}">Öffnen</a></article>
        </div>
      </section>
    `;
  };

  const dayDelta = (iso) => {
    if (!iso) return Number.POSITIVE_INFINITY;
    const start = dateObject(todayIso());
    const target = dateObject(iso);
    start.setHours(12, 0, 0, 0);
    target.setHours(12, 0, 0, 0);
    return Math.round((target - start) / 86400000);
  };
  const relativeDayLabel = (iso) => {
    const delta = dayDelta(iso);
    const english = !isGermanProfile();
    if (delta < 0) return english ? (delta === -1 ? "Overdue since yesterday" : `${Math.abs(delta)} days overdue`) : (delta === -1 ? "Seit gestern überfällig" : `Seit ${Math.abs(delta)} Tagen überfällig`);
    if (delta === 0) return english ? "Today" : "Heute";
    if (delta === 1) return english ? "Tomorrow" : "Morgen";
    return english ? `In ${delta} days` : `In ${delta} Tagen`;
  };
  const lowerFirst = (value) => `${String(value || "").slice(0, 1).toLocaleLowerCase()}${String(value || "").slice(1)}`;
  const cleanDisplayText = (value) => String(value ?? "")
    .replaceAll("Franz?sisch", "Französisch")
    .replaceAll("franz?sisch", "französisch")
    .replaceAll("Pr?fung", "Prüfung")
    .replaceAll("pr?fung", "prüfung")
    .replaceAll("f?llig", "fällig")
    .replaceAll("F?llig", "Fällig")
    .replaceAll("N?chste", "Nächste")
    .replaceAll("n?chste", "nächste");
  const compactLabel = (value, maxLength = 48) => {
    const text = cleanDisplayText(value).trim();
    return text.length > maxLength ? `${text.slice(0, Math.max(1, maxLength - 1)).trim()}…` : text;
  };
  const reminderFocusReason = (reminder) => {
    if (!isGermanProfile()) {
      return reminder.urgency === "overdue"
        ? `${reminder.typeLabel} is still open.`
        : `Recommended because your ${lowerFirst(reminder.typeLabel)} is ${lowerFirst(reminder.relative)}.`;
    }
    return reminder.urgency === "overdue"
      ? `${reminder.typeLabel} ist noch offen.`
      : `Empfohlen wegen ${lowerFirst(reminder.typeLabel)} ${lowerFirst(reminder.relative)}.`;
  };
  const getImportantReminder = (userData = state) => {
    const preferences = userData.settings?.reminderPreferences || state.settings.reminderPreferences;
    if (preferences?.showOnHome === false) return null;
    const today = todayIso();
    const openHomework = (userData.homework || []).filter((item) => item.status !== "Erledigt");
    const openTasks = (userData.studyTasks || []).filter((item) => !item.done);
    const overdue = preferences?.showOverdue === false ? [] : [
      ...openHomework.filter((item) => item.dueDate && item.dueDate < today).map((item) => ({ ...item, date: item.dueDate, kind: "homework" })),
      ...openTasks.filter((item) => item.date && item.date < today).map((item) => ({ ...item, kind: "task" }))
    ].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const exams = [...(userData.exams || [])].filter((item) => dayDelta(item.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const assignments = openHomework.filter((item) => dayDelta(item.dueDate) >= 0).map((item) => ({ ...item, date: item.dueDate })).sort((a, b) => a.date.localeCompare(b.date));
    const studyEvents = [...(userData.planEvents || [])].filter((item) => dayDelta(item.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    let item = overdue[0];
    let kind = item?.kind || "";
    let urgency = item ? "overdue" : "";
    if (!item) {
      item = exams.find((entry) => dayDelta(entry.date) <= 1);
      kind = item ? "exam" : "";
      urgency = item ? "soon" : "";
    }
    if (!item) {
      item = assignments.find((entry) => dayDelta(entry.date) <= 1);
      kind = item ? "homework" : "";
      urgency = item ? "soon" : "";
    }
    if (!item) {
      item = [
        ...exams.filter((entry) => dayDelta(entry.date) <= Number(preferences?.testDays || 3)).map((entry) => ({ ...entry, kind: "exam" })),
        ...assignments.filter((entry) => dayDelta(entry.date) <= Number(preferences?.assignmentDays || 3)).map((entry) => ({ ...entry, kind: "homework" }))
      ]
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      kind = item?.kind || "";
      urgency = item ? "upcoming" : "";
    }
    if (!item) {
      item = studyEvents[0];
      kind = item ? "study" : "";
      urgency = item ? "planned" : "";
    }
    if (!item) return null;
    const labels = schoolLabels();
    const typeLabels = isGermanProfile()
      ? { exam: labels.examNoun, homework: "Abgabe", task: "Aufgabe", study: "Lerntermin" }
      : { exam: labels.examNoun, homework: labels.homeworkNoun, task: "task", study: "study session" };
    const actionLabels = isGermanProfile()
      ? { exam: `${labels.examNoun} ansehen`, homework: "Aufgabe ansehen", task: "Aufgabe öffnen", study: "Plan öffnen" }
      : { exam: "View test", homework: "View assignment", task: "Open task", study: "Open plan" };
    const iconNames = { exam: "book", homework: "check", task: "target", study: "calendar" };
    const upcomingCount = [...exams, ...assignments, ...studyEvents].filter((entry) => entry.id !== item.id).length;
    return {
      id: item.id || "reminder",
      kind,
      urgency,
      icon: iconNames[kind] || "calendar",
      typeLabel: typeLabels[kind] || (isGermanProfile() ? "Termin" : "appointment"),
      actionLabel: actionLabels[kind] || (isGermanProfile() ? "Plan öffnen" : "Open plan"),
      subject: item.subject || (isGermanProfile() ? "Allgemein" : "General"),
      title: item.title || (isGermanProfile() ? "Nächster Termin" : "Next appointment"),
      date: item.date,
      time: item.time || "",
      topic: Array.isArray(item.topics) ? item.topics[0] : "",
      linkedDeckId: item.linkedDeckId || "",
      linkedMistakeIds: item.linkedMistakeIds || [],
      relative: relativeDayLabel(item.date),
      upcomingCount,
      href: "#planner"
    };
  };
  const dailyFocusLimit = () => Math.max(2, Math.min(60, Number(state.settings.dailyGoalMinutes || 5)));
  const focusTargetFor = (kind, available) => {
    const size = state.settings.focusSize || "short";
    const targets = {
      tiny: { cards: 3, mistakes: 1 },
      short: { cards: 5, mistakes: 3 },
      full: { cards: 10, mistakes: 5 }
    };
    return Math.max(1, Math.min(Number(available || 1), Number(targets[size]?.[kind] || targets.short[kind] || 1)));
  };
  const focusMinutesFor = (suggested) => Math.max(2, Math.min(Number(suggested || 5), dailyFocusLimit()));
  const createTodaysFocus = (reminder) => {
    const labels = schoolLabels();
    const subject = reminder?.subject || "";
    const sameSubject = (value) => subject && String(value || "").toLocaleLowerCase() === subject.toLocaleLowerCase();
    const linkedMistakeIds = new Set(reminder?.linkedMistakeIds || []);
    const relatedMistakes = openMistakes().filter((item) => linkedMistakeIds.has(item.id) || sameSubject(item.subject));
    const relatedCards = pendingDueCards().filter((item) => item.title === reminder?.linkedDeckId || sameSubject(item.subject));
    const allMistakes = openMistakes();
    const allCards = pendingDueCards();
    const topic = reminder?.topic || relatedMistakes[0]?.topic || relatedCards[0]?.title || subject;
    const baseline = {
      cardsReviewed: Number(state.weeklyStats.cardsReviewed || 0),
      mistakesFixed: Number(state.weeklyStats.mistakesFixed || 0),
      studySessions: Number(state.weeklyStats.studySessions || 0),
      studyTasksAdded: Number(state.weeklyStats.studyTasksAdded || 0),
      subjects: Number(state.subjects.length || 0)
    };
    const overdueCards = allCards.filter((card) => card.nextReview && card.nextReview < todayIso());
    if (overdueCards.length) {
      const target = focusTargetFor("cards", overdueCards.length);
      const focusSubject = overdueCards[0].subject || overdueCards[0].title || "Study Cards";
      return {
        type: "cards",
        subject: focusSubject,
        title: `${compactLabel(focusSubject, 22)} wiederholen`,
        description: `${target} überfällige ${target === 1 ? "Karte" : "Karten"} · ca. ${focusMinutesFor(Math.max(3, target))} Min.`,
        related: overdueCards[0].title || "Fällige Wiederholung",
        reason: `Lynxly hat diese Session gewählt, weil ${overdueCards.length} ${overdueCards.length === 1 ? "Karte" : "Karten"} überfällig ${overdueCards.length === 1 ? "ist" : "sind"}.`,
        minutes: focusMinutesFor(Math.max(3, target)),
        target,
        baseline
      };
    }
    const dueMistakes = allMistakes.filter((mistake) => !mistake.reviewDate || mistake.reviewDate <= todayIso());
    if (dueMistakes.length) {
      const target = focusTargetFor("mistakes", dueMistakes.length);
      const focusSubject = dueMistakes[0].subject || "Fehlerbank";
      return {
        type: "mistakes",
        subject: focusSubject,
        title: `${compactLabel(focusSubject, 22)} Fehler`,
        description: `${target} ${target === 1 ? "Fehler" : "Fehler"} erneut versuchen · ca. ${focusMinutesFor(Math.max(3, target * 2))} Min.`,
        related: dueMistakes[0].topic || "Fehler wiederholen",
        reason: `Lynxly hat diese Session gewählt, weil ${dueMistakes.length} ${dueMistakes.length === 1 ? "Fehler" : "Fehler"} wiederholt werden ${dueMistakes.length === 1 ? "sollte" : "sollten"}.`,
        minutes: focusMinutesFor(Math.max(3, target * 2)),
        target,
        baseline
      };
    }
    if (reminder && relatedCards.length) {
      const target = focusTargetFor("cards", relatedCards.length);
      return {
        type: "cards",
        subject,
        title: isGermanProfile() ? `${compactLabel(subject || "Karten", 18)} vorbereiten` : `Prepare for ${compactLabel(subject || "class", 18)}`,
        description: isGermanProfile() ? `Wiederhole ${target} passende Study Cards.` : `Review ${target} weak study cards before your ${labels.testNoun}.`,
        related: reminder.title,
        reason: reminderFocusReason(reminder),
        minutes: focusMinutesFor(Math.max(3, target)),
        target,
        baseline
      };
    }
    if (reminder && relatedMistakes.length) {
      const target = focusTargetFor("mistakes", relatedMistakes.length);
      return { type: "mistakes", subject, title: "Fehler verbessern", description: `Korrigiere ${target} aktuelle Fehler.`, related: reminder.title, reason: reminderFocusReason(reminder), minutes: focusMinutesFor(Math.max(3, target * 2)), target, baseline };
    }
    if (reminder) {
      return {
        type: "session",
        subject,
        title: isGermanProfile() ? `${compactLabel(subject || labels.examNoun, 18)} vorbereiten` : `Prepare for ${compactLabel(subject || labels.testNoun, 18)}`,
        description: isGermanProfile() ? `Übe ein kleines Thema für ${compactLabel(reminder.title, 34)}.` : `Practice one small topic for ${compactLabel(reminder.title, 34)}.`,
        related: `${subject} · ${reminder.typeLabel}`,
        reason: reminderFocusReason(reminder),
        minutes: focusMinutesFor(8),
        target: 1,
        baseline
      };
    }
    const onboardingIsReady = Boolean(state.schoolProfile?.onboardingCompleted && state.onboarding.valueMomentSeen);
    const onboardingDeck = state.onboarding.temporaryDeck || {};
    const onboardingDeckCards = Number(onboardingDeck.flashcards?.length || state.onboarding.generatedPreview?.cards || 0);
    const onboardingSubjectName = state.onboarding.selectedSubject || onboardingDeck.subject || state.onboarding.generatedPreview?.subject || "";
    if (onboardingIsReady && onboardingDeckCards > 0) {
      const target = focusTargetFor("cards", onboardingDeckCards);
      const deckName = onboardingDeck.deckTitle || state.onboarding.generatedPreview?.deckTitle || `${onboardingSubjectName || "Study"} Starter Set`;
      return {
        type: "cards",
        subject: onboardingSubjectName || deckName,
        title: `${compactLabel(onboardingSubjectName || deckName, 18)}: Karten vorbereitet`,
        description: `Starte die nächste Runde mit ${target} Study Cards.`,
        related: deckName,
        reason: "Aus deinen Startnotizen erstellt.",
        minutes: focusMinutesFor(Math.max(3, target)),
        target,
        baseline
      };
    }
    if (onboardingIsReady && state.onboarding.selectedGoal === "grades") {
      const subjectForGrades = onboardingSubjectName || "dein Fach";
      return {
        type: "grades",
        subject: subjectForGrades,
        title: `${compactLabel(subjectForGrades, 18)} ist dein Fokus`,
        description: "Trage deine erste Note ein oder starte eine kurze Übung.",
        related: "Noten verbessern",
        reason: "Aus deinem Startziel übernommen.",
        minutes: focusMinutesFor(2),
        target: 1,
        baseline
      };
    }
    if (onboardingIsReady && state.onboarding.selectedGoal === "homework") {
      const subjectForHomework = onboardingSubjectName || "Hausaufgaben";
      return {
        type: "session",
        subject: subjectForHomework,
        title: `${compactLabel(subjectForHomework, 18)} verstehen`,
        description: "Stelle dem Coach eine Frage oder plane einen kleinen Schritt.",
        related: "Hausaufgaben verstehen",
        reason: "Aus deinem Startziel übernommen.",
        minutes: focusMinutesFor(5),
        target: 1,
        baseline
      };
    }
    if (onboardingIsReady && state.onboarding.selectedGoal === "routine") {
      return {
        type: "planner",
        subject: onboardingSubjectName || "Routine",
        title: "Eine kleine Lernroutine starten",
        description: "Lege einen kurzen Lernschritt für heute fest.",
        related: "Lernroutine",
        reason: "Aus deinem Startziel übernommen.",
        minutes: focusMinutesFor(3),
        target: 1,
        baseline
      };
    }
    const gradeRisk = gradeRiskSubjects()[0];
    if (gradeRisk) {
      const gap = formatGradeDelta(gradeRisk.gap);
      const topic = gradeRisk.subject.relatedTopics?.find(Boolean) || gradeRisk.subject.name;
      return {
        type: "grade-risk",
        subject: gradeRisk.subject.name,
        title: `${compactLabel(gradeRisk.subject.name, 18)} stärken`,
        description: `Übe kurz ${compactLabel(topic, 34)}.`,
        related: "Noten",
        reason: `Empfohlen, weil ${gradeRisk.subject.name} ${gap} unter deiner Zielnote liegt.`,
        minutes: focusMinutesFor(8),
        target: 1,
        baseline
      };
    }
    const prefersMistakes = state.settings.preferredDailyAction === "mistakes";
    if (prefersMistakes && allMistakes.length) {
      const target = focusTargetFor("mistakes", allMistakes.length);
      const focusSubject = allMistakes[0].subject || "deinem Lernstoff";
      return { type: "mistakes", subject: focusSubject, title: "Fehler verbessern", description: `Korrigiere ${target} aktuelle Fehler.`, related: "Fehlerbank", reason: "Passt zu deiner bevorzugten täglichen Aktion.", minutes: focusMinutesFor(Math.max(3, target * 2)), target, baseline };
    }
    if (allCards.length) {
      const target = focusTargetFor("cards", allCards.length);
      const focusSubject = allCards[0].subject || "deinem Stapel";
      return { type: "cards", subject: focusSubject, title: "Study Cards", description: isGermanProfile() ? `Wiederhole ${target} fällige Karte${target === 1 ? "" : "n"}.` : `Review ${target} due card${target === 1 ? "" : "s"}.`, related: focusSubject, reason: isGermanProfile() ? "Kurze Wiederholungen halten Wissen frisch." : "Short reviews keep knowledge fresh.", minutes: focusMinutesFor(Math.max(3, target)), target, baseline };
    }
    if (allMistakes.length) {
      const target = focusTargetFor("mistakes", allMistakes.length);
      const focusSubject = allMistakes[0].subject || "deinem Lernstoff";
      return { type: "mistakes", subject: focusSubject, title: "Fehler verbessern", description: `Korrigiere ${target} aktuelle Fehler.`, related: "Fehlerbank", reason: "Offene Fehler zeigen dir den nächsten klaren Schritt.", minutes: focusMinutesFor(Math.max(3, target * 2)), target, baseline };
    }
    if (Number(state.ui.studySessionStep || 0) > 0) return { type: "session", subject: "Lerneinheit", title: "Setze deine Lerneinheit fort", description: "Mach dort weiter, wo du aufgehört hast.", related: "Offene Lerneinheit", reason: "Du hast bereits angefangen und brauchst nur noch den nächsten kleinen Schritt.", minutes: 5, target: 1, baseline };
    const weak = weakestSubject();
    if (weak) return { type: "session", subject: weak.name, title: isGermanProfile() ? `${compactLabel(weak.name, 18)} stärken` : `Strengthen ${compactLabel(weak.name, 18)}`, description: isGermanProfile() ? "Übe ein kurzes Thema." : "Practice one short topic.", related: isGermanProfile() ? "Dein schwächstes Fach" : "Your weakest subject", reason: weak.reason, minutes: focusMinutesFor(8), target: 1, baseline };
    if (!state.exams.length && !state.homework.length && !state.studyTasks.length && !state.flashcards.length) return { type: "material", subject: "Start", title: isGermanProfile() ? "Lernmaterial hinzufügen" : "Add study material", description: isGermanProfile() ? "Scanne Notizen, lade ein PDF hoch oder erstelle dein erstes Set." : "Scan notes, upload a PDF, or create your first set.", related: isGermanProfile() ? "Material" : "Material", reason: isGermanProfile() ? "Noch gibt es nicht genug Daten für eine echte Empfehlung." : "There is not enough data for a real recommendation yet.", minutes: 3, target: 1, baseline };
    if (!state.subjects.length) return { type: "grades", subject: "Start", title: isUniversityProfile() ? labels.addGrade : labels.addGrade, description: gradeEmptyCopy().text, related: isGermanProfile() ? "Erster Schritt" : "First step", reason: isGermanProfile() ? "Noten helfen Lynxly, Risiken früher zu erkennen." : "Grades help Lynxly spot risks earlier.", minutes: 2, target: 1, baseline };
    return { type: "material", subject: "Start", title: isGermanProfile() ? "Bereit, wenn du bist" : "Ready when you are", description: isGermanProfile() ? "Füge Material hinzu, damit Lynxly eine echte Mission wählen kann." : "Add material so Lynxly can choose a real mission.", related: isGermanProfile() ? "Material" : "Material", reason: isGermanProfile() ? "Noch gibt es nicht genug Daten für eine echte Empfehlung." : "There is not enough data for a real recommendation yet.", minutes: 2, target: 1, baseline };
  };
  const focusProgress = (focus) => {
    const baseline = focus.baseline || {};
    if (focus.type === "cards") return Math.max(0, Number(state.weeklyStats.cardsReviewed || 0) - Number(baseline.cardsReviewed || 0));
    if (focus.type === "mistakes") return Math.max(0, Number(state.weeklyStats.mistakesFixed || 0) - Number(baseline.mistakesFixed || 0));
    if (focus.type === "session") return Math.max(0, Number(state.weeklyStats.studySessions || 0) - Number(baseline.studySessions || 0));
    if (focus.type === "grades") return Math.max(0, Number(state.subjects.length || 0) - Number(baseline.subjects || 0));
    if (focus.type === "grade-risk") {
      return Math.max(
        0,
        Number(state.weeklyStats.studyTasksAdded || 0) - Number(baseline.studyTasksAdded || 0),
        Number(state.weeklyStats.studySessions || 0) - Number(baseline.studySessions || 0),
        Number(state.weeklyStats.cardsReviewed || 0) - Number(baseline.cardsReviewed || 0),
        Number(state.weeklyStats.mistakesFixed || 0) - Number(baseline.mistakesFixed || 0)
      );
    }
    return Math.max(0, Number(state.weeklyStats.studyTasksAdded || 0) - Number(baseline.studyTasksAdded || 0));
  };
  const getTodaysFocus = (userData = state) => {
    const reminder = getImportantReminder(userData);
    const reminderSignature = reminder ? `${reminder.id}-${reminder.date}-${reminder.time || ""}-${reminder.title}-${reminder.subject}-${reminder.topic || ""}-${reminder.linkedDeckId || ""}-${(reminder.linkedMistakeIds || []).join(",")}` : "daily";
    const urgencyRank = { overdue: 4, soon: 3, upcoming: 2, planned: 1 };
    const moreUrgent = reminder && reminder.id !== state.todaysFocus.reminderId
      && Number(urgencyRank[reminder.urgency] || 0) > Number(urgencyRank[state.todaysFocus.reminderUrgency] || 0);
    const linkedReminderExists = !state.todaysFocus.reminderId || [...state.homework, ...state.exams, ...state.planEvents, ...state.studyTasks].some((item) => item.id === state.todaysFocus.reminderId);
    const linkedReminderChanged = reminder?.id === state.todaysFocus.reminderId && state.todaysFocus.reminderSignature !== reminderSignature;
    if (state.todaysFocus.version !== 6 || state.todaysFocus.date !== todayIso() || !state.todaysFocus.title || moreUrgent || !linkedReminderExists || linkedReminderChanged) {
      state.todaysFocus = {
        version: 6,
        date: todayIso(),
        key: `${reminder?.id || "daily"}-${reminder?.subject || "start"}`,
        reminderId: reminder?.id || "",
        reminderUrgency: reminder?.urgency || "",
        reminderSignature,
        ...createTodaysFocus(reminder)
      };
      save();
    }
    const progress = focusProgress(state.todaysFocus);
    const target = Math.max(1, Number(state.todaysFocus.target || 1));
    return { ...state.todaysFocus, progress: Math.min(progress, target), complete: progress >= target };
  };
  const renderFocusAction = (focus) => {
    if (focus.complete) return `<button class="secondary-button refresh-today-focus today-focus-more" type="button">Weiter lernen</button>`;
    const labels = schoolLabels();
    const continueLabel = isGermanProfile() ? "Jetzt lernen" : "Start learning";
    const actionLabels = isGermanProfile()
      ? { cards: "Jetzt lernen", mistakes: "Jetzt lernen", session: "Jetzt lernen", "grade-risk": "Jetzt lernen", upload: "Material hinzufügen", material: "Material hinzufügen", planner: focus.title === "Ersten Test eintragen" ? `${labels.examNoun} hinzufügen` : "Aufgabe planen", grades: isUniversityProfile() ? "Kurs hinzufügen" : "Note hinzufügen" }
      : { cards: "Start learning", mistakes: "Start learning", session: "Start learning", "grade-risk": "Start learning", upload: "Add material", material: "Add material", planner: focus.title === "Ersten Test eintragen" ? "Add test" : "Plan task", grades: isUniversityProfile() ? "Add course" : "Add grade" };
    const label = ["cards", "mistakes", "session", "grade-risk"].includes(focus.type) ? (actionLabels[focus.type] || continueLabel) : (actionLabels[focus.type] || continueLabel);
    return `<button class="primary-button today-focus-action mission-continue-button" data-focus-type="${C.escapeHtml(focus.type)}" type="button" aria-label="${C.escapeHtml(label)}">${label}${C.icon("chevron")}</button>`;
  };
  const lastStudySession = () => {
    const entries = [
      ...(state.deckSessionHistory || []),
      ...(state.modeHistory || [])
    ].filter(Boolean);
    return entries
      .sort((a, b) => String(b.completedAt || b.date || "").localeCompare(String(a.completedAt || a.date || "")))[0] || null;
  };
  const missionSubject = (focus, reminder) => {
    const weak = weakestSubject();
    return focus.subject || reminder?.subject || weak?.name || lastStudySession()?.deckTitle || (isGermanProfile() ? "Lernen" : "Study");
  };
  const missionCardsLeft = (focus) => {
    if (focus.type === "cards") return Math.max(0, Number(focus.target || 1) - Number(focus.progress || 0));
    return pendingDueCards().length;
  };
  const missionInsightCards = (focus, reminder) => {
    const cardsLeft = missionCardsLeft(focus);
    const mistakesLeft = openMistakes().length;
    const weak = weakestSubject();
    const last = lastStudySession();
    const subject = missionSubject(focus, reminder);
    return [
      {
        label: isGermanProfile() ? "Nächster Bereich" : "Next area",
        value: subject,
        note: focus.related || last?.deckTitle || "Study Cards"
      },
      {
        label: isGermanProfile() ? "Karten übrig" : "Cards left",
        value: cardsLeft,
        note: cardsLeft ? (isGermanProfile() ? "heute sinnvoll" : "useful today") : (isGermanProfile() ? "freiwillig" : "optional")
      },
      {
        label: isGermanProfile() ? "Schwache Punkte" : "Weak spots",
        value: mistakesLeft,
        note: weak?.name || (isGermanProfile() ? "Fehlerbank" : "Mistake bank")
      },
      {
        label: "Streak / XP",
        value: `${Number(state.streak.current || 0)} · ${Number(state.xpThisWeek || 0)}`,
        note: isGermanProfile() ? "Tage · Woche" : "days · week"
      }
    ];
  };
  const renderHomeReminder = (reminder) => {
    if (!reminder) return "";
    const status = reminder.urgency === "overdue" ? "Überfällig" : reminder.relative;
    const details = [reminder.topic || reminder.subject, status, reminder.time || formatDate(reminder.date)].filter(Boolean).join(" · ");
    return `
      <article class="important-reminder ${reminder.urgency === "overdue" ? "reminder-overdue" : ""}">
        <span class="reminder-icon">${C.icon(reminder.icon)}</span>
        <div class="reminder-copy">
          <span><i class="subject-color-dot" aria-hidden="true"></i>${C.escapeHtml(reminder.typeLabel)}</span>
          <h2>${C.escapeHtml(compactLabel(reminder.title, 48))}</h2>
          <p>${C.escapeHtml(details)}</p>
        </div>
        <a class="reminder-action" href="${reminder.href}">${C.escapeHtml(reminder.actionLabel)}${C.icon("chevron")}</a>
      </article>
    `;
  };
  const homeGradeSecondMetric = () => {
    const labels = schoolLabels();
    const system = currentSystem();
    const profile = schoolProfile();
    const pluspunkte = calculatePluspunkte();
    if (shouldShowPluspunkte()) {
      return {
        label: labels.pointsTitle,
        value: formatPlusPoints(pluspunkte.value),
        note: profile.countryLabel || system.name || "Schweiz",
        emphasis: Number(pluspunkte.value || 0) >= 0 ? "positive" : "negative"
      };
    }
    const passLabel = isGermanProfile() ? "Bestehen" : "Pass mark";
    const passDigits = Number(system.step || 1) < 0.1 ? 2 : Number(system.step || 1) < 1 ? 1 : 0;
    return {
      label: passLabel,
      value: formatSchoolNumber(Number(system.pass), passDigits),
      note: system.label || system.name || (isGermanProfile() ? "Notensystem" : "Grade system"),
      emphasis: "system"
    };
  };
  const homeGradeTone = (value) => {
    if (!Number.isFinite(value)) return "grade-neutral";
    const system = currentSystem();
    if (system.id === "ch") {
      const rounded = Math.round(value * 2) / 2;
      if (rounded < 3.5) return "grade-low";
      if (rounded < 4) return "grade-warning";
      if (rounded < 4.5) return "grade-ok";
      if (rounded < 5) return "grade-light-good";
      return "grade-high";
    }
    const min = Number(system.min || 0);
    const max = Number(system.max || 6);
    const pass = Number(system.pass || min);
    const betterDistance = system.higherIsBetter ? max - pass : pass - min;
    const score = system.higherIsBetter ? value - pass : pass - value;
    const ratio = betterDistance > 0 ? score / betterDistance : 0;
    if (score < 0) return ratio < -0.45 ? "grade-low" : "grade-warning";
    if (ratio < 0.18) return "grade-ok";
    if (ratio < 0.48) return "grade-light-good";
    return "grade-high";
  };
  const renderHomeGradePanel = () => {
    const labels = schoolLabels();
    const avg = weightedAverage();
    const metric = homeGradeSecondMetric();
    const avgNote = avg === null ? labels.addGrade : labels.gradeSubtext;
    const tone = homeGradeTone(avg);
    return `
      <a class="mission-grade-card" href="#grades" aria-label="${C.escapeHtml(labels.gradeTitle)} öffnen">
        <header>
          <div>
            <span class="mission-grade-icon">${C.icon("chart")}</span>
            <h2>${C.escapeHtml(labels.gradeTitle)}</h2>
          </div>
          ${C.icon("chevron")}
        </header>
        <div class="mission-grade-values">
          <article class="mission-grade-window mission-grade-average">
            <span>${C.escapeHtml(labels.gradeMetric === "Schnitt" ? "Durchschnitt" : labels.gradeMetric)}</span>
            <strong>${avg === null ? "–" : C.escapeHtml(formatSchoolAverage(avg, { digits: 2 }))}</strong>
            <small>${C.escapeHtml(avgNote)}</small>
          </article>
          <article class="mission-grade-window mission-grade-secondary ${C.escapeHtml(metric.emphasis)} ${tone}">
            <span>${C.escapeHtml(metric.label)}</span>
            <strong>${C.escapeHtml(metric.value)}</strong>
            <small>${C.escapeHtml(metric.note)}</small>
          </article>
        </div>
      </a>
    `;
  };
  const homeNotificationItems = () => {
    const labels = schoolLabels();
    const today = todayIso();
    const preferences = state.settings.reminderPreferences || {};
    const items = [];
    const add = (item) => {
      if (!item?.title) return;
      const key = `${item.kind || "note"}-${String(item.title || "").trim().toLocaleLowerCase()}-${item.date || ""}`;
      if (!items.some((entry) => entry.key === key)) items.push({ ...item, key });
    };
    state.exams
      .filter((exam) => exam.date && dayDelta(exam.date) >= 0 && dayDelta(exam.date) <= Number(preferences.testDays || 7))
      .forEach((exam) => add({ id: exam.id, kind: "exam", icon: "book", label: labels.examNoun, title: exam.title || `${exam.subject} ${labels.examNoun}`, text: `${exam.subject} · ${relativeDayLabel(exam.date)}${exam.time ? `${isGermanProfile() ? " um" : " at"} ${exam.time}` : ""}`, date: exam.date, href: "#planner", urgency: dayDelta(exam.date) <= 1 ? "urgent" : "normal" }));
    state.homework
      .filter((task) => task.status !== "Erledigt" && task.dueDate && dayDelta(task.dueDate) <= Number(preferences.assignmentDays || 7))
      .forEach((task) => add({ id: task.id, kind: "homework", icon: "check", label: dayDelta(task.dueDate) < 0 ? (isGermanProfile() ? "Überfällig" : "Overdue") : labels.homeworkNoun, title: task.title, text: `${task.subject} · ${dayDelta(task.dueDate) < 0 ? `${isGermanProfile() ? "Fällig am" : "Due"} ${formatDate(task.dueDate)}` : relativeDayLabel(task.dueDate)}`, date: task.dueDate, href: "#planner", urgency: dayDelta(task.dueDate) <= 0 ? "urgent" : "normal" }));
    state.studyTasks
      .filter((task) => !task.done && task.date && dayDelta(task.date) <= 1)
      .forEach((task) => add({ id: task.id, kind: "task", icon: "target", label: isGermanProfile() ? "Lernaufgabe" : "Study task", title: task.title, text: `${task.subject || (isGermanProfile() ? "Lernen" : "Study")} · ${dayDelta(task.date) < 0 ? `${isGermanProfile() ? "Fällig am" : "Due"} ${formatDate(task.date)}` : relativeDayLabel(task.date)}`, date: task.date, href: "#planner", urgency: dayDelta(task.date) < 0 ? "urgent" : "normal" }));
    state.planEvents
      .filter((event) => event.date && dayDelta(event.date) >= 0 && dayDelta(event.date) <= 1)
      .forEach((event) => add({ id: event.id, kind: "study", icon: "calendar", label: isGermanProfile() ? "Lerntermin" : "Study session", title: event.title, text: `${event.subject || (isGermanProfile() ? "Lernen" : "Study")} · ${relativeDayLabel(event.date)}`, date: event.date, href: "#planner", urgency: "normal" }));
    const weakCards = pendingDueCards().filter((card) => Number(card.difficulty || 0) >= 2);
    if (weakCards.length) add({ id: "weak-cards", kind: "cards", icon: "cards", label: "Study Cards", title: `${weakCards.length} schwierige ${weakCards.length === 1 ? "Karte" : "Karten"} wiederholen`, text: "Starte eine kurze Wiederholung.", date: today, href: "#cards", urgency: "normal" });
    (state.notifications || []).slice(0, 6).forEach((note) => add({ id: note.id, kind: "note", icon: "bell", label: "Lynxly", title: note.title, text: note.text, date: note.date, href: "#dashboard", urgency: "normal" }));
    return items
      .sort((a, b) => Number(a.urgency !== "urgent") - Number(b.urgency !== "urgent") || String(a.date || "").localeCompare(String(b.date || "")))
      .slice(0, 10);
  };
  const notificationGroup = (item) => {
    if (item.kind === "cards" || item.kind === "study" || item.kind === "note") return "study";
    const delta = dayDelta(item.date);
    if (delta <= 1) return "today";
    return "week";
  };
  const renderNotificationGroup = (title, entries) => entries.length ? `
    <section class="notification-group" aria-label="${C.escapeHtml(title)}">
      <h3>${C.escapeHtml(title)}</h3>
      ${entries.map((item) => `
        <a class="notification-center-item ${item.urgency === "urgent" ? "urgent" : ""}" href="${item.href}">
          <span class="notification-item-icon">${C.icon(item.icon)}</span>
          <div><small>${C.escapeHtml(item.label)}</small><strong>${C.escapeHtml(compactLabel(item.title, 64))}</strong><p>${C.escapeHtml(item.text || "")}</p></div>
          ${C.icon("chevron")}
        </a>
      `).join("")}
    </section>
  ` : "";
  const renderNotificationCenter = (items) => {
    const labels = schoolLabels();
    const groups = {
      today: items.filter((item) => notificationGroup(item) === "today"),
      week: items.filter((item) => notificationGroup(item) === "week"),
      study: items.filter((item) => notificationGroup(item) === "study")
    };
    return `
      <div class="notification-center-backdrop" role="presentation">
        <section class="notification-center" role="dialog" aria-modal="true" aria-labelledby="notification-center-title">
          <header class="notification-center-header">
            <div><span>${isGermanProfile() ? "Ruhige Hinweise" : "Calm reminders"}</span><h2 id="notification-center-title">${C.escapeHtml(labels.reminderTitle)}</h2></div>
            <button class="icon-button close-notification-center" type="button" aria-label="${isGermanProfile() ? "Erinnerungen schließen" : "Close reminders"}">×</button>
          </header>
          <div class="notification-actions">
            <button class="secondary-button notification-mark-all" type="button">${isGermanProfile() ? "Alle gelesen" : "Mark all read"}</button>
            <button class="secondary-button notification-settings" type="button">${isGermanProfile() ? "Einstellungen" : "Settings"}</button>
          </div>
          <div class="notification-center-list">
            ${items.length ? [
              renderNotificationGroup(isGermanProfile() ? "Heute" : "Today", groups.today),
              renderNotificationGroup(isGermanProfile() ? "Diese Woche" : "This week", groups.week),
              renderNotificationGroup(isGermanProfile() ? "Lern-Erinnerungen" : "Study reminders", groups.study)
            ].join("") : `<div class="notification-center-empty">${C.mascot("mascot-small")}<div><strong>${C.escapeHtml(labels.reminderEmpty)}</strong><p>${C.escapeHtml(labels.reminderEmptyText)}</p></div></div>`}
          </div>
        </section>
      </div>
    `;
  };
  const renderHomeHeader = (notificationItems, streakLabel) => `
    <header class="home-brand-header mission-home-header" aria-label="Lynxly Start">
      <a class="home-brand" href="#dashboard" aria-label="Lynxly Startseite">
        <img src="src/assets/lynxly-logo.webp" alt="" width="40" height="40" loading="eager" decoding="async" onerror="this.onerror=null;this.src='src/assets/lynxly-logo.png';" />
        <strong>Lynxly</strong>
      </a>
      <div class="home-header-actions">
        <a class="home-streak-pill" href="#progress" aria-label="${C.escapeHtml(streakLabel)}, Fortschritt öffnen"><span aria-hidden="true">🔥</span><strong>${state.streak.current}</strong></a>
        <button id="home-notification-button" class="home-header-icon home-notification-button" type="button" aria-label="Erinnerungen öffnen" aria-expanded="${state.ui.notificationCenterOpen ? "true" : "false"}">${C.icon("bell")}${notificationItems.length ? `<b>${Math.min(9, notificationItems.length)}</b>` : ""}</button>
      </div>
    </header>
  `;
  const renderDailyMissionCard = (focus, reminder) => {
    const focusSubject = compactLabel(missionSubject(focus, reminder), 30);
    const focusTitle = focus.complete
      ? (isGermanProfile() ? "Mission geschafft" : "Mission complete")
      : compactLabel(focus.title || `${focusSubject} weiterlernen`, 46);
    const cardsLeft = missionCardsLeft(focus);
    const total = Math.max(1, Number(focus.target || cardsLeft || 1));
    const actionCount = focus.type === "mistakes" ? total : Math.max(total, cardsLeft || 0);
    const actionNoun = focus.type === "mistakes"
      ? (actionCount === 1 ? "Fehler" : "Fehler")
      : (actionCount === 1 ? "Karte" : "Karten");
    const missionMeta = focus.type === "material"
      ? `${focus.minutes} Min · Material vorbereiten`
      : `${actionCount} ${actionNoun} · ca. ${focus.minutes} Min.`;
    const progressValue = Math.min(100, Math.round((Number(focus.progress || 0) / Math.max(1, Number(focus.target || 1))) * 100));
    const reason = cleanDisplayText(focus.reason || (isGermanProfile()
      ? "Lynxly wählt deine Mission aus echten Terminen, Fehlern und fälligen Karten."
      : "Lynxly picks your mission from real deadlines, mistakes and due cards."));
    return `
      <article class="daily-mission-card ${focus.complete ? "completed" : ""}" aria-labelledby="daily-mission-title">
        <div class="daily-mission-copy">
          <div class="daily-mission-kicker"><span>Heutige Mission</span><em>${C.escapeHtml(focusSubject)}</em></div>
          <h2 id="daily-mission-title">${C.escapeHtml(focusTitle)}</h2>
          <p class="daily-mission-meta">${C.escapeHtml(missionMeta)}</p>
          <p class="daily-mission-reason">${C.escapeHtml(compactLabel(reason, 128))}</p>
          <div class="daily-mission-progress" role="progressbar" aria-label="Fortschritt der heutigen Mission" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressValue}"><i style="width:${progressValue}%"></i></div>
          ${renderFocusAction(focus)}
        </div>
        <div class="mission-mastery" style="--mission-mastery:${progressValue}" aria-hidden="true">
          <div class="mastery-ring"><strong>${progressValue}%</strong></div>
          <span>Sicherheit</span>
        </div>
      </article>
    `;
  };
  const deadlineTitle = (item) => {
    if (!item) return isGermanProfile() ? "Keine Deadline" : "No deadline";
    const prefix = item.kind === "exam" ? "Nächste Prüfung" : item.kind === "homework" ? "Nächste Abgabe" : item.kind === "task" ? "Nächste Aufgabe" : "Nächster Termin";
    return cleanDisplayText(`${prefix}: ${item.subject || compactLabel(item.title, 28)} ${item.relative ? lowerFirst(item.relative) : ""}`.trim());
  };
  const renderNextDeadlineCard = (item) => `
    <article class="home-support-card deadline-card">
      <span class="support-icon">${C.icon(item?.icon || "calendar")}</span>
      <div>
        <small>Deadline</small>
        <h2>${C.escapeHtml(deadlineTitle(item))}</h2>
        <p>${item ? C.escapeHtml(compactLabel(item.title || item.text || "", 56)) : "Du hast gerade keine Prüfung oder Abgabe eingetragen."}</p>
      </div>
      ${item ? `<a href="${item.href}" aria-label="${C.escapeHtml(item.title)} öffnen">${C.icon("chevron")}</a>` : ""}
    </article>
  `;
  const renderWeeklyProgressCard = () => {
    const days = Array.isArray(state.weeklyStats.studyDays) ? [...new Set(state.weeklyStats.studyDays)].length : 0;
    const target = 5;
    const percent = Math.min(100, Math.round((days / target) * 100));
    return `
      <article class="home-support-card weekly-progress-card">
        <span class="support-icon">${C.icon("chart")}</span>
        <div>
          <small>Diese Woche</small>
          <h2>${days} von ${target} Lerntagen</h2>
          <p>Kleine Einheiten zählen mit.</p>
          <div class="weekly-progress-mini" role="progressbar" aria-label="Lerntage diese Woche" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${days}"><i style="width:${percent}%"></i></div>
        </div>
      </article>
    `;
  };
  const renderMaterialBottomSheet = () => `
    <div class="material-sheet-backdrop" role="presentation">
      <section class="material-sheet" role="dialog" aria-modal="true" aria-labelledby="material-sheet-title">
        <header>
          <div><span>Material</span><h2 id="material-sheet-title">Womit möchtest du lernen?</h2></div>
          <button class="icon-button close-material-sheet" type="button" aria-label="Material schließen">×</button>
        </header>
        <div class="material-action-grid">
          <button type="button" data-material-action="scan">${C.icon("camera")}<span>Notizen scannen</span><small>Foto oder Bild auswählen</small></button>
          <button type="button" data-material-action="pdf">${C.icon("upload")}<span>PDF hochladen</span><small>Arbeitsblatt vorbereiten</small></button>
          <button type="button" data-material-action="text">${C.icon("edit")}<span>Text einfügen</span><small>Aus Notizen Material machen</small></button>
          <button type="button" data-material-action="manual">${C.icon("cards")}<span>Karten manuell erstellen</span><small>Eigenes Set starten</small></button>
          <button type="button" data-material-action="ask">${C.icon("bot")}<span>Lynxly fragen</span><small>Coach öffnen</small></button>
        </div>
      </section>
    </div>
  `;
  const renderTodayDashboard = () => {
    const reminder = getImportantReminder();
    const focus = getTodaysFocus();
    const pendingCards = pendingDueCards();
    const openMistakeCount = openMistakes().length;
    const recent = lastStudySession();
    const nowHour = new Date().getHours();
    const greetingTime = isGermanProfile()
      ? (nowHour < 11 ? "Guten Morgen" : nowHour < 18 ? "Guten Tag" : "Guten Abend")
      : (nowHour < 11 ? "Good morning" : nowHour < 18 ? "Good afternoon" : "Good evening");
    const fallbackName = isGermanProfile() ? "du" : "there";
    const firstName = compactLabel(String(state.user.name || "").trim().split(/\s+/)[0] || fallbackName, 18);
    const streakLabel = `${state.streak.current} ${state.streak.current === 1 ? "Tag" : "Tage"}`;
    const notificationItems = homeNotificationItems();
    const deadline = reminder || notificationItems.find((item) => ["exam", "homework", "task", "study"].includes(item.kind)) || null;
    const nextAction = notificationItems.find((item) => item.kind === "cards") || deadline || notificationItems[0] || null;
    const recentTitle = recent?.deckTitle || state.recentXpEvents?.[0]?.reason || (isGermanProfile() ? "Noch keine Aktivität" : "No activity yet");
    const recentMeta = recent
      ? `${learningModeOption(recent.modeId || recent.optionId || recent.mode).title} · ${Number(recent.processed || recent.total || 0)} ${isGermanProfile() ? "Karten" : "cards"}`
      : (state.recentXpEvents?.[0] ? `+${state.recentXpEvents[0].amount} XP` : (isGermanProfile() ? "Starte deine erste kurze Runde." : "Start your first short round."));
    const missionStats = [
      { label: isGermanProfile() ? "Fällige Karten" : "Cards Due", value: pendingCards.length, icon: "cards" },
      { label: isGermanProfile() ? "Fehler" : "Mistakes", value: openMistakeCount, icon: "target" },
      { label: isGermanProfile() ? "XP verdient" : "XP Earned", value: Number(state.xpThisWeek || 0), icon: "spark" }
    ];
    const showGradePanel = state.settings.dashboardVisibility?.grades !== false;
    return `
      <section class="home-page today-dashboard focus-home mission-home lynxly-home-v3 density-${C.escapeHtml(state.settings.dashboardDensity || "comfortable")}">
        ${renderHomeHeader(notificationItems, streakLabel)}
        <div class="home-welcome home-greeting mission-greeting">
          <div><h1>${C.escapeHtml(greetingTime)}, ${C.escapeHtml(firstName)}</h1><p>${isGermanProfile() ? "Heute zählt nur der nächste klare Schritt." : "Focus today, achieve tomorrow."}</p></div>
        </div>

        ${renderDailyMissionCard(focus, reminder)}

        <section class="mission-stat-grid" aria-label="${isGermanProfile() ? "Weitere Lernwerte" : "Additional study stats"}">
          ${missionStats.map((item) => `
            <article class="mission-stat-card">
              <span>${C.icon(item.icon)}</span>
              <strong>${C.escapeHtml(String(item.value))}</strong>
              <small>${C.escapeHtml(item.label)}</small>
            </article>
          `).join("")}
        </section>

        ${showGradePanel ? renderHomeGradePanel() : ""}

        <article class="mission-panel recent-activity-card">
          <span>${isGermanProfile() ? "Als nächstes" : "Next"}</span>
          <h2>${C.escapeHtml(compactLabel(nextAction?.title || recentTitle, 42))}</h2>
          <p>${C.escapeHtml(nextAction?.text || recentMeta)}</p>
          <a class="mission-text-link" href="${nextAction?.href || (recent ? "#cards" : "#progress")}">${isGermanProfile() ? "Öffnen" : "Open"}${C.icon("chevron")}</a>
        </article>
        ${state.ui.notificationCenterOpen ? renderNotificationCenter(notificationItems) : ""}
      </section>
    `;
  };

  const sessionMistakes = () => openMistakes().slice(0, 3);
  const sessionCards = () => pendingDueCards().slice(0, 5);
  const renderSessionProgress = () => `
    <div class="session-progress">
      ${["Fehler", "Karten", "Mini-Check", "Zusammenfassung"].map((label, index) => `<button class="session-step-tab ${state.ui.studySessionStep === index ? "active" : ""}" data-step="${index}" type="button" aria-current="${state.ui.studySessionStep === index ? "step" : "false"}">${index + 1}. ${label}</button>`).join("")}
    </div>
  `;
  const renderMistakeReviewSession = () => {
    const session = state.mistakeReviewSession || defaultMistakeReviewSession();
    if (session.completed) {
      const reviewed = Number(session.reviewed || 0);
      const correct = Number(session.correct || 0);
      const weak = Math.max(0, reviewed - correct);
      const xp = correct * 20 + weak * 10;
      return `
        <section class="study-session-page mistake-review-session">
          <div class="mistake-header"><div><span class="eyebrow">Fehler-Review</span><h1>Stark gemacht</h1></div><a class="icon-button" href="#dashboard" aria-label="Zurück zu Home">&times;</a></div>
          <article class="session-summary-card focused-summary session-result-clean" aria-live="polite">
            <div class="session-result-hero">
              ${C.mascot("mascot-small")}
              <div><span>Dein Ergebnis</span><h2>${correct} von ${reviewed} sicher</h2><p>${weak ? `${weak} Fehler solltest du nochmals üben.` : "Keine offenen Fehler in dieser Runde."}</p></div>
            </div>
            <div class="session-result-metrics">
              <article><span>Schwachstellen</span><strong>${weak}</strong></article>
              <article><span>Belohnung</span><strong>+${xp} XP</strong></article>
            </div>
            <div class="continue-actions compact">
              ${weak ? `<button class="primary-button restart-mistake-review" type="button">${weak} Fehler wiederholen</button>` : `<a class="primary-button" href="#cards">Weiteres Set lernen</a>`}
              <a class="secondary-button" href="#mistakes">Fehlerbank</a>
              <a class="secondary-button" href="#dashboard">Start</a>
            </div>
            <details class="session-details">
              <summary>Sitzungsdetails</summary>
              <div class="session-summary-grid">
                <article><span>Bearbeitet</span><strong>${reviewed}</strong></article>
                <article><span>Sicher</span><strong>${correct}</strong></article>
                <article><span>Noch üben</span><strong>${weak}</strong></article>
                <article><span>Review-Datum</span><strong>${formatDate(session.completedAt || todayIso())}</strong></article>
              </div>
              <p class="panel-note">Unsichere Fehler werden automatisch für eine spätere Wiederholung eingeplant.</p>
            </details>
          </article>
        </section>
      `;
    }
    const mistake = currentMistakeReview();
    if (!mistake) {
      return `
        <section class="study-session-page mistake-review-session">
          <div class="mistake-header"><div><span class="eyebrow">Fehler-Review</span><h1>Keine offenen Fehler</h1></div><a class="icon-button" href="#dashboard" aria-label="Zurück zu Home">&times;</a></div>
          ${C.emptyState("Alles erledigt", "Mach ein Quiz, um neue Schwachstellen zu entdecken.")}
          <a class="primary-button" href="#cards">Quiz starten</a>
        </section>
      `;
    }
    const index = Number(session.index || 0);
    const total = Math.max(1, session.mistakeIds.length);
    const phase = session.phase || "question";
    const explanation = mistake.aiExplanation || mistake.explanation || mistakeExplanation(mistake, "simple");
    return `
      <section class="study-session-page mistake-review-session">
        <div class="mistake-header">
          <div><span class="eyebrow">Fehler-Review</span><h1>${C.escapeHtml(mistake.subject)}</h1></div>
          <a class="icon-button" href="#dashboard" aria-label="Session beenden">&times;</a>
        </div>
        <div class="focused-session-progress">
          <span>${index + 1} / ${total}</span>
          <div role="progressbar" aria-label="Fortschritt Fehler-Review" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${index}"><i style="width:${Math.round((index / total) * 100)}%"></i></div>
        </div>
        <p class="session-recommendation">${C.escapeHtml(session.reason || "Offene Fehler zuerst zu klären verbessert deine Sicherheit.")}</p>
        <article class="mistake-review-card">
          <span>${C.escapeHtml(mistake.topic || "Grundlagen")}</span>
          <h2>${C.escapeHtml(mistake.question)}</h2>
          ${phase === "question" ? `
            <form id="mistake-review-form">
              <label>Deine Antwort<textarea name="answer" rows="3" required autofocus></textarea></label>
              <button class="primary-button" type="submit">Antwort prüfen</button>
            </form>
            <button class="text-action reveal-mistake-explanation" type="button">Erklärung anzeigen</button>
          ` : ""}
          ${phase === "retry" ? `
            <div class="mistake-review-feedback wrong" aria-live="polite"><strong>Noch nicht ganz.</strong><p>Versuche es noch einmal oder sieh dir die Erklärung an.</p></div>
            <div class="mistake-review-actions"><button class="primary-button retry-mistake-review" type="button">Noch einmal</button><button class="secondary-button reveal-mistake-explanation" type="button">Erklärung anzeigen</button></div>
          ` : ""}
          ${phase === "correct" ? `
            <div class="mistake-review-feedback correct" aria-live="polite"><strong>Richtig beantwortet</strong><p>${C.escapeHtml(mistake.correctAnswer)}</p></div>
            <button class="primary-button next-mistake-review" type="button">${index + 1 >= total ? "Zusammenfassung" : "Nächster Fehler"}</button>
          ` : ""}
          ${phase === "explanation" ? `
            <div class="mistake-review-explanation">
              <span>Richtige Antwort</span><strong>${C.escapeHtml(mistake.correctAnswer || "Noch keine Musterlösung")}</strong>
              <p>${C.escapeHtml(explanation)}</p>
            </div>
            <div class="mistake-review-actions"><button class="secondary-button retry-mistake-review" type="button">Selbst versuchen</button><button class="primary-button next-mistake-review" type="button">${index + 1 >= total ? "Zusammenfassung" : "Weiter"}</button></div>
          ` : ""}
        </article>
      </section>
    `;
  };
  const renderStudySession = () => {
    if (state.mistakeReviewSession?.active || state.mistakeReviewSession?.completed) return renderMistakeReviewSession();
    const step = Math.min(Math.max(Number(state.ui.studySessionStep || 0), 0), 3);
    const mistakes = sessionMistakes();
    const cards = sessionCards();
    const cardIndex = Math.min(Math.max(Number(state.ui.studySessionCardIndex || 0), 0), Math.max(0, cards.length - 1));
    const card = cards[cardIndex];
    const emptyHelp = `<div class="empty-state"><strong>Noch nicht genug Lernstoff</strong><p>Erstelle ein paar Karten oder füge einen Fehler hinzu. Danach wird die Session automatisch sinnvoller.</p><div class="coach-action-row"><a class="secondary-button" href="#cards">Karten erstellen</a><a class="secondary-button" href="#mistakes">Fehler hinzufügen</a></div></div>`;
    const content = [
      `<section class="session-step">
        <h2>Fehler wiederholen</h2>
        ${mistakes.length ? mistakes.map((mistake) => `<article class="mistake-card"><div class="mistake-card-top"><strong>${C.escapeHtml(mistake.subject)}</strong><span>${C.escapeHtml(mistake.topic || "Fehler")}</span></div><h2>${C.escapeHtml(mistake.question)}</h2><p>${C.escapeHtml(mistake.explanation || mistake.correctAnswer || "Erkläre dir kurz, warum dieser Punkt schwierig war.")}</p><button class="secondary-button session-fix-mistake" data-id="${mistake.id}" type="button">Verstanden</button></article>`).join("") : emptyHelp}
      </section>`,
      `<section class="session-step">
        <h2>Karten wiederholen</h2>
        ${card ? `${renderStudyCard(card)}<div class="study-nav-row"><button class="icon-button session-card-prev" type="button" aria-label="Vorherige Karte in der Lerneinheit" ${cardIndex <= 0 ? "disabled" : ""}>&#8592;</button><span>${cardIndex + 1} / ${cards.length}</span><button class="icon-button session-card-next" type="button" aria-label="Nächste Karte in der Lerneinheit" ${cardIndex >= cards.length - 1 ? "disabled" : ""}>&#8594;</button></div><div class="srs-rating-grid"><button class="srs-rating again session-rate-card" data-rating="again" type="button">Nochmal</button><button class="srs-rating hard session-rate-card" data-rating="hard" type="button">Schwer</button><button class="srs-rating good session-rate-card" data-rating="good" type="button">Gut</button><button class="srs-rating easy session-rate-card" data-rating="easy" type="button">Einfach</button></div>` : emptyHelp}
      </section>`,
      `<section class="session-step">
        <h2>Mini-Check</h2>
        <article class="panel"><p class="panel-note">Schreibe in einem Satz auf, was du gerade besser verstanden hast. Das speichert Lynxly als kleine Lernnotiz.</p><form id="session-check-form"><label>Meine Zusammenfassung<textarea name="summary" rows="4" placeholder="Heute habe ich verstanden, dass ..."></textarea></label><button class="primary-button" type="submit">Speichern und weiter</button></form></article>
      </section>`,
      `<section class="session-step">
        <h2>Gut gemacht</h2>
        <article class="panel session-summary"><strong>${mistakes.length} Fehler · ${cards.length} Karten</strong><p>Diese Session zählt für deine Lernserie. Du kannst jetzt zurück zu Start oder direkt weiterlernen.</p><div class="coach-action-row"><button class="primary-button complete-study-session" type="button">Session abschließen</button><a class="secondary-button" href="#cards">Weiterlernen</a></div></article>
      </section>`
    ][step];
    return `
      <section class="study-session-page">
        <div class="mistake-header">
          <div><span class="eyebrow">15 Minuten</span><h1>Lerneinheit</h1></div>
          <a class="secondary-button" href="#dashboard">Beenden</a>
        </div>
        ${renderSessionProgress()}
        ${content}
      </section>
    `;
  };

  const gradeInputAttrs = () => {
    const system = currentSystem();
    return `min="${system.min}" max="${system.max}" step="0.01"`;
  };
  const fitTitleStyle = (title) => {
    const length = Math.max(4, [...String(title || "")].length);
    const size = Math.max(1.65, Math.min(3.7, 4.7 - (length * 0.24)));
    return `style="--fit-title-size:${size.toFixed(2)}rem"`;
  };

  const gradeSubjectById = (id) => state.subjects.find((subject) => subject.id === id);
  const gradeEntryById = (subject, id) => subject?.grades.find((grade) => grade.id === id);
  const gradeCategoryById = (subject, categoryId) => (subject.gradeCategories || []).find((category) => category.id === categoryId);
  const defaultTargetOptions = (subject) => ({
    weight: parseWeightInput(state.ui.targetGradeWeight, 1),
    categoryId: subject.gradeMode === "category"
      ? (gradeCategoryById(subject, state.ui.targetGradeCategoryId)?.id || subject.gradeCategories?.[0]?.id || "")
      : ""
  });
  const projectSubjectAverage = (subject, value, options = {}) => subjectAverage(subject, [
    ...(subject.grades || []),
    {
      id: "preview-grade",
      type: "exam",
      title: "Vorschau",
      date: todayIso(),
      value: Number(value),
      weight: parseWeightInput(options.weight, 1),
      categoryId: options.categoryId || ""
    }
  ]);
  const renderGradeActions = (gradeId, partialId = "") => `
    <div class="grade-row-actions">
      <button class="icon-action delete-grade" data-grade="${gradeId}" data-partial="${partialId}" type="button" title="Löschen" aria-label="Prüfung löschen">${C.icon("trash")}</button>
    </div>
  `;
  const renderGradeEntryRow = (grade) => {
    const isPartial = grade.type === "partial";
    const value = gradeValue(grade);
    const subject = gradeSubjectById(state.ui.selectedGradeSubject);
    const category = gradeCategoryById(subject || {}, grade.categoryId);
    const partialCount = isPartial ? (grade.partialGrades || []).length : 0;
    const details = [
      !isPartial && grade.type ? grade.type : "",
      !isPartial && grade.topic ? grade.topic : "",
      isPartial ? `${partialCount} Teilprüfung${partialCount === 1 ? "" : "en"}` : (grade.date ? formatDate(grade.date) : "Ohne Datum"),
      isPartial ? `Zählt ${formatWeightPercentLabel(gradeWeight(grade))}` : (gradeWeight(grade) !== 1 ? `Gewicht ${formatWeightLabel(gradeWeight(grade))}` : ""),
      category ? category.name : ""
    ].filter(Boolean).join(" · ");
    return `
      <article class="grade-swipe-row ${isPartial ? "partial-folder-row" : ""}" ${isPartial ? `data-partial-id="${grade.id}"` : ""}>
        <button class="grade-row-main ${isPartial ? "open-partial-folder" : "edit-grade-entry"}" data-id="${grade.id}" type="button" aria-label="${isPartial ? `${C.escapeHtml(grade.title)} öffnen` : `${C.escapeHtml(grade.title)} bearbeiten`}">
          <span class="grade-row-icon">${C.icon(isPartial ? "folder" : "chart")}</span>
          <div>
            <strong>${C.escapeHtml(grade.title)}</strong>
            <small>${C.escapeHtml(details || "Ohne Datum")}</small>
          </div>
          ${isPartial ? `
            <span class="partial-folder-metrics">
              <b>${Number.isFinite(value) ? value.toFixed(2) : "–"}</b>
              <small>${formatWeightPercentLabel(gradeWeight(grade))}</small>
            </span>
          ` : `<em>${Number.isFinite(value) ? value.toFixed(2) : "–"}</em>`}
        </button>
        ${renderGradeActions(grade.id)}
      </article>
    `;
  };

  const renderSubjectFolders = () => sortedSubjectsByAverage().map((subject) => {
    const labels = schoolLabels();
    const avg = subjectAverage(subject);
    const points = plusPointsFor(subject);
    const roundedGrade = Number.isFinite(avg) ? Math.round(avg * 2) / 2 : null;
    const gradeClass = !Number.isFinite(roundedGrade)
      ? "grade-neutral"
      : roundedGrade < 3.5
        ? "grade-low"
        : roundedGrade < 4
          ? "grade-warning"
          : roundedGrade < 4.5
            ? "grade-ok"
            : roundedGrade < 5
              ? "grade-light-good"
              : "grade-high";
    return `
      <article class="subject-folder-row ${gradeClass}" data-subject-id="${subject.id}">
        <button class="grade-folder" data-id="${subject.id}" type="button">
          <div><strong>${C.escapeHtml(subject.name)}</strong><small>${subject.grades.length} ${C.escapeHtml(labels.examNoun)}${subject.grades.length === 1 ? "" : isGermanProfile() ? "en" : "s"}</small></div>
          <em>${avg === null ? "–" : C.escapeHtml(formatSchoolAverage(avg, { digits: 2 }))}</em>
          ${shouldShowPluspunkte() ? `<b class="${points >= 0 ? "positive" : "negative"}">${formatPlusPoints(points)}</b>` : ""}
        </button>
        <div class="subject-row-actions">
          <button class="icon-action delete-subject" data-id="${subject.id}" type="button" title="Fach löschen" aria-label="${C.escapeHtml(subject.name)} löschen">${C.icon("trash")}</button>
        </div>
      </article>
    `;
  }).join("") || `<div class="empty-grade-list">${C.escapeHtml(gradeEmptyCopy().text)}</div>`;

  const renderGrades = () => {
    const labels = schoolLabels();
    const selected = gradeSubjectById(state.ui.selectedGradeSubject);
    const partial = selected ? gradeEntryById(selected, state.ui.selectedPartialGroup) : null;
    const avg = weightedAverage();
    const pluspunkte = calculatePluspunkte();
    if (selected && partial?.type === "partial") return renderPartialGroupDetail(selected, partial);
    if (selected) return renderGradeSubjectDetail(selected);

    return `
      <section class="grade-page">
        <div class="grade-page-header">
          <h1>${C.escapeHtml(labels.gradeTitle)}</h1>
          <button class="round-add" id="toggle-subject-form" type="button" aria-label="${isUniversityProfile() ? "Kurs hinzufügen" : "Fach hinzufügen"}">+</button>
        </div>
        <form class="subject-add-form ${state.ui.showSubjectForm ? "show" : ""}" id="subject-form">
          <label class="subject-combo-label">${isUniversityProfile() ? "Kurs" : "Fach"}
            <div class="subject-combo" data-subject-combo>
              <input name="name" required autocomplete="off" placeholder="${isUniversityProfile() ? "Kurs selbst eintippen" : "Fach selbst eintippen"}" />
              <button class="subject-suggest-toggle" type="button" aria-label="Vorgeschlagene Fächer anzeigen" aria-expanded="false">&#8964;</button>
              <div class="subject-suggestions" role="listbox" aria-label="Vorgeschlagene Fächer">
                ${subjectChoices.map((subject) => `<button type="button" role="option" data-subject="${C.escapeHtml(subject)}">${C.escapeHtml(subject)}</button>`).join("")}
              </div>
            </div>
          </label>
          <label>Gewichtung<input name="weight" type="number" min="0.5" max="4" step="0.5" value="1" /></label>
          <button class="primary-button" type="submit">${isUniversityProfile() ? "Kurs hinzufügen" : "Fach hinzufügen"}</button>
        </form>
        ${state.ui.showSubjectForm ? "" : `
          <section class="grade-summary-card">
            <div class="grade-summary-top">
              <div><span>${C.escapeHtml(labels.gradeMetric)}</span><strong>${avg === null ? "–" : C.escapeHtml(formatSchoolAverage(avg, { digits: 2 }))}</strong></div>
              <em>${state.subjects.length ? "Aktuelles Semester" : "Startklar"}</em>
            </div>
            <div class="grade-summary-stats">
              ${shouldShowPluspunkte() ? `<article><span>${C.escapeHtml(labels.pointsTitle)}</span><strong>${formatPlusPoints(pluspunkte.value)}</strong><small>${pluspunkte.reason ? C.escapeHtml(pluspunkte.reason) : "Reserve über 4,0"}</small></article>` : ""}
              <article><span>Ziel</span><strong>${state.subjects.find((subject) => subject.targetGrade)?.targetGrade || "–"}</strong></article>
              <article><span>${C.escapeHtml(labels.examNoun)}${isGermanProfile() ? "en" : "s"}</span><strong>${state.subjects.reduce((sum, subject) => sum + subject.grades.length, 0)}</strong></article>
            </div>
            ${shouldShowPluspunkte() ? `<p class="pluspoints-explainer"><strong>Was bedeutet das?</strong> Pluspunkte zeigen vereinfacht, wie viel Reserve du über der Mindestanforderung hast. Die genaue Promotionsregel kann je nach Schule oder Kanton anders sein.</p>` : ""}
          </section>
          <div class="sleek-section-title grade-list-title"><h2>${isUniversityProfile() ? "Kurse" : "Fächer"}</h2><span>${state.subjects.length}</span></div>
          <section class="grade-folder-list">${renderSubjectFolders()}</section>
        `}
      </section>
    `;
  };

  const renderGradeModeFields = (subject, values = {}) => {
    const selectedWeight = parseWeightInput(values.weight, 1);
    const categoryField = subject.gradeMode === "category" ? `
      <label>Kategorie
        <select name="categoryId">
          ${(subject.gradeCategories || []).map((category) => `<option value="${category.id}" ${category.id === values.categoryId ? "selected" : ""}>${C.escapeHtml(category.name)} · ${Number(category.percentage || 0)}%</option>`).join("")}
        </select>
      </label>
    ` : "";
    const weightField = `
      <label>Gewichtung <small>x oder %</small>
        <input id="grade-weight" name="weight" type="text" inputmode="decimal" value="${C.escapeHtml(formatWeightInput(selectedWeight))}" />
      </label>
    `;
    const folderToggle = values.includeFolderToggle ? `
      <label class="toggle-field grade-folder-toggle">
        <input name="isPartialFolder" type="checkbox" />
        <span>Als Noten-Ordner speichern</span>
        <small>Für Teilnoten wie mündliche Noten oder kurze Abfragen.</small>
      </label>
    ` : "";
    return `${categoryField}${weightField}${folderToggle}`;
  };

  const renderTargetModeFields = (subject) => {
    if (subject.gradeMode === "simple") return "";
    const currentOptions = defaultTargetOptions(subject);
    const weightField = `
      <label>Nächste Gewichtung <small>x oder %</small>
        <input id="target-grade-weight" name="targetWeight" type="text" inputmode="decimal" value="${C.escapeHtml(formatWeightInput(currentOptions.weight))}" />
      </label>
    `;
    if (subject.gradeMode === "category") {
      return `
        <label>Nächste Kategorie
          <select name="targetCategoryId">
            ${(subject.gradeCategories || []).map((category) => `<option value="${category.id}" ${category.id === currentOptions.categoryId ? "selected" : ""}>${C.escapeHtml(category.name)} · ${Number(category.percentage || 0)}%</option>`).join("")}
          </select>
        </label>
        ${weightField}
      `;
    }
    return weightField;
  };

  const renderCategoryBreakdown = (subject) => {
    if (subject.gradeMode !== "category") return "";
    const breakdown = categoryBreakdown(subject);
    const avg = subjectAverage(subject);
    const filled = Math.round(breakdown.filledPercent);
    const open = Math.max(0, 100 - filled);
    const totalWarning = Math.round(breakdown.totalPercent) === 100 || subject.normalizeCategories
      ? ""
      : `<p class="category-progress-note warning">Die Kategorien ergeben ${Math.round(breakdown.totalPercent)}%. Der Endschnitt kann unvollständig wirken, bis du 100% erreichst oder automatisch normalisierst.</p>`;
    return `
      <section class="category-breakdown-card">
        <div class="sleek-section-title">
          <h2>Kategorie-Breakdown</h2>
          <span>${Number.isFinite(avg) ? avg.toFixed(2) : "–"}</span>
        </div>
        <p class="category-progress-note">${filled}% der Bewertung ist mit Noten gefüllt${open ? ` · Noch ${open}% offen` : ""}</p>
        ${totalWarning}
        ${breakdown.rows.map((row) => `
          <article class="category-breakdown-row">
            <div>
              <strong>${C.escapeHtml(row.name)}</strong>
              <small>${Number(row.percentage || 0)}% · ${row.grades.length ? `${row.grades.length} Note${row.grades.length === 1 ? "" : "n"}` : "Noch keine Noten"}</small>
            </div>
            <span>${Number.isFinite(row.average) ? row.average.toFixed(2) : "–"}</span>
            <em>${Number.isFinite(row.contribution) ? row.contribution.toFixed(2) : "–"}</em>
          </article>
        `).join("")}
      </section>
    `;
  };

  const renderWhatIfCard = (subject) => {
    const result = state.ui.whatIfResult?.subjectId === subject.id ? state.ui.whatIfResult : null;
    const current = subjectAverage(subject);
    const change = result && Number.isFinite(result.average) && Number.isFinite(current) ? result.average - current : null;
    return `
      <section class="what-if-card">
        <div class="sleek-section-title"><h2>Zur Wunschnote testen</h2><span>Was wäre, wenn</span></div>
        <form class="what-if-form" id="what-if-form">
          <label>Titel <small>optional</small><input name="title" /></label>
          <label>Note<input name="value" required type="number" ${gradeInputAttrs()} /></label>
          ${subject.gradeMode === "category" ? `
            <label>Kategorie<select name="categoryId">${(subject.gradeCategories || []).map((category) => `<option value="${category.id}">${C.escapeHtml(category.name)}</option>`).join("")}</select></label>
          ` : ""}
          ${subject.gradeMode !== "simple" ? `<label>Gewichtung <small>x oder %</small><input name="weight" type="text" inputmode="decimal" value="1" /></label>` : ""}
          <button class="secondary-button" type="submit">Ausrechnen</button>
        </form>
        ${result ? `
          <div class="what-if-result">
            <article><span>Aktuell</span><strong>${Number.isFinite(current) ? current.toFixed(2) : "–"}</strong></article>
            <article><span>Vorschau</span><strong>${Number.isFinite(result.average) ? result.average.toFixed(2) : "–"}</strong></article>
            <article><span>Änderung</span><strong>${Number.isFinite(change) ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}` : "–"}</strong></article>
            <button class="primary-button save-what-if-grade" type="button">Als Note speichern</button>
          </div>
        ` : ""}
      </section>
    `;
  };

  const renderGradeSubjectDetail = (subject) => {
    const labels = schoolLabels();
    const avg = subjectDisplayAverage(subject);
    const points = plusPointsFor(subject);
    const target = subject.targetGrade ? Number(subject.targetGrade).toFixed(2) : "–";
    const targetOptions = defaultTargetOptions(subject);
    const needed = requiredNextGrade(subject, targetOptions);
    const neededToPass = requiredPassingGrade(subject, targetOptions);
    const neededText = Number.isFinite(needed)
      ? `ca. ${needed.toFixed(2)}`
      : Number.isFinite(neededToPass)
        ? `ca. ${neededToPass.toFixed(2)} zum Bestehen`
        : (subject.targetGrade ? "Mit einer einzelnen Note wahrscheinlich nicht erreichbar" : "Zielnote setzen");
    const editingGrade = state.ui.editingGradeId ? gradeEntryById(subject, state.ui.editingGradeId) : null;
    const gradeFormTitle = editingGrade?.title || "";
    const gradeFormDate = editingGrade?.date || todayIso();
    const gradeFormValue = Number.isFinite(gradeValue(editingGrade || {})) ? gradeValue(editingGrade).toFixed(2) : "";
    const gradeFormWeight = editingGrade ? gradeWeight(editingGrade) : 1;
    const gradeFormCategory = editingGrade?.categoryId || subject.gradeCategories?.[0]?.id || "";
    const gradeFormType = editingGrade?.type && editingGrade.type !== "partial" ? editingGrade.type : "Prüfung";
    const gradeFormTopic = editingGrade?.topic || "";
    const gradeFormComment = editingGrade?.comment || "";
    const gap = targetGap(subject);
    const decks = subjectRelatedDecks(subject);
    const relatedTopics = subject.relatedTopics?.filter(Boolean) || [];
    return `
      <section class="grade-page">
        <div class="grade-page-header folder-detail-header">
          <button class="icon-button back-arrow-button back-to-subjects" type="button" title="Zurück" aria-label="Zurück zu den Fächern">&#8249;</button>
          <h1 ${fitTitleStyle(subject.name)}>${C.escapeHtml(subject.name)}</h1>
          <button class="round-add" id="toggle-grade-entry-form" type="button" aria-label="Prüfung hinzufügen">+</button>
        </div>
        <div class="subject-score-row">
          <article><span>${C.escapeHtml(labels.gradeMetric)}</span><strong>${avg === null ? "–" : C.escapeHtml(formatSchoolAverage(avg, { digits: 2 }))}</strong></article>
          <article class="target-grade-card"><span>Wunschnote</span><button class="target-grade-button" type="button">${C.escapeHtml(target)}</button></article>
          ${shouldShowPluspunkte() ? `<article><span>${C.escapeHtml(labels.pointsTitle)}</span><strong class="${points >= 0 ? "positive" : "negative"}">${formatPlusPoints(points)}</strong></article>` : ""}
        </div>
        <div class="grade-coach-row">
          <article><span>Welche Note brauche ich?</span><strong>${C.escapeHtml(neededText)}</strong></article>
        </div>
        <section class="grade-study-recommendation">
          <div>
            <span>Lernempfehlung</span>
            <h2>${isBelowTarget(subject) ? `${C.escapeHtml(subject.name)} gezielt stärken` : "Stabil bleiben"}</h2>
            <p>${isBelowTarget(subject)
              ? `Du liegst ${C.escapeHtml(formatGradeDelta(gap))} unter deiner Zielnote. Starte eine kurze Runde mit Fehlern, Karten oder einem Plan-Task.`
              : "Dein Schnitt liegt nicht unter der Zielnote. Wiederhole vor der nächsten Prüfung kurz die wichtigsten Themen."}</p>
            <small>${relatedTopics.length ? `Themen: ${C.escapeHtml(relatedTopics.join(", "))}` : decks.length ? `Verknüpfter Stapel: ${C.escapeHtml(decks[0].title)}` : "Noch kein verwandter Stapel. Du kannst Notizen im Coach in Study Cards verwandeln."}</small>
          </div>
          <button class="primary-button start-grade-study" data-subject="${C.escapeHtml(subject.name)}" type="button">Lernen starten</button>
        </section>
        <div class="grade-ai-actions">
          <button class="secondary-button grade-ai-prompt" data-action="goal" data-subject="${C.escapeHtml(subject.id)}" type="button">Wie erreiche ich meine Zielnote?</button>
          <button class="secondary-button grade-ai-prompt" data-action="plan" data-subject="${C.escapeHtml(subject.id)}" type="button">Lernplan erstellen</button>
          <button class="secondary-button grade-ai-prompt" data-action="quiz" data-subject="${C.escapeHtml(subject.id)}" type="button">Quiz generieren</button>
        </div>
        ${state.ui.showTargetGradeForm ? `
          <form class="target-grade-form show" id="target-grade-form">
            <label>Wunschnote<input name="targetGrade" type="number" ${gradeInputAttrs()} value="${C.escapeHtml(subject.targetGrade || "")}" /></label>
            ${renderTargetModeFields(subject)}
            <button class="primary-button" type="submit">Wunschnote speichern</button>
          </form>
          ${renderWhatIfCard(subject)}
        ` : ""}
        <form class="grade-entry-form ${state.ui.showGradeEntryForm ? "show" : ""}" id="grade-form">
          <input type="hidden" name="gradeId" value="${C.escapeHtml(editingGrade?.id || "")}" />
          <label>Name <small>optional</small><input name="title" value="${C.escapeHtml(gradeFormTitle)}" /></label>
          <label>Datum<input name="date" type="date" value="${C.escapeHtml(gradeFormDate)}" /></label>
          <label>Typ
            <select name="type">
              ${["Prüfung", "Test", "Vortrag", "Hausarbeit", "Mitarbeit"].map((type) => `<option value="${type}" ${type === gradeFormType ? "selected" : ""}>${type}</option>`).join("")}
            </select>
          </label>
          <label>Note<input name="value" type="number" ${gradeInputAttrs()} value="${C.escapeHtml(gradeFormValue)}" /></label>
          ${renderGradeModeFields(subject, { weight: gradeFormWeight, categoryId: gradeFormCategory, includeFolderToggle: !editingGrade })}
          <label>Thema <small>optional</small><input name="topic" value="${C.escapeHtml(gradeFormTopic)}" /></label>
          <label>Kommentar <small>optional</small><textarea name="comment" rows="3">${C.escapeHtml(gradeFormComment)}</textarea></label>
          <button class="primary-button" type="submit">${editingGrade ? "Prüfung aktualisieren" : "Prüfung speichern"}</button>
        </form>
        ${state.ui.showGradeEntryForm ? "" : `
        <section class="grade-entry-list">
          ${subject.grades.map(renderGradeEntryRow).join("") || `<div class="empty-grade-list">Drücke +, um die erste Prüfung einzutragen.</div>`}
        </section>`}
      </section>
    `;
  };

  const renderPartialGroupDetail = (subject, group) => {
    const avg = group.partialGrades.length ? average(group.partialGrades) : null;
    return `
      <section class="grade-page">
        <div class="grade-page-header folder-detail-header">
          <button class="icon-button back-arrow-button back-to-subject-detail" type="button" title="Zurück" aria-label="Zurück zum Fach">&#8249;</button>
          <h1 ${fitTitleStyle(group.title)}>${C.escapeHtml(group.title)}</h1>
          <button class="round-add" id="toggle-partial-entry-form" type="button" aria-label="Teilprüfung hinzufügen">+</button>
        </div>
        <div class="subject-score-row partial-score-row">
          <article><span>Fach</span><strong>${C.escapeHtml(subject.name)}</strong></article>
          <article><span>Durchschnitt</span><strong>${avg === null ? "–" : avg.toFixed(2)}</strong></article>
          <article class="partial-weight-card">
            <span>Zählt</span>
            <button class="partial-weight-button" type="button" aria-label="Gewichtung ändern">${formatWeightPercentLabel(gradeWeight(group))}</button>
          </article>
        </div>
        ${state.ui.showPartialWeightForm ? `
          <form class="grade-entry-form show partial-weight-form" id="partial-weight-form">
            <label>Gewichtung <small>x oder %</small>
              <input name="weight" type="text" inputmode="decimal" value="${C.escapeHtml(formatWeightInput(gradeWeight(group)))}" />
            </label>
            <button class="primary-button" type="submit">Gewichtung speichern</button>
          </form>
        ` : ""}
        <form class="grade-entry-form ${state.ui.showPartialEntryForm ? "show" : ""}" id="partial-grade-form">
          <label>Name <small>optional</small><input name="title" /></label>
          <label>Datum<input name="date" type="date" value="${todayIso()}" /></label>
          <label>Note<input name="value" required type="number" ${gradeInputAttrs()} /></label>
          <button class="primary-button" type="submit">Teilprüfung speichern</button>
        </form>
        ${state.ui.showPartialEntryForm ? "" : `<section class="grade-entry-list">
          ${group.partialGrades.map((grade) => `
            <article class="grade-swipe-row">
              <div class="grade-row-main static">
                <span class="grade-row-icon">${C.icon("chart")}</span>
                <div><strong>${C.escapeHtml(grade.title)}</strong><small>${grade.date ? formatDate(grade.date) : "Ohne Datum"} · Gewicht 1</small></div>
                <em>${Number(grade.value).toFixed(2)}</em>
              </div>
              ${renderGradeActions(grade.id, group.id)}
            </article>
          `).join("") || `<div class="empty-grade-list">Drücke +, um die erste Teilprüfung einzutragen.</div>`}
        </section>`}
      </section>
    `;
  };

  const createAutoPlan = ({ subject, title, date, minutes, topics = "", linkedExamId = "" }) => {
    const end = dateObject(date);
    const start = dateObject(todayIso());
    const dayDistance = Math.max(1, Math.round((end - start) / 86400000));
    const count = Math.min(6, dayDistance + 1);
    const topicItems = topicList(topics);
    return Array.from({ length: count }, (_, index) => {
      const stepDate = new Date(start);
      const offset = count === 1 ? 0 : Math.round((dayDistance * index) / Math.max(1, count - 1));
      stepDate.setDate(stepDate.getDate() + offset);
      const step = planSteps[index % planSteps.length];
      const topic = topicItems[index % Math.max(1, topicItems.length)] || title;
      return { id: uid("event"), subject, title: `${step}: ${topic}`, date: toIso(stepDate), minutes: Number(minutes || 25), type: step, auto: true, linkedExamId };
    });
  };

  const renderSmartStudyPlanPreview = () => {
    const exam = [...state.exams].filter((item) => item.date >= todayIso()).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!exam) return "";
    const topics = exam.topics?.length ? exam.topics : [exam.title];
    const steps = [
      `Schwache Karten zu ${topics[0] || exam.subject} wiederholen`,
      `${topics[1] || topics[0] || exam.subject} üben`,
      "Offene Fehler korrigieren",
      "Mini-Test durchführen",
      "Kurze Abschlusswiederholung"
    ];
    const linkedSessions = state.planEvents.filter((item) => item.linkedExamId === exam.id).length;
    return `
      <section class="smart-plan-preview ${isPlus() ? "active" : "locked"}">
        <div class="smart-plan-preview-head">
          <div><span>${isPlus() ? "Smarter Lernplan" : "Plus Vorschau"}</span><h2>${C.escapeHtml(exam.subject)} · ${C.escapeHtml(compactLabel(exam.title, 38))}</h2><p>${C.escapeHtml(relativeDayLabel(exam.date))}</p></div>
          ${isPlus() ? C.icon("spark") : C.icon("lock")}
        </div>
        ${isPlus() && linkedSessions ? `<strong class="smart-plan-active-label">${linkedSessions} Lerntermine sind eingeplant</strong>` : `<div class="smart-plan-days">${steps.map((step, index) => `<article><b>Tag ${index + 1}</b><span>${C.escapeHtml(step)}</span></article>`).join("")}</div>`}
        ${isPlus() ? `<p class="smart-plan-copy">Aktiviere beim Eintragen einer Prüfung den smarten Lernplan, damit Lynxly diese Schritte in deinen Kalender legt.</p>` : `<div class="smart-plan-upgrade"><p><strong>Willst du diesen Plan automatisch im Kalender?</strong> Plus verbindet Prüfungsdatum, Themen, Karten und Fehler zu täglichen Schritten.</p><a class="primary-button" href="#premium">Plus ansehen</a></div>`}
      </section>
    `;
  };

  const renderMonthCalendar = (monthOffset = 0) => {
    const base = new Date();
    const now = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const items = calendarItems();
    const cells = [
      ...Array.from({ length: offset }, () => `<div class="calendar-cell empty"></div>`),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const iso = toIso(new Date(year, month, day));
        const dayItems = items.filter((item) => item.date === iso);
        return `<button class="calendar-cell ${iso === todayIso() ? "today" : ""} ${iso === state.ui.selectedPlannerDate ? "selected" : ""}" data-date="${iso}" type="button"><strong>${day}</strong>${dayItems.slice(0, 3).map((item) => `<span class="${item.exam ? "exam-dot" : item.homework ? "homework-dot" : ""}">${C.escapeHtml(item.subject)}</span>`).join("")}</button>`;
      })
    ];
    return `
      <article class="month-panel">
        <h3>${formatDate(toIso(new Date(year, month, 1)), { month: "long", year: "numeric" })}</h3>
        <div class="weekdays"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div>
        <div class="calendar-grid">${cells.join("")}</div>
      </article>
    `;
  };

  const renderCalendar = () => `<div class="calendar-month-stack">${renderMonthCalendar(state.ui.plannerMonthOffset)}</div>`;
  const plannerItemKind = (item) => item.exam ? "exam" : item.homework ? "homework" : "event";
  const plannerItemTimeLabel = (item) => {
    if (item.time) return item.time;
    if (item.homework) return "Fällig";
    if (item.exam) return "Prüfung";
    return "Lernen";
  };
  const plannerItemMeta = (item) => {
    const pieces = [item.subject || item.type || "Lernen"];
    if (item.minutes) pieces.push(`${Number(item.minutes)} Min.`);
    if (item.done) pieces.push("erledigt");
    return pieces.filter(Boolean).join(" · ");
  };
  const groupPlannerItemsByDate = (items) => items.reduce((groups, item) => {
    const date = item.date || todayIso();
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(item);
    return groups;
  }, new Map());
  const renderPlannerItemActions = (item) => {
    const kind = plannerItemKind(item);
    const attrs = `data-id="${C.escapeHtml(item.id)}" data-kind="${kind}" data-date="${C.escapeHtml(item.date)}" data-subject="${C.escapeHtml(item.subject || "")}"`;
    return `
      <div class="planner-item-actions" aria-label="Aktionen für ${C.escapeHtml(item.title || item.subject)}">
        <button class="planner-item-open" ${attrs} type="button">Öffnen</button>
        <button class="planner-item-start" ${attrs} type="button">Starten</button>
        <button class="planner-item-complete" ${attrs} type="button" ${item.done ? "disabled" : ""}>${item.done ? "Erledigt" : "Erledigen"}</button>
        <button class="planner-item-reschedule" ${attrs} type="button">+1 Tag</button>
        <button class="planner-item-delete danger" ${attrs} type="button">Löschen</button>
      </div>
    `;
  };
  const renderPlannerAgendaItem = (item) => `
    <article class="planner-agenda-item ${plannerItemKind(item)} ${item.done ? "completed" : ""}">
      <time datetime="${C.escapeHtml(item.date)}">${C.escapeHtml(plannerItemTimeLabel(item))}</time>
      <div class="planner-item-body">
        <strong>${C.escapeHtml(item.title || item.subject || "Lerneinheit")}</strong>
        <small>${C.escapeHtml(plannerItemMeta(item))}</small>
      </div>
      ${renderPlannerItemActions(item)}
    </article>
  `;
  const renderPlannerAgenda = ({ selectedOnly = false } = {}) => {
    const now = todayIso();
    const items = selectedOnly
      ? calendarItems().filter((item) => item.date === state.ui.selectedPlannerDate)
      : calendarItems()
        .filter((item) => item.date >= now && !item.done)
        .slice(0, 18);
    if (!items.length) {
      return `
        <section class="mobile-agenda-view" aria-label="Agenda">
          <article class="empty-state planner-empty-state">
            <strong>${selectedOnly ? "An diesem Tag ist nichts geplant" : "Keine geplanten Lerneinheiten"}</strong>
            <p>${selectedOnly ? "Füge einen Termin, eine Prüfung oder eine Aufgabe für diesen Tag hinzu." : "Plane eine kleine Einheit, damit Lynxly dir den nächsten Schritt zeigen kann."}</p>
            <button class="primary-button planner-empty-add" type="button">Eintrag hinzufügen</button>
          </article>
        </section>
      `;
    }
    const groups = groupPlannerItemsByDate(items);
    return `
      <section class="mobile-agenda-view" aria-label="${selectedOnly ? "Tagesagenda" : "Agenda"}">
        ${[...groups.entries()].map(([date, dayItems]) => `
          <section class="agenda-day-group">
            <h2>${C.escapeHtml(formatDate(date, { weekday: "long", day: "numeric", month: "short" }))}</h2>
            <div class="agenda-day-list">${dayItems.map(renderPlannerAgendaItem).join("")}</div>
          </section>
        `).join("")}
      </section>
    `;
  };
  const renderPlannerCoachCard = () => {
    const nextExam = state.exams.filter((exam) => dayDelta(exam.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const weak = weakestSubject();
    const title = nextExam ? `${nextExam.subject} vorbereiten` : (weak ? `${weak.name} stärken` : "Smarter Lernplan");
    const text = nextExam
      ? `Lynxly kann bis ${relativeDayLabel(nextExam.date)} kleine Lernblöcke eintragen.`
      : (weak ? `Aus deinen Fehlern und Noten entsteht ein kurzer Plan für ${weak.name}.` : "Trage eine Prüfung oder ein Ziel ein, dann plant Lynxly deinen nächsten Lernschritt.");
    return `
      <section class="planner-coach-card">
        <div>
          <span>KI-Lernplan</span>
          <h2>${C.escapeHtml(title)}</h2>
          <p>${C.escapeHtml(text)}</p>
        </div>
        <button class="primary-button generate-study-plan-now" type="button">${isGermanProfile() ? "Plan vorschlagen" : "Generate plan"}</button>
      </section>
    `;
  };

  const renderPlanner = () => {
    const base = new Date();
    const shownMonth = toIso(new Date(base.getFullYear(), base.getMonth() + Number(state.ui.plannerMonthOffset || 0), 1));
    const plannerView = state.ui.plannerView === "month" ? "month" : "agenda";
    return `
      <section class="planner-page sleek-screen">
        <div class="grade-page-header planner-page-header">
          <h1>Plan</h1>
          ${state.ui.showEventForm ? "" : `<button class="round-add planner-header-add" id="toggle-event-form" type="button" aria-label="Kalendereintrag hinzufügen">+</button>`}
        </div>
        ${state.ui.showEventForm ? "" : `
          <div class="planner-view-tabs" role="tablist" aria-label="Planansicht">
            <button class="planner-view-tab ${plannerView === "agenda" ? "active" : ""}" data-view="agenda" type="button" role="tab" aria-selected="${plannerView === "agenda"}">Agenda</button>
            <button class="planner-view-tab ${plannerView === "month" ? "active" : ""}" data-view="month" type="button" role="tab" aria-selected="${plannerView === "month"}">Monat</button>
          </div>
        `}
        <section class="panel calendar-only-panel ${state.ui.showEventForm ? "form-mode" : ""}">
        ${state.ui.showEventForm ? `
        <div class="form-only-header">
          <div><span>Plan</span><h2>Eintrag hinzufügen</h2></div>
          <button class="icon-button" id="toggle-event-form" type="button" title="Schließen" aria-label="Formular schließen">×</button>
        </div>
        ` : plannerView === "month" ? `<div class="sleek-month-selector">
          <button class="planner-prev-month" type="button" title="Vorheriger Monat" aria-label="Vorheriger Monat">&#8249;</button>
          <strong>${formatDate(shownMonth, { month: "long", year: "numeric" })}</strong>
          <button class="planner-next-month" type="button" title="Nächster Monat" aria-label="Nächster Monat">&#8250;</button>
        </div>` : ""}
      ${state.ui.showEventForm ? "" : (plannerView === "month" ? `${renderCalendar()}${renderPlannerAgenda({ selectedOnly: true })}` : renderPlannerAgenda())}
      <form id="event-form" class="calendar-entry-form ${state.ui.showEventForm ? "show" : ""}">
        <label>Eintrag<select id="event-kind" name="kind"><option value="exam">Prüfung</option><option value="homework">Hausaufgabe</option><option value="event">Termin</option></select></label>
        <label>Fach<input name="subject" required list="planner-subjects" /></label>
        <datalist id="planner-subjects">${subjectChoices.map((subject) => `<option value="${C.escapeHtml(subject)}"></option>`).join("")}</datalist>
        <label>Datum<input name="date" required type="date" value="${C.escapeHtml(state.ui.selectedPlannerDate || todayIso())}" /></label>
        <label class="exam-basic-field form-span-full">Themen <small>mit Komma trennen</small><textarea id="event-topics" name="topics" rows="3" required></textarea></label>
        <details class="exam-extra-fields form-span-full">
          <summary>Optionale Details</summary>
          <div class="advanced-field-grid">
          <label>Titel <small>optional</small><input name="title" /></label>
          <label>Uhrzeit <small>optional</small><input name="time" type="time" /></label>
          <label>Wichtigkeit<select name="importance"><option value="normal">Normal</option><option value="high">Wichtig</option><option value="low">Niedrig</option></select></label>
          <label>Verknüpfter Kartenstapel<select name="linkedDeckId"><option value="">Keiner</option>${personalDecks().map((deck) => `<option value="${C.escapeHtml(deck.title)}">${C.escapeHtml(deck.title)}</option>`).join("")}</select></label>
          <label>Verknüpfter Fehler<select name="linkedMistakeId"><option value="">Keiner</option>${openMistakes().slice(0, 20).map((mistake) => `<option value="${C.escapeHtml(mistake.id)}">${C.escapeHtml(compactLabel(`${mistake.subject}: ${mistake.question}`, 46))}</option>`).join("")}</select></label>
          <label>Geplante Lernzeit<input name="plannedStudyTime" type="number" min="2" max="180" value="25" inputmode="numeric" /></label>
          <label>Notengewichtung <small>optional</small><input name="gradeWeight" type="text" inputmode="decimal" /></label>
          <label class="form-span-full">Notizen oder Zusammenfassung<textarea name="notes" rows="3"></textarea></label>
          <label class="toggle-field form-span-full ${isPlus() ? "" : "premium-toggle-preview"}"><input name="autoPlan" type="checkbox" value="on" ${isPlus() ? "" : "disabled"} /><span>Smarter Lernplan ${isPlus() ? "" : "· Plus"}</span><small>${isPlus() ? "Lynxly trägt passende Lernschritte bis zur Prüfung ein." : "Nach dem Speichern siehst du eine kostenlose Vorschau des automatischen Lernplans."}</small></label>
          </div>
        </details>
        <button class="primary-button" type="submit">Eintragen</button>
      </form>
      </section>
      ${state.ui.showEventForm ? "" : `
        ${renderPlannerCoachCard()}
        ${renderSmartStudyPlanPreview()}
      `}
      </section>
    `;
  };

  const filteredLibrary = () => {
    const query = String(state.ui.cardSearch || "").toLowerCase();
    return state.cardLibrary.filter((pack) => [pack.title, pack.subject, pack.description].join(" ").toLowerCase().includes(query));
  };

  const personalCards = () => state.flashcards.filter((card) => card.source !== "database");
  const selectedLibraryPack = () => state.cardLibrary.find((pack) => pack.id === state.ui.selectedCardPackId) || null;
  const recommendedPack = () => selectedLibraryPack() || filteredLibrary()[0] || state.cardLibrary[0];
  const personalDecks = () => {
    const groups = new Map();
    personalCards().forEach((card) => {
      const title = card.title || card.subject || "Eigene Karten";
      const current = groups.get(title) || { title, subject: card.subject || title, cards: [] };
      current.cards.push(card);
      groups.set(title, current);
    });
    return [...groups.values()].sort((a, b) => b.cards.length - a.cards.length);
  };
  const currentDeckMeta = () => {
    if (state.ui.cardStudyMode === "due") return { id: "due", title: "Heute fällig", subtitle: "Fällige Wiederholung" };
    if (state.ui.cardStudyMode === "personal") {
      const title = state.ui.selectedCardSubject || "Persönliche Karten";
      return { id: `personal:${title}`, title, subtitle: "Eigener Stapel" };
    }
    const pack = recommendedPack();
    return { id: `recommended:${pack?.id || "cards"}`, title: pack?.title || "Empfohlener Stapel", subtitle: pack?.subject || "Lynxly Datenbank" };
  };
  const baseStudyCards = () => {
    if (state.ui.cardStudyMode === "due") return dueCards();
    if (state.ui.cardStudyMode === "personal") {
      return state.flashcards
        .filter((card) => card.source !== "database")
        .filter((card) => !state.ui.selectedCardSubject || (card.title || card.subject) === state.ui.selectedCardSubject || card.subject === state.ui.selectedCardSubject)
        .map((card) => ({ ...card, ...cardScheduleFor(card.id) }));
    }
    const pack = recommendedPack();
    if (!pack) return [];
    const limit = isPlus() ? pack.cards.length : Math.min(pack.freeCount || pack.cards.length, pack.cards.length);
    return pack.cards.slice(0, limit).map((card, index) => ({
      id: `${pack.id}-${index}`,
      subject: pack.subject,
      title: pack.title,
      packId: pack.id,
      source: "database",
      published: true,
      ...card,
      ...cardScheduleFor(`${pack.id}-${index}`)
    }));
  };
  const activeStudyCards = () => {
    const session = state.cardStudySession || {};
    if ((session.active || session.completed) && Array.isArray(session.cardIds) && session.cardIds.length) {
      const all = new Map(allCardsForReview().map((card) => [card.id, card]));
      return session.cardIds.map((id) => all.get(id)).filter(Boolean);
    }
    return baseStudyCards();
  };
  const learningModeOption = (id) => learningModeOptions.find((option) => option.id === id) || learningModeOptions[0];
  const shuffleList = (items) => [...items].sort(() => Math.random() - 0.5);
  const normalizeAnswerText = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:"'’`´()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const answerVariants = (answer) => {
    const raw = String(answer || "");
    const variants = raw
      .split(/\/|;|,|\boder\b|\bor\b|\|/i)
      .map(normalizeAnswerText)
      .filter(Boolean);
    return [...new Set([normalizeAnswerText(raw), ...variants].filter(Boolean))];
  };
  const answerMatches = (input, answer) => {
    const clean = normalizeAnswerText(input);
    if (!clean) return false;
    return answerVariants(answer).some((variant) => clean === variant);
  };
  const setCardReviewOnly = (card, rating) => {
    if (!card?.id) return;
    const wasDue = cardIsDue(card);
    rememberCardDueToday(card, wasDue);
    state.cardSchedule[card.id] = { rating, nextReview: addDays(todayIso(), reviewOffsetForRating(rating)), lastReviewed: todayIso() };
    state.cardReviewStatus = state.cardReviewStatus || {};
    state.cardReviewStatus[card.id] = rating;
    const ownedCard = state.flashcards.find((item) => item.id === card.id);
    if (ownedCard) ownedCard.reviewCount = Number(ownedCard.reviewCount || 0) + 1;
  };
  const modeRewardKey = (deckId, mode) => `${deckId || "deck"}:${mode || "mode"}`;
  const deckModeRewardToday = (deckId, mode) => {
    const reward = state.deckModeRewards?.[modeRewardKey(deckId, mode)];
    return reward?.date === todayIso() ? reward : null;
  };
  const awardDeckModeReward = (deckId, mode, fullXp, reason, reducedXp = 10) => {
    ensureGamification();
    state.deckModeRewards = state.deckModeRewards && typeof state.deckModeRewards === "object" && !Array.isArray(state.deckModeRewards) ? state.deckModeRewards : {};
    const key = modeRewardKey(deckId, mode);
    const previous = deckModeRewardToday(deckId, mode);
    const xp = previous ? Math.max(0, Number(reducedXp || 0)) : Math.max(0, Number(fullXp || 0));
    const cleanReason = previous ? "Übungsbonus" : reason;
    const count = previous ? Number(previous.count || 1) + 1 : 1;
    state.deckModeRewards[key] = { date: todayIso(), count, xp, fullXp: Number(fullXp || 0), mode };
    if (xp > 0) {
      awardXp(xp, cleanReason);
      state.dailyDeckStats.deckXp = Number(state.dailyDeckStats.deckXp || 0) + xp;
    }
    return { xp, repeated: Boolean(previous), reason: cleanReason };
  };
  const awardModeCardXp = (card, amount, reason) => {
    if (!card?.id) return 0;
    ensureGamification();
    recordCardReviewAction(1);
    const today = todayIso();
    const previous = state.cardXpHistory?.[card.id];
    if (previous?.date === today && Number(previous.xp || 0) > 0) return 0;
    const xp = Math.max(0, Number(amount || 0));
    state.cardXpHistory[card.id] = { ...previous, date: today, xp, due: Boolean(previous?.due), mode: state.cardStudySession?.mode || "cards" };
    if (xp > 0) {
      awardXp(xp, reason);
      state.dailyDeckStats.cardXp = Number(state.dailyDeckStats.cardXp || 0) + xp;
    }
    return xp;
  };
  const cardsForLearningMode = (modeId) => {
    const option = learningModeOption(modeId);
    const cards = baseStudyCards();
    const due = cards.filter(cardIsDue);
    const early = cards.filter((card) => !cardIsDue(card));
    const ordered = [...due, ...early];
    const limit = modeId === "match" ? Math.min(6, Math.max(2, Math.min(option.target, ordered.length || option.target))) : option.target;
    return ordered.slice(0, Math.min(limit, ordered.length));
  };
  const choiceOptionsForCard = (card) => {
    const sessionCards = activeStudyCards().filter((item) => item.id !== card.id);
    const sameDeck = sessionCards
      .filter((item) => item.packId && card.packId ? item.packId === card.packId : (item.title || item.subject) === (card.title || card.subject));
    const sameSubject = sessionCards.filter((item) => item.subject === card.subject);
    const pool = [...sameDeck, ...sameSubject]
      .map((item) => item.answer)
      .filter(Boolean);
    const fallback = plausibleDistractors(card.answer, card.subject);
    const options = [card.answer, ...pool, ...fallback]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item, index, list) => list.findIndex((value) => normalizeAnswerText(value) === normalizeAnswerText(item)) === index)
      .slice(0, 4);
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    return shuffleList(options);
  };
  const plausibleDistractors = (answer, subject = "") => {
    const clean = String(answer || "").trim();
    const numeric = clean.match(/-?\d+(?:[.,]\d+)?/);
    if (numeric) {
      const value = Number(numeric[0].replace(",", "."));
      if (Number.isFinite(value)) return [value + 1, Math.max(0, value - 1), value * 2].map((item) => String(item).replace(".", ","));
    }
    const science = /bio|chem|phys|mathe|geograph|geschichte|natur|technik|wissenschaft/i.test(String(subject || ""));
    if (science) return ["ähnlicher Fachbegriff", "verwandter Vorgang", "andere Ursache", "anderes Merkmal"];
    return ["ähnliche Bedeutung", "verwandter Begriff", "andere Lösung", "ähnliche Antwort"];
  };
  const languageNameFromText = (text) => {
    const value = String(text || "").toLowerCase();
    if (/franz|french|français|francais/.test(value)) return "Französisch";
    if (/engl|english/.test(value)) return "Englisch";
    if (/latein|latin/.test(value)) return "Latein";
    if (/ital|italien/.test(value)) return "Italienisch";
    if (/span|españ|espan/.test(value)) return "Spanisch";
    if (/deutsch|german/.test(value)) return "Deutsch";
    return "";
  };
  const deckLanguageLabels = (meta, cards) => {
    const joined = [meta?.title, meta?.subtitle, cards?.[0]?.subject, cards?.[0]?.title].join(" ");
    return {
      front: languageNameFromText(joined) || "Fremdsprache",
      back: state.settings.language?.startsWith("de") ? "Deutsch" : "deiner Sprache"
    };
  };
  const testPromptFor = (card, question = {}) => {
    const direction = question.direction || "front";
    return direction === "back"
      ? { prompt: card.answer, expected: card.question, from: "Antwort", to: "Frage" }
      : { prompt: card.question, expected: card.answer, from: "Frage", to: "Antwort" };
  };
  const choiceOptionsForQuestion = (card, question = {}, sourceCards = null) => {
    const expected = testPromptFor(card, question).expected;
    const sessionCards = (Array.isArray(sourceCards) ? sourceCards : activeStudyCards()).filter((item) => item.id !== card.id);
    const sameDeck = sessionCards
      .filter((item) => item.packId && card.packId ? item.packId === card.packId : (item.title || item.subject) === (card.title || card.subject));
    const sameSubject = sessionCards.filter((item) => item.subject === card.subject);
    const pool = [...sameDeck, ...sameSubject]
      .map((item) => question.direction === "back" ? item.question : item.answer)
      .filter(Boolean);
    const options = [expected, ...pool, ...plausibleDistractors(expected, card.subject)]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item, index, list) => list.findIndex((value) => normalizeAnswerText(value) === normalizeAnswerText(item)) === index)
      .slice(0, 4);
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    return shuffleList(options);
  };
  const buildTestQuestions = (cards, setup = {}) => {
    const useMixed = setup.mixed || (setup.write && setup.choice);
    const useWrite = setup.write || (!setup.write && !setup.choice);
    const useChoice = setup.choice || (!setup.write && !setup.choice);
    const directions = setup.direction === "both" ? ["front", "back"] : [setup.direction || "front"];
    return cards.map((card, index) => {
      const direction = directions[index % directions.length];
      const type = useMixed
        ? (index % 2 === 0 ? "write" : "choice")
        : (useChoice && !useWrite ? "choice" : "write");
      const question = { cardId: card.id, type, direction, options: [] };
      question.options = type === "choice" ? choiceOptionsForQuestion(card, question, cards) : [];
      return question;
    });
  };
  const buildLearnQuestions = (cards) => {
    const choiceCount = Math.max(1, Math.ceil(cards.length / 2));
    return cards.map((card, index) => {
      const question = { cardId: card.id, type: index < choiceCount ? "choice" : "write", direction: "front", options: [] };
      question.options = question.type === "choice" ? choiceOptionsForQuestion(card, question, cards) : [];
      return question;
    });
  };
  const matchTileId = (side, id) => `${side}:${id}`;
  const parseMatchTileId = (tileId = "") => {
    const [side, ...rest] = String(tileId).split(":");
    return { side, pairId: rest.join(":") };
  };
  const matchElapsedSeconds = (session = state.cardStudySession || {}) => {
    if (!session.matchTimed) return 0;
    const start = Date.parse(session.matchStartedAt || "");
    if (!Number.isFinite(start)) return Number(session.matchPenaltySeconds || 0);
    const end = session.matchCompletedAt ? Date.parse(session.matchCompletedAt) : Date.now();
    const base = Math.max(0, Math.floor((end - start) / 1000));
    return base + Number(session.matchPenaltySeconds || 0);
  };
  const formatStopwatch = (seconds) => {
    const total = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };
  const resetCardStudySession = () => {
    state.cardStudySession = defaultCardStudySession();
    state.activeModeSession = {};
    state.learningMode = "";
    state.ui.cardStudyIndex = 0;
  };
  const startDeckSession = (modeId) => {
    const normalizedModeId = modeId === "write" || modeId === "choice" ? "learn" : modeId;
    const option = learningModeOption(normalizedModeId);
    const meta = currentDeckMeta();
    const cards = cardsForLearningMode(option.id);
    if (!cards.length) return;
    const matchCards = option.id === "match" ? cards.slice(0, Math.min(6, Math.max(2, cards.length))) : [];
    const allDeckDueIds = baseStudyCards().filter(cardIsDue).map((card) => card.id);
    const matchTileOrder = option.id === "match"
      ? shuffleList(matchCards.flatMap((card) => [matchTileId("q", card.id), matchTileId("a", card.id)]))
      : [];
    const session = {
      choosing: false,
      active: true,
      completed: false,
      mode: option.id,
      testStarted: option.id !== "test",
      testSetup: { write: true, choice: true, mixed: true, direction: "front" },
      deckId: meta.id,
      deckTitle: meta.title,
      optionId: option.id,
      target: option.id === "match" ? matchCards.length : cards.length,
      cardIds: cards.map((card) => card.id),
      dueCardIds: allDeckDueIds,
      reviewedIds: [],
      ratings: [],
      answers: [],
      testQuestions: option.id === "learn" ? buildLearnQuestions(cards) : [],
      matchPairs: matchCards.map((card) => ({ id: card.id, question: card.question, answer: card.answer, subject: card.subject })),
      promptOrder: shuffleList(matchCards.map((card) => card.id)),
      answerOrder: shuffleList(matchCards.map((card) => card.id)),
      matchTileOrder,
      matchedIds: [],
      selectedPromptId: "",
      selectedAnswerId: "",
      selectedMatchTileId: "",
      currentAnswer: "",
      selectedChoice: "",
      awaitingNext: false,
      lastResult: null,
      lastWrongTileIds: [],
      correct: 0,
      wrong: 0,
      xpEarned: 0,
      cardXp: 0,
      deckXp: 0,
      comboXp: 0,
      bonusXp: 0,
      combo: 0,
      maxCombo: 0,
      comboAwards: [],
      mistakesCreated: 0,
      perfect: true,
      wrongAttempts: 0,
      matchPenaltySeconds: 0,
      matchStartedAt: option.id === "match" && meta.id !== "due" ? new Date().toISOString() : "",
      matchCompletedAt: "",
      matchTimed: option.id === "match" && meta.id !== "due",
      startedAt: new Date().toISOString(),
      summary: null
    };
    state.learningMode = option.id;
    state.cardStudySession = session;
    state.activeModeSession = { ...session };
    state.ui.cardStudyIndex = 0;
  };
  const completeWeeklyDeckChallenge = () => {
    const challenge = state.weeklyDeckChallenge;
    if (!challenge || challenge.rewarded) return 0;
    challenge.progress = Math.min(Number(challenge.target || 5), Number(challenge.progress || 0) + 1);
    if (challenge.progress >= Number(challenge.target || 5)) {
      challenge.rewarded = true;
      const reward = Number(challenge.rewardXp || 150);
      awardXp(reward, "Wochenchallenge geschafft");
      return reward;
    }
    return 0;
  };
  const completeDeckSession = () => {
    const session = { ...state.cardStudySession };
    if (!session.active || session.completed) return;
    if (session.mode === "match" && session.matchTimed && !session.matchCompletedAt) {
      session.matchCompletedAt = new Date().toISOString();
    }
    const mode = learningModeOption(session.mode);
    const answers = Array.isArray(session.answers) ? session.answers : [];
    const reviewedIds = Array.isArray(session.reviewedIds) ? session.reviewedIds : [];
    const processed = session.mode === "match"
      ? Number(session.matchedIds?.length || 0)
      : (session.mode === "cards" ? reviewedIds.length : answers.length);
    const correct = session.mode === "cards"
      ? Number(session.ratings?.filter((rating) => rating === "good" || rating === "easy").length || 0)
      : (session.mode === "match" ? Number(session.matchedIds?.length || 0) : answers.filter((answer) => answer.correct).length);
    const wrong = session.mode === "match"
      ? Number(session.wrongAttempts || 0)
      : (session.mode === "cards" ? Number(session.ratings?.filter((rating) => rating === "again" || rating === "hard").length || 0) : answers.filter((answer) => !answer.correct).length);
    let autoMistakesCreated = 0;
    let xpEarned = Number(session.xpEarned || 0);
    let deckXp = 0;
    let bonusXp = Number(session.bonusXp || 0);
    let repeatedDeck = false;
    const scorePercent = processed ? Math.round((correct / processed) * 100) : 0;
    if (session.mode === "test" || session.mode === "learn") {
      const scoreBonus = scorePercent >= 80 ? 20 : 0;
      const perfectBonus = scorePercent === 100 && processed > 0 ? 40 : 0;
      const reward = awardDeckModeReward(session.deckId, session.mode, 50 + scoreBonus + perfectBonus, `${mode.title} abgeschlossen`, 10);
      repeatedDeck = reward.repeated;
      xpEarned += reward.xp;
      deckXp += reward.xp;
      bonusXp += reward.repeated ? 0 : scoreBonus + perfectBonus;
      state.testResults = [{ id: uid("test"), deckId: session.deckId, deckTitle: session.deckTitle, modeId: session.mode, scorePercent, correct, wrong, xp: reward.xp, date: todayIso() }, ...(state.testResults || [])].slice(0, 80);
      recordCardReviewAction(Math.max(1, processed));
    }
    if (session.mode === "match") {
      const perfectBonus = Number(session.wrongAttempts || 0) === 0 ? 15 : 0;
      const reward = awardDeckModeReward(session.deckId, session.mode, 30 + perfectBonus, "Match Sprint", 8);
      repeatedDeck = reward.repeated;
      xpEarned += reward.xp;
      deckXp += reward.xp;
      bonusXp += reward.repeated ? 0 : perfectBonus;
      state.matchResults = [{ id: uid("match"), deckId: session.deckId, deckTitle: session.deckTitle, pairs: processed, mistakes: Number(session.wrongAttempts || 0), timeSeconds: matchElapsedSeconds(session), xp: reward.xp, date: todayIso() }, ...(state.matchResults || [])].slice(0, 80);
      recordCardReviewAction(Math.max(1, processed));
    }
    if (session.mode === "test" || session.mode === "learn") {
      answers.forEach((answer) => {
        if (answer.correct || answer.savedMistake) return;
        saveMistake({
          subject: answer.subject || session.deckTitle || "Study Cards",
          topic: session.deckTitle || answer.subject || "Quiz",
          question: answer.question,
          correctAnswer: answer.correctAnswer,
          userAnswer: answer.userAnswer || "Keine Antwort",
          explanation: `Aus ${mode.title} automatisch gespeichert. ${mistakeExplanation({
            subject: answer.subject,
            topic: session.deckTitle,
            question: answer.question,
            correctAnswer: answer.correctAnswer,
            userAnswer: answer.userAnswer
          }, "simple")}${answer.explanation ? ` ${answer.explanation}` : ""}`,
          source: `${mode.title} · Auto`
        }, { reward: true });
        answer.savedMistake = true;
        autoMistakesCreated += 1;
      });
    }
    const challengeXp = repeatedDeck ? 0 : completeWeeklyDeckChallenge();
    xpEarned += challengeXp;
    bonusXp += challengeXp;
    const existing = state.deckSessions[session.deckId];
    const currentCount = existing?.date === todayIso() ? Number(existing.count || 0) : 0;
    state.deckSessions[session.deckId] = { date: todayIso(), count: currentCount + 1 };
    state.dailyDeckStats.sessionsCompleted = Number(state.dailyDeckStats.sessionsCompleted || 0) + 1;
    if (!repeatedDeck) state.dailyDeckStats.fullSessions = Number(state.dailyDeckStats.fullSessions || 0) + 1;
    const nextReviewDate = session.cardIds
      .map((id) => state.cardSchedule[id]?.nextReview)
      .filter(Boolean)
      .sort()[0] || "";
    const completedAt = new Date().toISOString();
    const summary = {
      mode: mode.title,
      modeId: session.mode,
      cardsReviewed: processed,
      correct,
      wrong,
      scorePercent,
      xpEarned,
      deckXp,
      cardXp: Number(session.cardXp || 0),
      comboXp: Number(session.comboXp || 0),
      bonusXp,
      challengeXp,
      mistakesCreated: Number(session.mistakesCreated || 0) + autoMistakesCreated,
      matchTimeSeconds: session.mode === "match" ? matchElapsedSeconds(session) : null,
      matchTimed: Boolean(session.matchTimed),
      nextReviewDate,
      allDueFinished: session.dueCardIds?.length > 0 && session.dueCardIds.every((id) => reviewedIds.includes(id)),
      perfect: wrong === 0,
      repeatedDeck,
      recommendation: wrong > 0 ? "Fehler wiederholen" : "Noch eine Runde"
    };
    state.modeHistory = [
      { id: uid("mode"), deckId: session.deckId, deckTitle: session.deckTitle, modeId: session.mode, completedAt, ...summary },
      ...(state.modeHistory || [])
    ].slice(0, 120);
    state.deckSessionHistory = [
      { id: uid("deck-session"), deckId: session.deckId, deckTitle: session.deckTitle, optionId: session.optionId, completedAt, ...summary },
      ...(state.deckSessionHistory || [])
    ].slice(0, 80);
    state.cardStudySession = {
      ...state.cardStudySession,
      ...session,
      active: false,
      completed: true,
      deckXp,
      bonusXp,
      xpEarned,
      summary,
      completedAt
    };
    state.activeModeSession = { ...state.cardStudySession };
    state.ui.cardStudyIndex = 0;
    if (state.onboarding.awaitingFirstReview) {
      state.onboarding.awaitingFirstReview = false;
      state.onboarding.firstReviewCompleted = true;
      state.onboarding.valueMomentSeen = true;
      state.onboarding.completedAt = state.onboarding.completedAt || completedAt;
    }
    evaluateBadges();
    checkClassBonus();
  };
  const rateDeckSessionCard = (card, rating) => {
    const session = { ...state.cardStudySession };
    if (!session.active || !card || session.mode !== "cards") return;
    const wasDue = cardIsDue(card);
    scheduleCardReview(card, rating, { rewardCard: false, mistakeReward: false });
    const cardXp = awardCardReviewXp(card, wasDue);
    let combo = Number(session.combo || 0);
    let maxCombo = Number(session.maxCombo || 0);
    let comboXp = Number(session.comboXp || 0);
    let xpEarned = Number(session.xpEarned || 0) + cardXp;
    const comboAwards = Array.isArray(session.comboAwards) ? [...session.comboAwards] : [];
    let perfect = session.perfect !== false;
    if (rating === "again") {
      combo = 0;
      perfect = false;
    } else if (rating === "good" || rating === "easy") {
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      const threshold = [10, 5, 3].find((value) => combo >= value && !comboAwards.includes(value));
      if (threshold) {
        const reward = comboRewards[threshold] || 0;
        comboAwards.push(threshold);
        if (reward > 0) {
          awardXp(reward, "Combo");
          comboXp += reward;
          xpEarned += reward;
        }
      }
    }
    const reviewedIds = [...new Set([...(session.reviewedIds || []), card.id])];
    const ratings = [...(session.ratings || []), rating];
    const answers = [...(session.answers || [])];
    if (rating === "again" || rating === "hard") {
      answers.push({
        id: uid("answer"),
        cardId: card.id,
        subject: card.subject,
        question: card.question,
        correctAnswer: card.answer,
        userAnswer: rating === "again" ? "Nicht gewusst" : "Unsicher",
        correct: false,
        xp: cardXp,
        type: "cards",
        savedMistake: false
      });
    }
    state.cardStudySession = {
      ...state.cardStudySession,
      ...session,
      reviewedIds,
      ratings,
      answers,
      xpEarned,
      cardXp: Number(session.cardXp || 0) + cardXp,
      comboXp,
      combo,
      maxCombo,
      comboAwards,
      perfect
    };
    state.activeModeSession = { ...state.cardStudySession };
    if (reviewedIds.length >= Number(session.target || session.cardIds?.length || 0)) {
      completeDeckSession();
    } else {
      state.ui.cardStudyIndex = Math.min(Number(state.ui.cardStudyIndex || 0) + 1, Math.max(0, Number(session.cardIds?.length || 1) - 1));
    }
  };
  const rateCurrentStudyCard = (rating) => {
    const cards = activeStudyCards();
    const index = Math.min(Math.max(0, Number(state.ui.cardStudyIndex || 0)), Math.max(0, cards.length - 1));
    const card = cards[index];
    if (!card) return false;
    if (state.cardStudySession?.active && state.cardStudySession.mode === "cards") {
      rateDeckSessionCard(card, rating);
    } else {
      scheduleCardReview(card, rating, { rewardCard: true, mistakeReward: false });
      state.ui.cardStudyIndex = Math.min(index + 1, Math.max(0, cards.length - 1));
    }
    return true;
  };
  const pushModeAnswer = (answer) => {
    const session = { ...state.cardStudySession };
    const answers = [...(session.answers || []), answer];
    state.cardStudySession = {
      ...state.cardStudySession,
      ...session,
      answers,
      reviewedIds: [...new Set([...(session.reviewedIds || []), answer.cardId])],
      correct: Number(session.correct || 0) + (answer.correct ? 1 : 0),
      wrong: Number(session.wrong || 0) + (answer.correct ? 0 : 1),
      perfect: answer.correct ? session.perfect !== false : false,
      xpEarned: Number(session.xpEarned || 0) + Number(answer.xp || 0),
      cardXp: Number(session.cardXp || 0) + Number(answer.xp || 0),
      awaitingNext: true,
      lastResult: answer
    };
    state.activeModeSession = { ...state.cardStudySession };
  };
  const answerCurrentCard = (rawAnswer) => {
    const session = state.cardStudySession || {};
    const cards = activeStudyCards();
    const index = Math.min(Math.max(0, Number(state.ui.cardStudyIndex || 0)), Math.max(0, cards.length - 1));
    const card = cards[index];
    if (!session.active || !card || session.awaitingNext) return;
    const correct = answerMatches(rawAnswer, card.answer);
    setCardReviewOnly(card, correct ? "good" : "again");
    const xp = correct ? awardModeCardXp(card, 8, "Richtig geschrieben") : 0;
    if (!correct) recordCardReviewAction(1);
    pushModeAnswer({
      id: uid("answer"),
      cardId: card.id,
      subject: card.subject,
      question: card.question,
      correctAnswer: card.answer,
      userAnswer: rawAnswer,
      correct,
      xp,
      type: "write",
      savedMistake: false
    });
  };
  const answerChoiceCard = (selected) => {
    const session = state.cardStudySession || {};
    const cards = activeStudyCards();
    const index = Math.min(Math.max(0, Number(state.ui.cardStudyIndex || 0)), Math.max(0, cards.length - 1));
    const card = cards[index];
    if (!session.active || !card || session.awaitingNext) return;
    const correct = normalizeAnswerText(selected) === normalizeAnswerText(card.answer);
    setCardReviewOnly(card, correct ? "good" : "again");
    const xp = correct ? awardModeCardXp(card, 4, "Choice korrekt") : 0;
    if (!correct) recordCardReviewAction(1);
    pushModeAnswer({
      id: uid("answer"),
      cardId: card.id,
      subject: card.subject,
      question: card.question,
      correctAnswer: card.answer,
      userAnswer: selected,
      correct,
      xp,
      type: "choice",
      savedMistake: false
    });
  };
  const answerTestQuestion = (value) => {
    const session = state.cardStudySession || {};
    const cards = activeStudyCards();
    const index = Math.min(Math.max(0, Number(state.ui.cardStudyIndex || 0)), Math.max(0, cards.length - 1));
    const card = cards[index];
    const question = session.testQuestions?.[index] || { type: "write" };
    if (!session.active || !card || session.awaitingNext) return;
    const expected = testPromptFor(card, question).expected;
    const correct = question.type === "choice" ? normalizeAnswerText(value) === normalizeAnswerText(expected) : answerMatches(value, expected);
    setCardReviewOnly(card, correct ? "good" : "again");
    pushModeAnswer({
      id: uid("answer"),
      cardId: card.id,
      subject: card.subject,
      question: testPromptFor(card, question).prompt,
      correctAnswer: expected,
      userAnswer: value,
      correct,
      xp: 0,
      type: question.type,
      savedMistake: false
    });
  };
  const startConfiguredTest = (setup = {}) => {
    const session = state.cardStudySession || {};
    const cards = activeStudyCards();
    if (!session.active || session.mode !== "test" || !cards.length) return;
    const cleanSetup = {
      write: Boolean(setup.write),
      choice: Boolean(setup.choice),
      mixed: Boolean(setup.mixed),
      direction: ["front", "back", "both"].includes(setup.direction) ? setup.direction : "front"
    };
    if (!cleanSetup.write && !cleanSetup.choice && !cleanSetup.mixed) cleanSetup.mixed = true;
    if (cleanSetup.mixed) {
      cleanSetup.write = true;
      cleanSetup.choice = true;
    }
    state.cardStudySession = {
      ...session,
      testStarted: true,
      testSetup: cleanSetup,
      testQuestions: buildTestQuestions(cards, cleanSetup),
      answers: [],
      reviewedIds: [],
      awaitingNext: false,
      lastResult: null
    };
    state.activeModeSession = { ...state.cardStudySession };
  };
  const submitFullTest = (form) => {
    const session = state.cardStudySession || {};
    const cards = activeStudyCards();
    if (!session.active || session.mode !== "test" || !session.testStarted) return;
    const data = formData(form);
    const answers = cards.map((card, index) => {
      const question = session.testQuestions?.[index] || { type: "write", direction: "front" };
      const expected = testPromptFor(card, question).expected;
      const prompt = testPromptFor(card, question).prompt;
      const value = String(data[`answer-${index}`] || "").trim();
      const correct = question.type === "choice" ? normalizeAnswerText(value) === normalizeAnswerText(expected) : answerMatches(value, expected);
      setCardReviewOnly(card, correct ? "good" : "again");
      return {
        id: uid("answer"),
        cardId: card.id,
        subject: card.subject,
        question: prompt,
        correctAnswer: expected,
        userAnswer: value || "Keine Antwort",
        correct,
        explanation: question.explanation || "",
        xp: 0,
        type: question.type,
        savedMistake: false
      };
    });
    state.cardStudySession = {
      ...session,
      answers,
      reviewedIds: [...new Set(cards.map((card) => card.id))],
      correct: answers.filter((answer) => answer.correct).length,
      wrong: answers.filter((answer) => !answer.correct).length,
      perfect: answers.every((answer) => answer.correct),
      awaitingNext: false,
      lastResult: null
    };
    state.activeModeSession = { ...state.cardStudySession };
    completeDeckSession();
  };
  const advanceModeSession = () => {
    const session = state.cardStudySession || {};
    const cards = activeStudyCards();
    const index = Number(state.ui.cardStudyIndex || 0);
    const answered = session.mode === "match" ? Number(session.matchedIds?.length || 0) : (session.mode === "cards" ? Number(session.reviewedIds?.length || 0) : Number(session.answers?.length || 0));
    const isLast = index >= cards.length - 1 || answered >= Number(session.target || cards.length);
    if (isLast) {
      completeDeckSession();
      return;
    }
    state.cardStudySession = {
      ...session,
      awaitingNext: false,
      lastResult: null,
      currentAnswer: "",
      selectedChoice: ""
    };
    state.activeModeSession = { ...state.cardStudySession };
    state.ui.cardStudyIndex = Math.min(index + 1, Math.max(0, cards.length - 1));
  };
  const saveModeMistake = (answerIndex) => {
    const session = { ...state.cardStudySession };
    const answers = [...(session.answers || [])];
    const answer = answers[Number(answerIndex)];
    if (!answer || answer.savedMistake || answer.correct) return;
    saveMistake({
      subject: answer.subject || "Karten",
      topic: session.deckTitle || "Karten",
      question: answer.question,
      correctAnswer: answer.correctAnswer,
      userAnswer: answer.userAnswer || "Keine Antwort",
      explanation: `Aus dem Lernmodus ${learningModeOption(session.mode).title} gespeichert.`,
      source: `${learningModeOption(session.mode).title} · Karten`
    }, { reward: true });
    answer.savedMistake = true;
    answers[Number(answerIndex)] = answer;
    const mistakesCreated = Number(session.mistakesCreated || 0) + 1;
    state.cardStudySession = {
      ...state.cardStudySession,
      ...session,
      answers,
      mistakesCreated,
      lastResult: session.lastResult?.id === answer.id ? { ...session.lastResult, savedMistake: true } : session.lastResult,
      summary: session.summary ? { ...session.summary, mistakesCreated } : session.summary
    };
    state.activeModeSession = { ...state.cardStudySession };
  };

  const renderStack = (title, subtitle, count, kind, actionText, extra = "") => `
    <button class="quizlet-large-stack" data-stack="${kind}" ${extra} type="button">
      <div class="big-card-stack"><i></i><i></i><i></i></div>
      <strong>${C.escapeHtml(title)}</strong>
      <span>${C.escapeHtml(subtitle)}</span>
      <small>${count} Karten</small>
      <em>${actionText}</em>
    </button>
  `;

  const renderStudyCard = (card) => card ? `
    <button class="study-flashcard ${C.difficultyClass(card.difficulty)}" type="button">
      <span class="flip-hint">Tippen zum Umdrehen</span>
      <div class="study-flashcard-inner">
        <div class="study-flashcard-face front">
          <small>${C.escapeHtml(card.subject)}</small>
          <h2>${C.escapeHtml(card.question)}</h2>
        </div>
        <div class="study-flashcard-face back">
          <small>Lösung</small>
          <h2>${C.escapeHtml(card.answer)}</h2>
        </div>
      </div>
    </button>
  ` : C.emptyState("Keine Karte", "Lade einen Stapel oder erstelle deine erste Karte.");
  const modeIcon = (mode) => ({
    cards: `<span class="mode-symbol mode-symbol-cards" aria-hidden="true"><i></i><i></i><b></b></span>`,
    learn: `<span class="mode-symbol mode-symbol-learn" aria-hidden="true"><i></i><b></b></span>`,
    write: `<span class="mode-symbol mode-symbol-write" aria-hidden="true"><i></i><b></b></span>`,
    choice: `<span class="mode-symbol mode-symbol-choice" aria-hidden="true"><i></i><b></b></span>`,
    test: `<span class="mode-symbol mode-symbol-test" aria-hidden="true"><i></i><b></b></span>`,
    match: `<span class="mode-symbol mode-symbol-match" aria-hidden="true"><i></i><i></i><b></b></span>`
  })[mode] || `<span class="mode-symbol mode-symbol-cards" aria-hidden="true"><i></i><i></i><b></b></span>`;

  const renderDeckSessionChoice = () => {
    const meta = currentDeckMeta();
    const deckCards = baseStudyCards();
    const dueInDeck = deckCards.filter(cardIsDue).length;
    const isDueDeck = state.ui.cardStudyMode === "due";
    return `
      ${isDueDeck ? `
        <section class="section-heading deck-choice-heading">
          <span>Karten</span>
          <div class="deck-choice-title-row">
            <button class="mistake-back-link close-study-view" type="button" aria-label="Zurück zur Kartenübersicht">&lt;</button>
            <h1>${C.escapeHtml(meta.title)}</h1>
          </div>
        </section>
      ` : C.sectionTitle("Karten", meta.title)}
      <section class="deck-session-choice card-study-view">
        <div class="study-view-header ${isDueDeck ? "due-study-header" : ""}">
          ${isDueDeck ? "" : `<button class="secondary-button close-study-view" type="button">Zurück</button>`}
          <strong>${C.escapeHtml(meta.subtitle)}</strong>
        </div>
        <article class="session-progress-card">
          ${C.mascot("mascot-small")}
          <div>
            <span class="eyebrow">Lernmodus wählen</span>
            <h2>${C.escapeHtml(meta.title)}</h2>
            <p>${dueInDeck ? `${dueInDeck} Karten sind heute fällig.` : `${deckCards.length} Karten können freiwillig wiederholt werden.`} Wähle, wie du jetzt lernen willst.</p>
          </div>
        </article>
        <div class="learning-mode-grid">
          ${learningModeOptions.map((option) => {
            const cards = cardsForLearningMode(option.id);
            const reward = deckModeRewardToday(meta.id, option.id);
            const disabled = option.id === "match" ? cards.length < 2 : cards.length < 1;
            return `
              <button class="learning-mode-card start-deck-session ${disabled ? "disabled" : ""}" data-mode="${option.id}" type="button" ${disabled ? "disabled" : ""} aria-label="${option.title} starten, ${option.duration}, XP ${option.xp}">
                ${modeIcon(option.id)}
                <span>${C.escapeHtml(option.title)}</span>
                <small>${C.escapeHtml(option.duration)} · XP ${C.escapeHtml(option.xp)} · ${C.escapeHtml(option.difficulty)}</small>
                <em>${reward ? "Übungsbonus" : `${cards.length} bereit`}</em>
              </button>
            `;
          }).join("")}
        </div>
        <p class="panel-note">XP gibt es nur für echte Antworten, Bewertungen und abgeschlossene Runden. Öffnen oder Umdrehen zählt nicht.</p>
      </section>
    `;
  };
  const renderTestSetup = (cards) => {
    const meta = currentDeckMeta();
    const labels = deckLanguageLabels(meta, cards);
    return `
      <section class="test-setup-panel">
        <article class="session-progress-card">
          ${C.mascot("mascot-small")}
          <div>
            <span class="eyebrow">Test vorbereiten</span>
            <h2>${C.escapeHtml(meta.title)}</h2>
            <p>Wähle, wie Lynxly dich abfragen soll. Die Auswertung siehst du erst am Schluss.</p>
          </div>
        </article>
        <form id="test-setup-form" class="test-setup-form">
          <fieldset>
            <legend>Frage-Arten</legend>
            <label class="toggle-field"><input name="write" type="checkbox" checked /><span>Schreiben</span></label>
            <label class="toggle-field"><input name="choice" type="checkbox" checked /><span>Multiple Choice</span></label>
            <label class="toggle-field"><input name="mixed" type="checkbox" checked /><span>Gemischt</span></label>
          </fieldset>
          <fieldset>
            <legend>Abfragerichtung</legend>
            <label class="test-direction-option"><input name="direction" type="radio" value="front" checked /><span>${C.escapeHtml(labels.front)} → ${C.escapeHtml(labels.back)}</span></label>
            <label class="test-direction-option"><input name="direction" type="radio" value="back" /><span>${C.escapeHtml(labels.back)} → ${C.escapeHtml(labels.front)}</span></label>
            <label class="test-direction-option"><input name="direction" type="radio" value="both" /><span>Beide Richtungen</span></label>
          </fieldset>
          <button class="primary-button" type="submit">Test starten</button>
        </form>
      </section>
    `;
  };
  const renderTestQuestionList = (cards) => {
    const session = state.cardStudySession || {};
    return `
      <form id="test-list-form" class="test-list-form">
        ${cards.map((card, index) => {
          const question = session.testQuestions?.[index] || { type: "write", direction: "front", options: [] };
          const prompt = testPromptFor(card, question).prompt;
          return `
            <article class="test-list-question">
              <span>${index + 1}</span>
              <div>
                <strong>${C.escapeHtml(prompt)}</strong>
                <small>${question.type === "choice" ? "Multiple Choice" : "Schreiben"}</small>
                ${question.type === "choice" ? `
                  <div class="test-choice-list">
                    ${(question.options || []).map((option, optionIndex) => `
                      <label>
                        <input name="answer-${index}" type="radio" value="${C.escapeHtml(option)}" ${optionIndex === 0 ? "" : ""} />
                        <span>${C.escapeHtml(option)}</span>
                      </label>
                    `).join("")}
                  </div>
                ` : `<input name="answer-${index}" autocomplete="off" placeholder="Antwort eingeben" />`}
              </div>
            </article>
          `;
        }).join("")}
        <button class="primary-button test-submit-button" type="submit">Test abgeben</button>
      </form>
    `;
  };
  const matchClassComparison = (ownSeconds, ownMistakes = 0) => {
    const own = Math.max(0, Number(ownSeconds || 0));
    const classmates = (state.classLeague?.classmates || []).slice(0, 4);
    const fallbackNames = ["Mia", "Leo", "Nora", "Sam"];
    const demo = (classmates.length ? classmates : fallbackNames.map((displayName) => ({ displayName }))).map((classmate, index) => ({
      name: classmate.displayName || classmate.name || fallbackNames[index],
      seconds: Math.max(18, own + [-8, 5, 14, 22][index]),
      mistakes: [1, 2, 3, 4][index]
    }));
    return [...demo, { name: "Du", seconds: own, mistakes: Number(ownMistakes || 0), you: true }]
      .sort((a, b) => a.seconds - b.seconds)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  };
  const renderMatchTimeTable = (summary) => {
    if (!summary.matchTimed || !Number.isFinite(Number(summary.matchTimeSeconds))) return "";
    const rows = matchClassComparison(summary.matchTimeSeconds, summary.wrong);
    return `
      <section class="match-time-results">
        <div class="sleek-section-title"><h2>Zeitvergleich</h2><span>Demo-Klasse · lokal</span></div>
        <table>
          <thead><tr><th>Rang</th><th>Name</th><th>Zeit</th><th>Fehler</th></tr></thead>
          <tbody>
            ${rows.map((row) => `<tr class="${row.you ? "you" : ""}"><td>${row.rank}</td><td>${C.escapeHtml(row.name)}</td><td>${formatStopwatch(row.seconds)}</td><td>${row.mistakes}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>
    `;
  };
  const renderTestResultChart = (summary) => {
    if (summary.modeId !== "test") return "";
    const correct = Number(summary.correct || 0);
    const wrong = Number(summary.wrong || 0);
    const total = Math.max(1, correct + wrong);
    const percent = Math.round((correct / total) * 100);
    return `
      <section class="test-result-chart">
        <div class="pie-chart" style="--correct:${percent}%"><strong>${percent}%</strong><span>richtig</span></div>
        <div>
          <span class="eyebrow">Test-Auswertung</span>
          <h2>${correct} richtig · ${wrong} falsch</h2>
          <p>Grün zeigt richtige Antworten, rot zeigt Fehler. Falsche Antworten kannst du unten in die Fehlerbank übernehmen.</p>
        </div>
      </section>
    `;
  };
  const renderDeckSessionSummary = () => {
    const session = state.cardStudySession || {};
    const summary = session.summary || {};
    const progress = levelProgress();
    const wrongAnswers = (session.answers || []).map((answer, index) => ({ ...answer, index })).filter((answer) => !answer.correct);
    const firstReviewMoment = Boolean(state.onboarding.firstReviewCompleted && state.onboarding.valueMomentSeen);
    const showTrialPrompt = plusTrialPromptReady(summary);
    const total = Math.max(1, Number(summary.cardsReviewed || 0));
    const correct = Number(summary.correct || 0);
    const wrong = Number(summary.wrong || 0);
    const scoreLine = summary.modeId === "cards"
      ? `${Number(summary.cardsReviewed || 0)} Karten bearbeitet`
      : `${correct} von ${total} richtig`;
    const weakCount = Math.max(wrong, Number(summary.mistakesCreated || 0));
    const weakLine = weakCount
      ? `${weakCount} ${weakCount === 1 ? "Thema" : "Themen"} solltest du nochmals üben`
      : "Alles aus dieser Runde sitzt schon gut.";
    const primaryAction = weakCount
      ? `<a class="primary-button" href="#mistakes">${weakCount} Fehler wiederholen</a>`
      : `<button class="primary-button start-more-cards" data-mode="${C.escapeHtml(session.mode || "cards")}" type="button">Weiteres Set lernen</button>`;
    const secondaryStudyAction = weakCount
      ? `<button class="secondary-button start-more-cards" data-mode="${C.escapeHtml(session.mode || "cards")}" type="button">Weiteres Set lernen</button>`
      : "";
    return `
      ${C.sectionTitle("Karten", firstReviewMoment ? "Erste Runde geschafft" : "Zusammenfassung")}
      <section class="session-summary-card card-study-view">
        <div class="study-view-header">
          <button class="secondary-button close-study-view" type="button">Zurück</button>
          <strong>${C.escapeHtml(summary.mode || session.deckTitle || "Stapel")}</strong>
        </div>
        <article class="session-result-clean" aria-live="polite">
          <div class="session-result-hero">
            ${C.mascot("mascot-small")}
            <div>
              <span>${C.escapeHtml(session.deckTitle || "Stapel")}</span>
              <h2>Stark gemacht</h2>
              <p>${C.escapeHtml(scoreLine)}</p>
            </div>
          </div>
          <div class="session-result-metrics">
            <article><span>Noch üben</span><strong>${weakCount}</strong><small>${C.escapeHtml(weakLine)}</small></article>
            <article><span>Belohnung</span><strong>+${Number(summary.xpEarned || 0)} XP</strong><small>${summary.repeatedDeck ? "reduzierter Bonus" : "Fortschritt gespeichert"}</small></article>
          </div>
          <div class="continue-actions compact">
            ${primaryAction}
            ${secondaryStudyAction}
            <button class="secondary-button close-study-view" type="button">Übersicht</button>
          </div>
        </article>
        <details class="session-details">
          <summary>Sitzungsdetails</summary>
          <div class="session-summary-grid">
            <article><span>Bearbeitet</span><strong>${Number(summary.cardsReviewed || 0)}</strong></article>
            <article><span>Richtig</span><strong>${Number(summary.correct || 0)}</strong></article>
            <article><span>Falsch</span><strong>${Number(summary.wrong || 0)}</strong></article>
            <article><span>Score</span><strong>${Number(summary.scorePercent || 0)}%</strong></article>
            <article><span>Karten-XP</span><strong>${Number(summary.cardXp || 0)}</strong></article>
            <article><span>Bonus-XP</span><strong>${Number(summary.bonusXp || 0)}</strong></article>
            <article><span>Fehler gespeichert</span><strong>${Number(summary.mistakesCreated || 0)}</strong></article>
            <article><span>Review-Datum</span><strong>${summary.nextReviewDate ? formatDate(summary.nextReviewDate, { day: "2-digit", month: "short" }) : "Noch offen"}</strong></article>
          </div>
          ${renderTestResultChart(summary)}
          ${renderMatchTimeTable(summary)}
          ${wrongAnswers.length ? `<section class="wrong-answer-list"><h2>Fehler aus dieser Runde</h2>${wrongAnswers.map((answer) => `<article><strong>${C.escapeHtml(answer.question)}</strong><p>Deine Antwort: ${C.escapeHtml(answer.userAnswer || "Keine Antwort")}</p><p>Richtig: ${C.escapeHtml(answer.correctAnswer)}</p><button class="secondary-button save-mode-mistake" data-answer-index="${answer.index}" type="button" ${answer.savedMistake ? "disabled" : ""}>${answer.savedMistake ? "Gespeichert" : "In Fehlerbank speichern"}</button></article>`).join("")}</section>` : ""}
          <div class="session-summary-line"><span>Nächste Empfehlung</span><strong>${C.escapeHtml(summary.recommendation || "Noch eine Runde")}</strong></div>
          <div class="session-summary-line"><span>Bis ${C.escapeHtml(progress.next?.title || "Max Level")}</span><strong>${progress.remaining} XP</strong></div>
          ${progressBar(Number(state.xpTotal || 0) - progress.current.min, progress.end - progress.current.min, `Fortschritt bis ${progress.next ? progress.next.title : "Maximalziel"}`, "large")}
        </details>
      </section>
      ${showTrialPrompt ? `
        <div class="trial-bottom-sheet" role="dialog" aria-modal="false" aria-labelledby="trial-sheet-title">
          <div>
            <span>Plus Vorschau</span>
            <h2 id="trial-sheet-title">Spare Zeit bei der Prüfungsvorbereitung</h2>
            <p>Verwandle Notizen in Lernkarten, erhalte einen persönlichen Lernplan und verständliche Erklärungen zu deinen Fehlern.</p>
          </div>
          <div class="continue-actions compact">
            <button class="primary-button start-plus-trial" type="button">Plus 7 Tage kostenlos testen</button>
            <button class="secondary-button dismiss-plus-trial" type="button">Nicht jetzt</button>
          </div>
        </div>
      ` : ""}
    `;
  };
  const renderModeFeedback = (result, isLast) => result ? `
    <div class="mode-feedback ${result.correct ? "correct" : "wrong"}" aria-live="polite">
      <strong>${result.correct ? `Richtig! +${Number(result.xp || 0)} XP` : `Falsch. Richtige Antwort: ${C.escapeHtml(result.correctAnswer)}`}</strong>
      ${!result.correct ? `<button class="secondary-button save-mode-mistake" data-answer-index="${Math.max(0, (state.cardStudySession.answers || []).length - 1)}" type="button" ${result.savedMistake ? "disabled" : ""}>${result.savedMistake ? "In Fehlerbank gespeichert" : "In Fehlerbank speichern"}</button>` : ""}
      <button class="primary-button mode-next-card" type="button">${isLast ? "Zusammenfassung" : "Weiter"}</button>
    </div>
  ` : "";
  const renderWriteMode = (card, index, cards) => {
    const session = state.cardStudySession || {};
    const isLast = index >= cards.length - 1;
    return `
      <article class="mode-question-card">
        <small>${C.escapeHtml(card.subject)}</small>
        <h2>${C.escapeHtml(card.question)}</h2>
      </article>
      <form class="mode-answer-form" data-mode="write">
        <label>Antwort eingeben<input name="answer" autocomplete="off" ${session.awaitingNext ? "disabled" : ""} placeholder="Deine Antwort" /></label>
        <button class="primary-button" type="submit" ${session.awaitingNext ? "disabled" : ""}>Prüfen</button>
      </form>
      ${renderModeFeedback(session.lastResult, isLast)}
    `;
  };
  const renderChoiceMode = (card, index, cards) => {
    const session = state.cardStudySession || {};
    const options = session.mode === "test" || session.mode === "learn"
      ? (session.testQuestions?.[index]?.options || choiceOptionsForCard(card))
      : choiceOptionsForCard(card);
    const isLast = index >= cards.length - 1;
    return `
      <article class="mode-question-card">
        <small>${C.escapeHtml(card.subject)}</small>
        <h2>${C.escapeHtml(card.question)}</h2>
      </article>
      <div class="choice-grid" role="group" aria-label="Antwortmöglichkeiten">
        ${options.map((option) => `<button class="choice-option" data-answer="${C.escapeHtml(option)}" type="button" ${session.awaitingNext ? "disabled" : ""}>${C.escapeHtml(option)}</button>`).join("")}
      </div>
      ${renderModeFeedback(session.lastResult, isLast)}
    `;
  };
  const renderTestMode = (card, index, cards) => {
    const question = state.cardStudySession.testQuestions?.[index] || { type: "write" };
    return `
      <div class="mode-tag-row"><span>${question.type === "choice" ? "Choice-Frage" : "Schreib-Frage"}</span><strong>${index + 1} / ${cards.length}</strong></div>
      ${question.type === "choice" ? renderChoiceMode(card, index, cards) : renderWriteMode(card, index, cards)}
    `;
  };
  const renderMatchMode = () => {
    const session = state.cardStudySession || {};
    const pairs = session.matchPairs || [];
    const pairMap = new Map(pairs.map((pair) => [pair.id, pair]));
    const matched = new Set(session.matchedIds || []);
    const wrongTiles = new Set(session.lastWrongTileIds || []);
    const order = (session.matchTileOrder?.length ? session.matchTileOrder : shuffleList(pairs.flatMap((pair) => [matchTileId("q", pair.id), matchTileId("a", pair.id)])));
    return `
      ${session.matchTimed ? `
        <article class="match-stopwatch" aria-label="Stoppuhr ${formatStopwatch(matchElapsedSeconds(session))}, ${matched.size} von ${pairs.length} Paaren">
          <span>${matched.size} / ${pairs.length} Paare</span>
          <strong>${formatStopwatch(matchElapsedSeconds(session))}</strong>
          <small>${Number(session.matchPenaltySeconds || 0) ? `+${Number(session.matchPenaltySeconds || 0)} Strafsek.` : "Fehler: +1 Sekunde"}</small>
        </article>
      ` : `
        <div class="match-untimed-status">
          <span>Heute fällig · ohne Zeitwertung</span>
          <strong>${matched.size} / ${pairs.length}</strong>
        </div>
      `}
      <div class="match-grid-board" aria-label="Zuordnungsgrid">
        ${order.filter((tileId) => !matched.has(parseMatchTileId(tileId).pairId)).map((tileId) => {
          const parsed = parseMatchTileId(tileId);
          const pair = pairMap.get(parsed.pairId);
          const text = parsed.side === "q" ? pair?.question : pair?.answer;
          const selected = session.selectedMatchTileId === tileId;
          return `<button class="match-grid-tile mode-match-tile ${selected ? "selected" : ""} ${wrongTiles.has(tileId) ? "wrong" : ""}" data-tile-id="${C.escapeHtml(tileId)}" type="button">${C.escapeHtml(text || "")}</button>`;
        }).join("")}
      </div>
      ${session.lastResult ? `<div class="mode-feedback ${session.lastResult.correct ? "correct" : "wrong"}" aria-live="polite"><strong>${session.lastResult.correct ? "Passt!" : "Noch nicht. Versuch ein anderes Paar."}</strong></div>` : ""}
    `;
  };
  const renderCardStudyView = () => {
    const session = state.cardStudySession || {};
    if (session.completed) return renderDeckSessionSummary();
    if (!session.active) return renderDeckSessionChoice();
    const cards = activeStudyCards();
    const index = Math.min(Math.max(0, Number(state.ui.cardStudyIndex || 0)), Math.max(0, cards.length - 1));
    const card = cards[index];
    const meta = currentDeckMeta();
    const mode = learningModeOption(session.mode);
    const reviewed = Number(session.reviewedIds?.length || 0);
    return `
      ${C.sectionTitle("Lernkarten", mode.title)}
      <section class="flashcard-study-area card-study-view">
        <div class="study-view-header">
          <button class="secondary-button close-study-view" type="button">Zurück</button>
          <strong>${cards.length ? `${index + 1} / ${cards.length}` : "0 / 0"}</strong>
        </div>
        <article class="session-mini-status">
          <span>${C.escapeHtml(meta.title)}</span><strong>${reviewed || session.answers?.length || session.matchedIds?.length || 0} / ${Number(session.target || cards.length)}</strong>
          <span>Modus</span><strong>${C.escapeHtml(mode.title)}</strong>
          <span>XP</span><strong>${Number(session.xpEarned || 0)}</strong>
        </article>
        ${session.mode === "cards" ? `${renderStudyCard(card)}
          <div class="study-nav-row">
            <button class="icon-button study-prev" type="button" ${index <= 0 ? "disabled" : ""} title="Vorherige Karte" aria-label="Vorherige Karte">&#8592;</button>
            <span>${card ? C.escapeHtml(card.subject) : "Keine Karten"}</span>
            <button class="icon-button study-next" type="button" ${index >= cards.length - 1 ? "disabled" : ""} title="Nächste Karte" aria-label="Nächste Karte">&#8594;</button>
          </div>
          ${card ? `<div class="srs-rating-grid">
            <button class="srs-rating again" data-rating="again" type="button"><kbd>1</kbd>Nochmal</button>
            <button class="srs-rating hard" data-rating="hard" type="button"><kbd>2</kbd>Schwer</button>
            <button class="srs-rating good" data-rating="good" type="button"><kbd>3</kbd>Gut</button>
            <button class="srs-rating easy" data-rating="easy" type="button"><kbd>4</kbd>Einfach</button>
          </div>` : ""}` : ""}
        ${session.mode === "write" && card ? renderWriteMode(card, index, cards) : ""}
        ${session.mode === "choice" && card ? renderChoiceMode(card, index, cards) : ""}
        ${session.mode === "learn" && card ? renderTestMode(card, index, cards) : ""}
        ${session.mode === "test" ? (session.testStarted ? renderTestQuestionList(cards) : renderTestSetup(cards)) : ""}
        ${session.mode === "match" ? renderMatchMode() : ""}
      </section>
    `;
  };

  const studyCardTypes = [
    { id: "vocabulary", title: "Vokabeln", text: "Wort, Übersetzung und Beispielsatz", icon: "language" },
    { id: "topic", title: "Schulthema", text: "Frage und Antwort zu jedem Fach", icon: "book" },
    { id: "test", title: "Prüfung", text: "Karten mit einer Prüfung verbinden", icon: "target" },
    { id: "mistake", title: "Fehlertraining", text: "Fehler erklären und später wiederholen", icon: "refresh" },
    { id: "custom", title: "Individuell", text: "Freie Frage-und-Antwort-Karte", icon: "cards" }
  ];
  const renderStudyCardForm = () => {
    const type = state.ui.cardDeckType || "custom";
    const commonSubject = `<label>Fach<input name="subject" required /></label>`;
    const difficulty = `<label>Schwierigkeit<select name="difficulty"><option value="1">Leicht</option><option value="2" selected>Mittel</option><option value="3">Schwer</option></select></label>`;
    const forms = {
      vocabulary: `${commonSubject}<label>Stapelname<input name="deckTitle" required /></label><label>Wort<input name="question" required /></label><label>Übersetzung<input name="answer" required /></label><label>Beispielsatz<textarea name="exampleSentence" rows="2"></textarea></label><label>Aussprache-Hinweis<input name="pronunciation" /></label><label class="toggle-row"><input name="reverse" type="checkbox" /><span>Auch rückwärts lernen</span></label>${difficulty}`,
      topic: `${commonSubject}<label>Thema<input name="topic" required /></label><label>Frage<textarea name="question" required rows="3"></textarea></label><label>Antwort<textarea name="answer" required rows="3"></textarea></label>${difficulty}`,
      test: `${commonSubject}<label>Verknüpfte Prüfung<select name="linkedTestId"><option value="">Keine Prüfung</option>${state.exams.map((exam) => `<option value="${C.escapeHtml(exam.id)}">${C.escapeHtml(exam.subject)} · ${C.escapeHtml(exam.title)} · ${formatDate(exam.date)}</option>`).join("")}</select></label><label>Thema<input name="topic" /></label><label>Prüfungsfrage<textarea name="question" required rows="3"></textarea></label><label>Lösung<textarea name="answer" required rows="3"></textarea></label><label class="toggle-row"><input name="priority" type="checkbox" /><span>Als Prioritätskarte markieren</span></label>${difficulty}`,
      mistake: `${commonSubject}<label>Thema<input name="topic" /></label><label>Mein Fehler<textarea name="question" required rows="3"></textarea></label><label>Richtige Lösung<textarea name="answer" required rows="3"></textarea></label><label>Erklärung<textarea name="explanation" rows="3"></textarea></label><label class="toggle-row"><input name="repeatLater" type="checkbox" checked /><span>Später erneut zeigen</span></label>${difficulty}`,
      custom: `<label>Stapelname / Fach<input name="subject" required /></label><label>Thema <small>optional</small><input name="topic" /></label><label>Frage<textarea name="question" required rows="3"></textarea></label><label>Antwort<textarea name="answer" required rows="3"></textarea></label>${difficulty}`
    };
    return `<form class="panel form-panel study-card-form" id="card-form"><div class="study-card-form-heading"><span>${C.escapeHtml(studyCardTypes.find((item) => item.id === type)?.title || "Individuell")}</span><p>Diese Angaben helfen Lynxly, die Karte später passend vorzuschlagen.</p></div>${forms[type] || forms.custom}<div class="study-card-form-actions"><button class="primary-button" type="submit">Lernkarte speichern</button><button class="secondary-button" data-next-card="true" type="submit">Speichern und weitere Karte</button></div></form>`;
  };
  const renderCardCreatePanel = () => `
    ${C.sectionTitle("Study Cards", "Deck erstellen")}
    <section class="create-card-sheet standalone-create show">
      <div class="create-sheet-header">
        <strong>1. Typ wählen · 2. Karten hinzufügen · 3. Lernen starten</strong>
        <button class="icon-button close-card-create" type="button" title="Schließen" aria-label="Karten-Erstellung schließen">×</button>
      </div>
      <div class="create-options">
        <button class="secondary-button choose-card-mode" data-mode="ai" type="button">${C.icon("camera")} Mit KI ${isPlus() ? "" : "· Plus"}</button>
        <button class="secondary-button choose-card-mode" data-mode="self" type="button">${C.icon("add")} Selbst</button>
      </div>
      ${state.ui.cardCreateMode === "ai" ? (isPlus() ? `<div class="panel photo-card-panel"><h2>KI-Karten Generator</h2><p class="panel-note">Plus und Pro bekommen KI-Karten. Foto-zu-Karten ist ein Pro-Feature und kommt bald.</p>${state.ui.lastPhotoName ? `<div class="empty-state mascot-empty">${C.mascot("mascot-small")}<div><strong>Ausgewählt: ${C.escapeHtml(state.ui.lastPhotoName)}</strong><p>OCR und automatische Kartenerstellung sind noch nicht aktiv.</p></div></div>` : ""}<label>Fach<input id="photo-card-subject" placeholder="z. B. Französisch" /></label><label class="upload-tile ${isPro() ? "" : "locked-upload"}">${C.icon("camera")} Foto auswählen (${isPro() ? "kommt bald" : "Pro"})<input id="photo-card-input" type="file" accept="image/*" capture="environment" ${isPro() ? "" : "disabled"} /></label></div>` : `<div class="panel locked-feature"><h2>KI-Karten sind Plus</h2><p class="panel-note">Free bleibt für eigene Karten nutzbar. Upgrade auf Plus, wenn Lynxly Karten automatisch vorbereiten soll.</p><a class="primary-button" href="#premium">Pläne ansehen</a></div>`) : ""}
      ${state.ui.cardCreateMode === "self" ? `<div class="study-card-type-grid" aria-label="Art des Kartenstapels">${studyCardTypes.map((item) => `<button class="study-card-type ${state.ui.cardDeckType === item.id ? "active" : ""}" data-card-type="${item.id}" type="button">${C.icon(item.icon)}<strong>${C.escapeHtml(item.title)}</strong><small>${C.escapeHtml(item.text)}</small></button>`).join("")}</div>${renderStudyCardForm()}<div class="study-card-after-actions"><a class="secondary-button" href="#cards">Wiederholung starten</a><a class="secondary-button" href="#bot">Mit KI erstellen</a></div>` : ""}
    </section>
  `;
  const recentDeckAttrs = (entry) => {
    const deckId = String(entry?.deckId || "");
    if (deckId === "due") return `data-stack="due"`;
    if (deckId.startsWith("personal:")) return `data-stack="personal" data-subject="${C.escapeHtml(deckId.slice("personal:".length) || entry.deckTitle || "")}"`;
    if (deckId.startsWith("recommended:")) return `data-stack="library" data-pack-id="${C.escapeHtml(deckId.slice("recommended:".length))}"`;
    return `data-stack="personal" data-subject="${C.escapeHtml(entry?.deckTitle || "")}"`;
  };
  const renderRecentDeck = () => {
    const recent = (state.deckSessionHistory || [])[0];
    if (!recent) return "";
    return `
      <section class="recent-deck-section">
          <div class="sleek-section-title cards-recent-title"><h2>Zuletzt genutzt</h2><span>${C.escapeHtml(recent.mode || learningModeOption(recent.modeId).title)}</span></div>
        <button class="recent-deck-row" ${recentDeckAttrs(recent)} type="button">
          <div class="mini-deck-stack"><i></i><i></i><i></i></div>
          <div>
            <strong>${C.escapeHtml(recent.deckTitle || "Letzter Stapel")}</strong>
            <small>${C.escapeHtml(recent.mode || learningModeOption(recent.modeId).title)} · ${Number(recent.cardsReviewed || 0)} Karten · ${Number(recent.scorePercent || 0)}%</small>
          </div>
          <em>Öffnen</em>
        </button>
      </section>
    `;
  };
  const renderStudyHub = () => {
    const due = pendingDueCards().length;
    const mistakes = openMistakes().length;
    const recent = lastStudySession();
    const hasPersonal = personalCards().length > 0;
    const title = recent?.deckTitle || (due ? "Heute fällige Karten" : "AI Study Set erstellen");
    const subtitle = due
      ? `${due} Karte${due === 1 ? "" : "n"} warten auf eine kurze Wiederholung.`
      : (hasPersonal ? "Wähle einen Stapel oder starte dort weiter, wo du aufgehört hast." : "Lade Notizen hoch und Lynxly erstellt daraus dein erstes Study Set.");
    return `
      <section class="study-hub-card">
        <div>
          <span>${isGermanProfile() ? "Lernfluss" : "Study flow"}</span>
          <h2>${C.escapeHtml(title)}</h2>
          <p>${C.escapeHtml(subtitle)}</p>
          <div class="study-hub-metrics">
            <em>${due} fällig</em>
            <em>${mistakes} Fehler</em>
            <em>${Number(state.xpThisWeek || 0)} XP</em>
          </div>
        </div>
        <div class="study-hub-actions">
          <button class="primary-button continue-study-button" type="button">${isGermanProfile() ? "Weiterlernen" : "Continue Study"}</button>
          <button class="secondary-button choose-study-mode-button" type="button">${isGermanProfile() ? "Modus wählen" : "Choose mode"}</button>
          <a class="secondary-button" href="#bot">${isGermanProfile() ? "Notizen hochladen" : "Upload notes"}</a>
        </div>
      </section>
    `;
  };

  const renderCards = () => {
    if (state.ui.cardStudyOpen) return renderCardStudyView();
    if (state.ui.cardCreateOpen) return renderCardCreatePanel();
    const dueCount = dueCards().length;
    const mistakeCount = openMistakes().length;
    const query = String(state.ui.cardSearch || "").trim();
    const queryLower = query.toLowerCase();
    const libraryResults = query ? filteredLibrary().slice(0, 6) : [];
    const personalResults = query
      ? personalDecks().filter((deck) => [deck.title, deck.subject].join(" ").toLowerCase().includes(queryLower)).slice(0, 6)
      : [];
    return `
      <section class="cards-page sleek-screen">
        <div class="grade-page-header cards-page-header">
          <h1>Lernkarten</h1>
          <button class="round-add cards-header-add" id="toggle-card-create" type="button" aria-label="Study Card hinzufügen">+</button>
        </div>
      ${renderStudyHub()}
      <label class="cards-search-shell" for="card-search">
        ${C.icon("search")}
        <input id="card-search" type="search" value="${C.escapeHtml(state.ui.cardSearch || "")}" placeholder="Kärtchen oder Stapel suchen" autocomplete="off" />
      </label>
      ${query ? `
        <section class="card-search-results" aria-label="Suchergebnisse für Karten">
          <div class="sleek-section-title"><h2>Gefunden</h2><span>${libraryResults.length + personalResults.length}</span></div>
          ${libraryResults.map((pack) => `
            <button class="search-deck-row" data-stack="library" data-pack-id="${C.escapeHtml(pack.id)}" type="button">
              <div class="mini-deck-stack database"><i></i><i></i><i></i></div>
              <div><strong>${C.escapeHtml(pack.title)}</strong><small>${C.escapeHtml(pack.subject)} · Lynxly Datenbank · ${Math.min(isPlus() ? pack.cards.length : pack.freeCount || pack.cards.length, pack.cards.length)} Karten</small></div>
              <em>Öffnen</em>
            </button>
          `).join("")}
          ${personalResults.map((deck) => `
            <button class="search-deck-row" data-stack="personal" data-subject="${C.escapeHtml(deck.title)}" type="button">
              <div class="mini-deck-stack"><i></i><i></i><i></i></div>
              <div><strong>${C.escapeHtml(deck.title)}</strong><small>${C.escapeHtml(deck.subject)} · persönlicher Stapel</small></div>
              <em>${deck.cards.length}</em>
            </button>
          `).join("")}
          ${libraryResults.length + personalResults.length ? "" : C.emptyState("Keine Karten gefunden", "Versuche z. B. Französisch, Biologie oder den Namen deines Stapels.")}
        </section>
      ` : ""}
      <section class="card-stack-board cards-main-stacks">
        ${renderStack("Heute fällig", "Spaced Repetition", dueCount, "due", dueCount ? "Starten" : "Leer")}
        ${renderStack("Fehlerbank", "Offene Fehler wiederholen", mistakeCount, "mistakes", "Öffnen")}
      </section>
      ${!personalCards().length && !query ? `
        <section class="first-study-path">
          ${C.mascot("mascot-small")}
          <div>
            <strong>Erstes Lernset erstellen</strong>
            <p>Lade Notizen hoch. Lynxly macht daraus Karten, Quizfragen und einen kleinen Plan.</p>
          </div>
          <a class="primary-button" href="#bot">Notizen hochladen</a>
        </section>
      ` : ""}
      ${renderRecentDeck()}
      </section>
    `;
  };

  const renderMistakes = () => {
    const filter = state.ui.mistakeFilter || "open";
    const mistakes = state.mistakes.filter((mistake) => {
      if (filter === "fixed") return mistake.reviewStatus === "fixed";
      if (filter === "all") return true;
      return mistake.reviewStatus !== "fixed";
    });
    const weakTopics = [...openMistakes().reduce((map, mistake) => {
      const key = `${mistake.subject || "Allgemein"} · ${mistake.topic || "Allgemein"}`;
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map())]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return `
      <section class="mistake-page">
        <div class="mistake-header">
          <div class="mistake-title-block">
            <span class="eyebrow">Coach</span>
            <div class="mistake-title-row">
              <a class="mistake-back-link" href="#cards" aria-label="Zurück zu Karten">&lt;</a>
              <h1>Fehlerbank</h1>
            </div>
          </div>
          <button class="round-add toggle-mistake-form" type="button" aria-label="Fehler hinzufügen">+</button>
        </div>
        <section class="mistake-coach-panel">
          <div>
            <span>${isGermanProfile() ? "Schwache Themen" : "Weak topics"}</span>
            <h2>${weakTopics.length ? C.escapeHtml(weakTopics[0][0]) : "Noch keine Muster"}</h2>
            <p>${weakTopics.length ? `${weakTopics.map(([topic, count]) => `${topic}: ${count}`).join(" · ")}` : "Sobald du Quizze machst oder Fehler speicherst, erkennt Lynxly wiederkehrende Themen."}</p>
          </div>
          <div class="mistake-coach-actions">
            <a class="primary-button" href="#session">${isGermanProfile() ? "Fehler fixen" : "Fix mistakes now"}</a>
            <a class="secondary-button" href="#bot">${isGermanProfile() ? "Erklären lassen" : "Ask AI"}</a>
          </div>
        </section>
        <form class="mistake-add-form ${state.ui.showMistakeForm ? "show" : ""}" id="mistake-form">
          <label>Fach<input name="subject" required placeholder="z. B. Mathe" /></label>
          <label>Thema<input name="topic" placeholder="z. B. Klammern" /></label>
          <label>Aufgabe / Frage<textarea name="question" required rows="3"></textarea></label>
          <label>Meine falsche Antwort<textarea name="userAnswer" rows="2"></textarea></label>
          <label>Richtige Antwort<textarea name="correctAnswer" rows="2"></textarea></label>
          <label>Erklärung<textarea name="explanation" rows="3"></textarea></label>
          <div class="coach-action-row">
            <button class="primary-button" type="submit">Fehler speichern</button>
            <button class="secondary-button cancel-mistake-form" type="button">Abbrechen</button>
          </div>
        </form>
        <div class="mistake-stats">
          <article><span>Offen</span><strong>${openMistakes().length}</strong></article>
          <article><span>Behoben</span><strong>${state.mistakes.filter((item) => item.reviewStatus === "fixed").length}</strong></article>
        </div>
        <div class="segmented-actions">
          ${["open", "all", "fixed"].map((item) => `<button class="mistake-filter ${filter === item ? "active" : ""}" data-filter="${item}" type="button">${item === "open" ? "Offen" : item === "fixed" ? "Behoben" : "Alle"}</button>`).join("")}
        </div>
        <section class="mistake-list">
          ${mistakes.map((mistake) => `
            <article class="mistake-card ${mistake.reviewStatus === "fixed" ? "fixed" : ""}">
              <div class="mistake-card-top">
                <strong>${C.escapeHtml(mistake.subject)}</strong>
                <span>${C.escapeHtml(mistake.source)} - ${formatDate(mistake.createdDate)}${mistake.reviewDate ? ` · Review ${formatDate(mistake.reviewDate)}` : ""}</span>
              </div>
              <h2>${C.escapeHtml(mistake.question)}</h2>
              <div class="mistake-explanation-panel">
                <strong>${C.escapeHtml(mistake.correctAnswer || "Richtige Lösung noch ergänzen")}</strong>
                <p>${C.escapeHtml(mistake.aiExplanation || mistake.explanation || "Tippe auf „Fehler erklären“, damit Lynxly daraus eine einfache Erklärung und eine Retry-Frage macht.")}</p>
                ${mistake.retryQuestion ? `<small>${C.escapeHtml(mistake.retryQuestion)}</small>` : ""}
              </div>
              <dl>
                ${mistake.userAnswer ? `<div><dt>Deine Antwort</dt><dd>${C.escapeHtml(mistake.userAnswer)}</dd></div>` : ""}
                ${mistake.correctAnswer ? `<div><dt>Richtig</dt><dd>${C.escapeHtml(mistake.correctAnswer)}</dd></div>` : ""}
                ${mistake.explanation ? `<div><dt>Erklärung</dt><dd>${C.escapeHtml(mistake.explanation)}</dd></div>` : ""}
              </dl>
              <div class="mistake-action-grid">
                <button class="secondary-button explain-mistake" data-mode="full" data-id="${mistake.id}" type="button">Basis erklären</button>
                <button class="secondary-button adaptive-explain-mistake" data-id="${mistake.id}" type="button">Adaptiv erklären ${renderCostPreview("adaptive_mistake_explanation")}</button>
                <button class="secondary-button explain-mistake" data-mode="simple" data-id="${mistake.id}" type="button">Einfacher</button>
                <button class="secondary-button explain-mistake" data-mode="example" data-id="${mistake.id}" type="button">Beispiel</button>
                <button class="secondary-button mistake-to-card" data-id="${mistake.id}" type="button">Karte erstellen</button>
                <button class="secondary-button mistake-review-later" data-id="${mistake.id}" type="button">Später wiederholen</button>
              </div>
              <button class="${mistake.reviewStatus === "fixed" ? "secondary-button reopen-mistake" : "primary-button fix-mistake"}" data-id="${mistake.id}" type="button">${mistake.reviewStatus === "fixed" ? "Wieder öffnen" : "Als behoben markieren"}</button>
            </article>
          `).join("") || C.emptyState("Noch keine Fehler", "Wenn du Karten mit Nochmal/Schwer bewertest oder KI-Antworten speicherst, entsteht hier deine persönliche Fehlerbank.")}
        </section>
      </section>
    `;
  };

  const translationDictionary = {
    bonjour: "hallo / guten Tag",
    "au revoir": "auf Wiedersehen",
    famille: "Familie",
    "la famille": "die Familie",
    maison: "Haus",
    school: "Schule",
    dog: "Hund",
    cat: "Katze",
    apple: "Apfel",
    hello: "hallo",
    danke: "merci / thank you"
  };

  const extractTranslationTerm = (message) => message
    .replace(/übersetze|uebersetze|translate|was heißt|was heisst|auf deutsch|in deutsch|ins deutsche|bitte/gi, "")
    .replace(/[?:!."]/g, "")
    .trim();

  const botAnswer = (message, inputKind = "Text") => {
    const raw = String(message || "").trim();
    const lower = raw.toLowerCase();
    if (inputKind === "Foto") return "Ich sehe dein Foto als Aufgabe. Schreibe mir kurz, welche Stelle unklar ist, dann führe ich dich Schritt für Schritt durch den ersten Ansatz.";
    if (["übersetze", "uebersetze", "translate", "was heißt", "was heisst", "auf deutsch", "ins deutsche"].some((word) => lower.includes(word))) {
      const term = extractTranslationTerm(raw).toLowerCase();
      const translated = translationDictionary[term];
      return translated ? `${term} heißt: ${translated}.` : `Ich würde das als Übersetzungsfrage behandeln. Schreib mir bitte das einzelne Wort oder den Satz ohne Zusatztext, dann gebe ich dir die passende Übersetzung.`;
    }
    if (/[0-9]\s*[\+\-\*x·:\/]\s*[0-9]|\([^)]*[\+\-\*x·:\/][^)]*\)/.test(lower) || ["mathe", "formel", "funktion", "gleichung", "rechne"].some((word) => lower.includes(word))) {
      const bracket = raw.match(/\(([^()]+)\)/);
      if (bracket) return `Bei Klammern kommt zuerst die Klammer. Dein erster Schritt ist also: ${bracket[1]}. Rechne diesen Teil aus und setze das Ergebnis danach wieder in die Aufgabe ein.`;
      return "Ich helfe dir beim ersten Schritt: Markiere zuerst die Rechenart mit der höchsten Priorität. Punktrechnung vor Strichrechnung, Klammern zuerst. Was würdest du als erstes ausrechnen?";
    }
    if (["lös", "lösung", "antwort", "fertig"].some((word) => lower.includes(word))) return "Ich gebe dir nicht einfach nur eine fertige Lösung. Zeig mir kurz deinen Ansatz, dann gebe ich dir den nächsten Hinweis.";
    return `Kurz erklärt: ${raw || "Diese Frage"} kann ich dir beantworten. Wenn es eine Aufgabe ist, zerlegen wir sie zuerst in: Was ist gegeben? Was wird gesucht? Welcher erste Schritt passt dazu?`;
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Foto konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });

  const prepareChatImage = (file) => new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = 900;
      const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        readFileAsDataUrl(file).then(resolve).catch(reject);
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      readFileAsDataUrl(file).then(resolve).catch(reject);
    };
    image.src = url;
  });

  const readFileSnippet = async (file) => {
    if (!file || (!file.type.startsWith("text/") && !/\.md$|\.txt$/i.test(file.name || ""))) return "";
    try {
      const text = await file.text();
      return text.slice(0, 5000);
    } catch (error) {
      return "";
    }
  };
  const noteSentences = (text) => String(text || "")
    .replace(/\r\n/g, "\n")
    .split(/\n+|[.!?]\s+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 8);
  const uniqueByText = (items, pick = (item) => item) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = normalizeAnswerText(pick(item));
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const noteLines = (text, limit = 8) => uniqueByText(noteSentences(text)).slice(0, limit);
  const inferSubjectFromNotes = (text) => {
    const lower = String(text || "").toLocaleLowerCase();
    return subjectChoices.find((subject) => lower.includes(subject.toLocaleLowerCase())) || "Lynxly";
  };
  const extractStudyTopics = (text, subject = inferSubjectFromNotes(text)) => {
    const lines = noteLines(text, 18);
    const keywordMatches = String(text || "").match(/\b[A-ZÄÖÜ][A-Za-zÄÖÜäöüßéèàçêîôû0-9-]{3,}\b/g) || [];
    const keywords = uniqueByText(keywordMatches)
      .filter((word) => !["Lynxly", subject, "Heute", "Morgen", "Wenn", "Dann", "Diese"].includes(word))
      .slice(0, 8);
    const explicit = lines
      .map((line) => {
        const split = line.match(/^([^:–-]{3,48})[:–-]\s*(.{4,})$/);
        return split ? split[1].trim() : "";
      })
      .filter(Boolean);
    return uniqueByText([...explicit, ...keywords, ...lines.map((line) => compactLabel(line, 42))]).slice(0, 8);
  };
  const difficultyFromText = (text, index = 0) => {
    const lower = String(text || "").toLocaleLowerCase();
    if (/beweise|analyse|erkläre|warum|ableitung|gleichung|komplex|prüf/i.test(lower) || text.length > 120) return { value: 3, label: "hard" };
    if (/definiere|vergleiche|berechne|unterschied|funktion/i.test(lower) || index % 3 === 1) return { value: 2, label: "medium" };
    return { value: 1, label: "easy" };
  };
  const questionFromLine = (line, topic, subject) => {
    const split = String(line || "").match(/^([^:–-]{3,48})[:–-]\s*(.{4,})$/);
    if (split) return { question: `Was bedeutet ${split[1].trim()}?`, answer: split[2].trim() };
    if (/^was |^wie |^warum |^welche /i.test(line)) return { question: line, answer: `Erkläre den Kernpunkt zu ${topic}.` };
    return { question: `Erkläre ${topic || subject} in eigenen Worten.`, answer: line };
  };
  const cardsFromNotes = (text, subject = inferSubjectFromNotes(text), deckTitle = "") => {
    const materials = generateStudyMaterials(text, { subject, deckTitle, types: ["flashcards"] });
    return materials.flashcards;
  };
  const generateStudyMaterials = (notes, options = {}) => {
    const text = String(notes || "").trim();
    const subject = options.subject || inferSubjectFromNotes(text);
    const deckTitle = options.deckTitle || `${subject} AI Study Set`;
    const lines = noteLines(text, 14);
    const topics = extractStudyTopics(text, subject);
    const flashcards = uniqueByText((lines.length ? lines : topics).map((line, index) => {
      const topic = topics[index % Math.max(1, topics.length)] || subject;
      const qa = questionFromLine(line, topic, subject);
      const diff = difficultyFromText(line, index);
      return {
        id: uid("card"),
        deckType: "topic",
        subject,
        title: deckTitle,
        topic,
        question: qa.question,
        answer: qa.answer,
        difficulty: diff.value,
        difficultyLabel: diff.label,
        sourceSnippet: compactLabel(line, 160),
        reviewCount: 0,
        source: "ai",
        published: false,
        createdDate: todayIso()
      };
    }), (card) => `${card.question} ${card.answer}`).slice(0, 10);
    const quiz = flashcards.slice(0, 8).map((card, index) => ({
      id: uid("quiz"),
      topic: card.topic,
      question: card.question,
      choices: choiceOptionsForQuestion(card, { type: "choice", direction: "front" }, flashcards).slice(0, 4),
      correctAnswer: card.answer,
      explanation: `Die Antwort steht im Abschnitt zu ${card.topic}. Wichtig ist: ${compactLabel(card.answer, 120)}`,
      difficulty: card.difficultyLabel || difficultyFromText(card.answer, index).label
    }));
    const likelyExamQuestions = flashcards.slice(0, 5).map((card) => `Prüfungsfrage: ${card.question}`);
    const weakTopics = topics.slice(0, 4).map((topic, index) => ({
      topic,
      subject,
      reason: index === 0 ? "kommt häufig in den Notizen vor" : "wichtig für Verständnis und Prüfung",
      difficulty: difficultyFromText(topic, index).label
    }));
    const plan = topics.slice(0, 4).map((topic, index) => ({
      id: uid("task"),
      subject,
      title: index === 0 ? `${topic} verstehen` : `${topic} üben`,
      date: addDays(todayIso(), index),
      done: false,
      source: "AI Notizen",
      linkedDeckTitle: deckTitle,
      topic
    }));
    return {
      subject,
      deckTitle,
      topics,
      flashcards,
      quiz,
      likelyExamQuestions,
      weakTopics,
      summaryLines: lines.slice(0, 8),
      plan
    };
  };
  const normalizeGeneratedMaterials = (raw, notes, options = {}) => {
    const fallback = generateStudyMaterials(notes, options);
    const source = raw && typeof raw === "object" ? raw : {};
    const subject = String(source.subject || options.subject || fallback.subject).trim() || fallback.subject;
    const deckTitle = String(source.deckTitle || options.deckTitle || `${subject} AI Study Set`).trim();
    const difficultyValue = (value) => ({ easy: 1, medium: 2, hard: 3 }[String(value || "").toLowerCase()] || Math.max(1, Math.min(3, Number(value || 2))));
    const flashcards = (Array.isArray(source.flashcards) && source.flashcards.length ? source.flashcards : fallback.flashcards)
      .map((card, index) => normalizeFlashcard({
        id: card.id || uid("card"),
        deckId: card.deckId || `deck:${normalizeAnswerText(deckTitle).replace(/\s+/g, "-")}`,
        deckType: "topic",
        subject,
        title: deckTitle,
        topic: card.topic || source.topics?.[index % Math.max(1, source.topics?.length || 1)] || subject,
        question: card.question || `Erkläre ${card.topic || subject}.`,
        answer: card.answer || "",
        difficulty: difficultyValue(card.difficulty),
        difficultyLabel: ["", "easy", "medium", "hard"][difficultyValue(card.difficulty)],
        sourceSnippet: card.sourceSnippet || "",
        source: "ai",
        published: false,
        createdDate: todayIso()
      }))
      .filter((card) => card.question && card.answer)
      .slice(0, 20);
    const topics = uniqueByText([
      ...(Array.isArray(source.topics) ? source.topics : []),
      ...flashcards.map((card) => card.topic),
      ...fallback.topics
    ]).slice(0, 10);
    const quizSource = Array.isArray(source.quiz) && source.quiz.length ? source.quiz : fallback.quiz;
    const quiz = quizSource.map((question, index) => {
      const linkedCard = flashcards.find((card) => (
        normalizeAnswerText(card.question) === normalizeAnswerText(question.question)
        || normalizeAnswerText(card.answer) === normalizeAnswerText(question.correctAnswer)
      )) || flashcards[index % Math.max(1, flashcards.length)];
      const correctAnswer = String(question.correctAnswer || linkedCard?.answer || "").trim();
      const choices = uniqueByText([
        correctAnswer,
        ...(Array.isArray(question.choices) ? question.choices : []),
        ...flashcards.filter((card) => card.id !== linkedCard?.id).map((card) => card.answer),
        ...plausibleDistractors(correctAnswer, subject)
      ]).filter(Boolean).slice(0, 4);
      return {
        id: question.id || uid("quiz"),
        cardId: linkedCard?.id || "",
        question: question.question || linkedCard?.question || `Frage ${index + 1}`,
        choices,
        correctAnswer,
        explanation: question.explanation || `Die richtige Antwort ist ${correctAnswer}.`,
        topic: question.topic || linkedCard?.topic || subject,
        difficulty: String(question.difficulty || linkedCard?.difficultyLabel || "medium")
      };
    }).filter((question) => question.question && question.correctAnswer).slice(0, 12);
    const summary = source.summary && typeof source.summary === "object"
      ? {
        title: source.summary.title || `${subject} Zusammenfassung`,
        sections: Array.isArray(source.summary.sections) ? source.summary.sections : []
      }
      : {
        title: `${subject} Zusammenfassung`,
        sections: fallback.summaryLines.map((line, index) => ({ heading: index ? `Punkt ${index + 1}` : "Kernidee", content: line }))
      };
    const studyPlanSource = Array.isArray(source.studyPlan) ? source.studyPlan : (Array.isArray(source.plan) ? source.plan : fallback.plan);
    const studyPlan = studyPlanSource.slice(0, 7).map((task, index) => ({
      id: task.id || uid("task"),
      subject: task.subject || subject,
      title: task.title || `${task.topic || topics[index % Math.max(1, topics.length)] || subject} üben`,
      topic: task.topic || topics[index % Math.max(1, topics.length)] || subject,
      date: task.date || addDays(todayIso(), Number(task.dayOffset ?? index)),
      done: false,
      source: "Lynxly AI",
      linkedDeckTitle: deckTitle
    }));
    const weakTopics = (Array.isArray(source.weakTopics) && source.weakTopics.length ? source.weakTopics : fallback.weakTopics)
      .map((item, index) => typeof item === "string"
        ? { topic: item, subject, reason: "Von Lynxly als wichtig erkannt", difficulty: "medium" }
        : {
          topic: item.topic || topics[index] || subject,
          subject,
          reason: item.reason || "Von Lynxly als wichtig erkannt",
          difficulty: item.difficulty || "medium"
        });
    return {
      subject,
      deckTitle,
      topics,
      flashcards,
      quiz,
      summary,
      summaryLines: summary.sections.map((section) => section.content).filter(Boolean),
      likelyExamQuestions: quiz.slice(0, 5).map((question) => `Prüfungsfrage: ${question.question}`),
      studyPlan,
      plan: studyPlan,
      weakTopics
    };
  };
  const apiErrorMessage = (data = {}, status = 500) => {
    if (data.error === "plan_required") return "Diese Plus-Funktion ist in deinem aktuellen Plan nicht enthalten. Eigene Study Cards, Noten, Tasks und Fehlerbank bleiben kostenlos.";
    if (data.error === "credits_exhausted") return `Deine KI-Credits sind aufgebraucht. ${nextCreditResetText(data.entitlement || currentEntitlement())}`;
    if (data.error === "authentication_required") return "Deine Lynxly-Session konnte nicht bestätigt werden. Lade die Seite neu und versuche es erneut.";
    if (data.error === "forbidden") return data.message || "Diese Aktion ist nicht erlaubt.";
    if (data.error === "rate_limited") return `Zu viele Anfragen hintereinander. Warte ${data.retryAfter ? `${data.retryAfter} Sekunden` : "kurz"} und versuche es erneut.`;
    if (data.error === "provider_unavailable") return data.message || "Die KI ist gerade nicht erreichbar. Du kannst es gleich erneut versuchen.";
    if (status >= 500) return data.message || "Die KI ist gerade nicht erreichbar. Bitte versuche es später erneut.";
    return data.message || data.error || "Die Anfrage konnte nicht verarbeitet werden.";
  };
  const entitlementErrorCodes = new Set(["plan_required", "credits_exhausted", "authentication_required", "forbidden", "rate_limited"]);
  const apiError = (data = {}, status = 500) => {
    const error = new Error(apiErrorMessage(data, status));
    error.code = data.error || "operation_failed";
    error.status = status;
    error.entitlement = data.entitlement;
    return error;
  };
  const materialActionForMode = (mode) => (mode === "cards"
    ? "generate_cards"
    : mode === "plan"
      ? "smart_study_plan"
      : "generate_quiz_summary");
  const generateStudyMaterialsWithAi = async (notes, options = {}) => {
    const local = generateStudyMaterials(notes, options);
    try {
      const response = await fetch("/api/generate-study-materials", {
        method: "POST",
        headers: entitlementHeaders({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify({
          notes,
          options: {
            ...options,
            language: state.settings.language || "de-CH"
          }
        })
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      if (data.entitlement) updateEntitlementCache(data.entitlement);
      if (!response.ok) throw apiError(data, response.status);
      state.ui.aiOfflineMode = Boolean(data.offline || !data.materials);
      return {
        materials: normalizeGeneratedMaterials(data.materials || local, notes, options),
        offline: Boolean(data.offline || !data.materials),
        warning: data.warning || ""
      };
    } catch (error) {
      if (entitlementErrorCodes.has(error.code)) throw error;
      console.warn("Lynxly verwendet den lokalen Material-Generator.", error);
      state.ui.aiOfflineMode = true;
      return {
        materials: normalizeGeneratedMaterials(local, notes, options),
        offline: true,
        warning: "Die KI-Verbindung ist nicht verfügbar. Der lokale Generator wurde verwendet."
      };
    }
  };
  const rememberGeneratedStudySet = (materials, source = "ai") => {
    const set = {
      id: uid("study-set"),
      deckId: materials.flashcards[0]?.deckId || `deck:${uid("ai")}`,
      title: materials.deckTitle,
      subject: materials.subject,
      topicIds: uniqueByText(materials.flashcards.map((card) => card.topicId)).filter(Boolean),
      cardIds: materials.flashcards.map((card) => card.id),
      quizIds: materials.quiz.map((question) => question.id),
      source,
      createdAt: new Date().toISOString()
    };
    state.generatedStudySets = [set, ...(state.generatedStudySets || [])].slice(0, 30);
    return set;
  };
  const saveGeneratedCards = (materials) => {
    const existingIds = new Set(state.flashcards.map((card) => card.id));
    const existingTexts = new Set(state.flashcards.map((card) => normalizeAnswerText(`${card.question} ${card.answer}`)));
    materials.flashcards.forEach((card) => {
      const normalized = normalizeFlashcard(card);
      const key = normalizeAnswerText(`${normalized.question} ${normalized.answer}`);
      if (!existingIds.has(normalized.id) && !existingTexts.has(key)) {
        state.flashcards.push(normalized);
        existingIds.add(normalized.id);
        existingTexts.add(key);
      }
    });
    return rememberGeneratedStudySet(materials, state.ui.aiOfflineMode ? "local" : "ai");
  };
  const startGeneratedQuiz = (materials) => {
    saveGeneratedCards(materials);
    state.ui.cardStudyMode = "personal";
    state.ui.selectedCardSubject = materials.deckTitle;
    state.ui.selectedCardPackId = "";
    state.ui.cardStudyOpen = true;
    state.ui.cardStudyIndex = 0;
    state.cardStudySession = { ...defaultCardStudySession(), choosing: false };
    startDeckSession("test");
    startConfiguredTest({ write: false, choice: true, mixed: false, direction: "front" });
    const cards = activeStudyCards();
    state.cardStudySession.testQuestions = cards.map((card, index) => {
      const generated = materials.quiz.find((question) => question.cardId === card.id)
        || materials.quiz.find((question) => normalizeAnswerText(question.question) === normalizeAnswerText(card.question))
        || materials.quiz[index % Math.max(1, materials.quiz.length)];
      return {
        cardId: card.id,
        type: "choice",
        direction: "front",
        options: generated?.choices?.length ? generated.choices : choiceOptionsForQuestion(card, { type: "choice", direction: "front" }, cards),
        explanation: generated?.explanation || ""
      };
    });
    state.activeModeSession = { ...state.cardStudySession };
    location.hash = "#cards";
  };
  const materialsFrom = (value) => typeof value === "string" ? generateStudyMaterials(value) : value;
  const notesSummaryMarkdown = (value) => {
    const materials = materialsFrom(value);
    return `## Zusammenfassung\n\n**${materials.subject}**\n\n${materials.summaryLines.map((line) => `- ${line}`).join("\n") || "- Noch zu wenig Text erkannt."}\n\n## Schlüsselthemen\n\n${materials.topics.slice(0, 6).map((topic) => `- ${topic}`).join("\n") || "- Thema ergänzen"}\n\n## Wahrscheinliche Prüfungsfragen\n\n${materials.likelyExamQuestions.map((question) => `- ${question}`).join("\n") || "- Mehr Notizen laden, damit Lynxly Fragen erkennt."}\n\n## Nächster Schritt\n\nStarte eine 5-Minuten-Runde mit den generierten Study Cards.`;
  };
  const notesQuizMarkdown = (value) => {
    const materials = materialsFrom(value);
    return `## Mini-Quiz\n\n${materials.quiz.map((item, index) => `${index + 1}. **${item.question}**\n${item.choices.map((choice) => `   - ${choice}`).join("\n")}\n   - Lösung: ${item.correctAnswer}\n   - Erklärung: ${item.explanation}`).join("\n\n") || "1. Füge mehr Notizen ein, damit Lynxly daraus Fragen machen kann."}\n\n## Tipp\n\nFalsche Antworten kannst du nach dem Test in der Fehlerbank speichern.`;
  };
  const notesPlanMarkdown = (subject, topics) => `## Lernplan\n\n1. **Heute:** ${topics[0] || "Grundlagen"} kurz verstehen.\n2. **Morgen:** 5 Study Cards zum Thema wiederholen.\n3. **Übermorgen:** Mini-Quiz machen und falsche Antworten speichern.\n4. **Danach:** Schwache Punkte erneut wiederholen.\n\n## Ergebnis\n\nDein Plan wurde lokal in Tasks gespeichert und kann von Weiterlernen genutzt werden.`;
  const createPlanFromNotes = (text) => {
    const materials = generateStudyMaterials(text);
    const subject = materials.subject;
    const topics = materials.topics.slice(0, 4);
    const tasks = (materials.plan.length ? materials.plan : (topics.length ? topics : ["Notizen wiederholen", "Study Cards erstellen", "Mini-Quiz lösen"]).slice(0, 4).map((topic, index) => ({
      id: uid("task"),
      subject,
      title: `${topic}`,
      date: addDays(todayIso(), index),
      done: false,
      source: "AI Notizen"
    })));
    state.studyTasks.unshift(...tasks);
    tasks.forEach(() => trackStudyAction("studyTaskAdded"));
    return { subject, topics: topics.length ? topics : tasks.map((task) => task.title), tasks };
  };
  const notesFileKind = (file) => {
    const name = String(file?.name || "").toLowerCase();
    const type = String(file?.type || "").toLowerCase();
    if (type.startsWith("text/") || /\.txt$|\.md$/i.test(name)) return "text";
    if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
    if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(name)) return "image";
    return "unsupported";
  };
  const formatFileSize = (bytes = 0) => {
    const size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) return "0 KB";
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  };
  const uploadLimitForKind = (kind) => ({
    text: uploadLimits.textBytes,
    pdf: uploadLimits.pdfBytes,
    image: uploadLimits.imageBytes
  })[kind] || uploadLimits.textBytes;
  const extractNotesFromUpload = async (file) => {
    const kind = notesFileKind(file);
    const base = {
      fileName: file?.name || "",
      fileType: kind,
      fileSize: formatFileSize(file?.size || 0),
      status: "extracting",
      text: "",
      preview: "",
      error: ""
    };
    if (!file) return { ...base, status: "error", error: "Keine Datei gewählt." };
    const limit = uploadLimitForKind(kind);
    if (file.size > limit) {
      return {
        ...base,
        status: "error",
        error: `Diese Datei ist ${formatFileSize(file.size)} groß. Bitte nutze maximal ${formatFileSize(limit)} oder kopiere den wichtigsten Text ins Feld.`
      };
    }
    if (kind === "text") {
      const text = await file.text();
      return { ...base, status: "ready", text: text.slice(0, uploadLimits.text), preview: text.slice(0, 500) };
    }
    if (kind === "pdf" || kind === "image") {
      try {
        const form = new FormData();
        form.append("file", file, file.name || (kind === "pdf" ? "notizen.pdf" : "notizen.jpg"));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45_000);
        let response;
        try {
          response = await fetch("/api/extract-notes", {
            method: "POST",
            credentials: "same-origin",
            body: form,
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeout);
        }
        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        if (data.entitlement) updateEntitlementCache(data.entitlement);
        if (!response.ok) throw apiError(data, response.status);
        const text = String(data.text || "").trim();
        if (!text) {
          return {
            ...base,
            status: "blocked",
            error: data.warning || (kind === "pdf"
              ? "PDF-Erkennung benötigt ein verbundenes KI-Backend. Kopiere den Text ins Feld oder lade eine .txt/.md-Datei."
              : "Bild-OCR benötigt ein verbundenes KI-Backend. Füge den erkannten Text bitte manuell ein.")
          };
        }
        return { ...base, status: "ready", text: text.slice(0, uploadLimits.text), preview: text.slice(0, 500) };
      } catch (error) {
        if (entitlementErrorCodes.has(error.code)) {
          return { ...base, status: "blocked", error: error.message };
        }
        return {
          ...base,
          status: "blocked",
          error: kind === "pdf"
            ? "PDF konnte nicht ausgelesen werden. Kopiere den Text ins Feld oder lade eine .txt/.md-Datei."
            : "Das Bild konnte nicht per OCR gelesen werden. Füge den Text bitte manuell ein."
        };
      }
    }
    return { ...base, status: "error", error: "Dieses Dateiformat wird noch nicht unterstützt." };
  };

  const askLynxlyAI = async (message, attachment, imageData) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: entitlementHeaders({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify({ message: message || attachment || "Hilf mir beim Lernen", attachmentName: attachment || "", imageData: imageData || "" })
      });
      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (error) {
        throw new Error(raw || "KI-Antwort war kein JSON");
      }
      if (data.entitlement) updateEntitlementCache(data.entitlement);
      if (!response.ok) throw apiError(data, response.status);
      state.ui.aiOfflineMode = Boolean(data.offline);
      return data.answer || botAnswer(message || attachment, attachment ? "Foto" : "Text");
    } catch (error) {
      if (entitlementErrorCodes.has(error.code)) {
        return `## ${isGermanProfile() ? "KI nicht verfügbar" : "AI unavailable"}\n\n${error.message}\n\n${isGermanProfile() ? "Manuelle Study Cards, Noten, Tasks und Fehlerbank bleiben nutzbar." : "Manual study cards, grades, tasks and the mistake bank remain available."}`;
      }
      console.warn("Lynxly AI nutzt lokale Antwort.", error);
      state.ui.aiOfflineMode = true;
      return `${botAnswer(message || attachment, attachment ? "Foto" : "Text")}\n\nHinweis: Die echte KI-Route ist lokal gerade nicht verbunden, deshalb nutze ich eine sichere Offline-Antwort.`;
    }
  };

  const lastUserMessageBefore = (messageId) => {
    const index = state.chat.findIndex((message) => message.id === messageId);
    return [...state.chat.slice(0, index)].reverse().find((message) => message.role === "user")?.text || "KI-Frage";
  };

  const aiSectionTypes = {
    antwort: "answer",
    answer: "answer",
    "final answer": "answer",
    lösungsweg: "steps",
    loesungsweg: "steps",
    lösung: "steps",
    loesung: "steps",
    solution: "steps",
    erklärung: "explanation",
    erklaerung: "explanation",
    explanation: "explanation",
    ergebnis: "result",
    result: "result",
    zusammenfassung: "summary",
    summary: "summary",
    probe: "check",
    check: "check",
    beispiel: "example",
    example: "example",
    fehler: "error",
    error: "error"
  };
  const normalizeAiSectionTitle = (title = "") => String(title)
    .toLowerCase()
    .replace(/[:：]/g, "")
    .trim();
  const aiSectionClass = (title = "") => aiSectionTypes[normalizeAiSectionTitle(title)] || "default";
  const isAiThinkingText = (text = "") => /ich denke kurz nach/i.test(String(text || ""));

  const renderSimpleMathFallback = (value = "") => C.escapeHtml(String(value || "").trim())
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="ai-frac"><span class="ai-frac-top">$1</span><span class="ai-frac-bottom">$2</span></span>')
    .replace(/\\cdot/g, '<span class="ai-math-symbol">×</span>')
    .replace(/\\div/g, '<span class="ai-math-symbol">÷</span>')
    .replace(/\n/g, '<br>');

  const renderMath = (value = "", display = false) => {
    const source = String(value || "").trim();
    const escaped = C.escapeHtml(source);
    if (window.katex?.renderToString) {
      try {
        const math = window.katex.renderToString(source, {
          displayMode: display,
          throwOnError: false,
          strict: "ignore",
          trust: false
        });
        return display
          ? `<div class="ai-math-block" role="img" aria-label="${escaped}">${math}</div>`
          : `<span class="ai-math-inline" role="img" aria-label="${escaped}">${math}</span>`;
      } catch (error) {
        // Fallback below keeps the original formula readable if KaTeX cannot parse it.
      }
    }
    const fallbackMath = renderSimpleMathFallback(source);
    return display
      ? `<div class="ai-math-block ai-math-fallback">${fallbackMath}</div>`
      : `<span class="ai-math-inline ai-math-fallback">${fallbackMath}</span>`;
  };

  const renderInlineMarkdown = (value = "") => {
    const tokens = [];
    const token = (html) => {
      const id = `§§LYNXLYCODE${tokens.length}§§`;
      tokens.push([id, html]);
      return id;
    };
    let text = String(value ?? "").replace(/`([^`\n]+)`/g, (_, code) => token(`<code>${C.escapeHtml(code)}</code>`));
    text = text
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => token(renderMath(math, false)))
      .replace(/\$([^$\n]+)\$/g, (_, math) => token(renderMath(math, false)));
    let html = C.escapeHtml(text);
    html = html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[^\*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
    tokens.forEach(([id, htmlValue]) => {
      html = html.replaceAll(id, htmlValue);
    });
    return html;
  };

  const renderMarkdownTable = (lines) => {
    const rows = lines
      .filter((line, index) => index !== 1)
      .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    const head = rows.shift() || [];
    return `
      <div class="ai-table-wrap">
        <table class="ai-table">
          <thead><tr>${head.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    `;
  };

  const renderMarkdownDocument = (markdown = "") => {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let paragraph = [];
    let list = null;
    let index = 0;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const text = paragraph.join("\n").trim();
      const sectionMatch = text.match(/^\*\*(Antwort|Lösungsweg|Erklärung|Ergebnis|Zusammenfassung|Probe|Beispiel|Fehler):?\*\*\s*(.*)$/i);
      if (sectionMatch) {
        blocks.push({ type: "heading", level: 2, text: sectionMatch[1] });
        if (sectionMatch[2]) blocks.push({ type: "paragraph", text: sectionMatch[2] });
      } else {
        blocks.push({ type: "paragraph", text });
      }
      paragraph = [];
    };
    const flushList = () => {
      if (!list) return;
      blocks.push(list);
      list = null;
    };
    const isTableSeparator = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
    const isTableLine = (line) => line.includes("|") && line.split("|").length >= 3;

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        index += 1;
        continue;
      }

      if (trimmed.startsWith("```")) {
        flushParagraph();
        flushList();
        index += 1;
        const codeLines = [];
        while (index < lines.length && !lines[index].trim().startsWith("```")) {
          codeLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        blocks.push({ type: "code", text: codeLines.join("\n") });
        continue;
      }

      if (isTableLine(trimmed) && isTableSeparator(lines[index + 1] || "")) {
        flushParagraph();
        flushList();
        const tableLines = [trimmed, lines[index + 1]];
        index += 2;
        while (index < lines.length && isTableLine(lines[index].trim())) {
          tableLines.push(lines[index].trim());
          index += 1;
        }
        blocks.push({ type: "table", lines: tableLines });
        continue;
      }

      if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) {
        flushParagraph();
        flushList();
        const open = trimmed.startsWith("$$") ? "$$" : "\\[";
        const close = open === "$$" ? "$$" : "\\]";
        let first = trimmed.slice(open.length).trim();
        const mathLines = [];
        if (first.endsWith(close) && first.length > close.length) {
          mathLines.push(first.slice(0, -close.length).trim());
          index += 1;
        } else {
          if (first) mathLines.push(first);
          index += 1;
          while (index < lines.length && !lines[index].trim().endsWith(close)) {
            mathLines.push(lines[index]);
            index += 1;
          }
          if (index < lines.length) {
            const closingLine = lines[index].trim();
            const content = closingLine.slice(0, -close.length).trim();
            if (content) mathLines.push(content);
            index += 1;
          }
        }
        blocks.push({ type: "math", text: mathLines.join("\n") });
        continue;
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        blocks.push({ type: "heading", level: heading[1].length, text: heading[2].replace(/#+$/, "").trim() });
        index += 1;
        continue;
      }

      if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
        flushParagraph();
        flushList();
        blocks.push({ type: "hr" });
        index += 1;
        continue;
      }

      const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      const bullet = trimmed.match(/^[-*]\s+(.+)$/);
      if (numbered || bullet) {
        flushParagraph();
        const ordered = Boolean(numbered);
        if (!list || list.ordered !== ordered) {
          flushList();
          list = { type: "list", ordered, items: [] };
        }
        list.items.push(numbered ? numbered[2] : bullet[1]);
        index += 1;
        continue;
      }

      flushList();
      paragraph.push(line);
      index += 1;
    }
    flushParagraph();
    flushList();

    let html = "";
    let openSection = false;
    const closeSection = () => {
      if (openSection) html += "</section>";
      openSection = false;
    };

    blocks.forEach((block) => {
      if (block.type === "heading") {
        closeSection();
        const title = block.text.replace(/^\*\*|\*\*$/g, "");
        const sectionType = block.level >= 3 ? "step" : aiSectionClass(title);
        const headingLevel = block.level === 1 ? 2 : Math.min(3, block.level);
        html += `<section class="ai-section ai-section-${sectionType}">`;
        openSection = true;
        html += `<h${headingLevel} class="ai-section-title ai-heading-level-${block.level}">${renderInlineMarkdown(title)}</h${headingLevel}>`;
        return;
      }
      if (!openSection) {
        html += `<section class="ai-section ai-section-default">`;
        openSection = true;
      }
      if (block.type === "paragraph") {
        const className = /\d+\s*(stunden?|minuten?|tage?)|^[\s*`]*\d+/.test(block.text.toLowerCase()) ? " ai-final-answer" : "";
        html += `<p class="${className.trim()}">${renderInlineMarkdown(block.text).replace(/\n/g, "<br>")}</p>`;
      } else if (block.type === "list") {
        const tag = block.ordered ? "ol" : "ul";
        const className = block.ordered ? "ai-step-list" : "ai-bullet-list";
        html += `<${tag} class="${className}">${block.items.map((item) => `<li class="${block.ordered ? "ai-step" : ""}">${renderInlineMarkdown(item)}</li>`).join("")}</${tag}>`;
      } else if (block.type === "code") {
        html += `<pre class="ai-code-block"><code>${C.escapeHtml(block.text)}</code></pre>`;
      } else if (block.type === "math") {
        html += renderMath(block.text, true);
      } else if (block.type === "table") {
        html += renderMarkdownTable(block.lines);
      } else if (block.type === "hr") {
        html += `<hr class="ai-divider" />`;
      }
    });
    closeSection();
    return html || `<section class="ai-section ai-section-default"><p>${renderInlineMarkdown(markdown)}</p></section>`;
  };

  const renderChatMessage = (msg) => {
    if (msg.role === "user") {
      return `
        <article class="chat-message-user">
          <p>${C.escapeHtml(msg.text)}</p>
        </article>
      `;
    }

    if (isAiThinkingText(msg.text)) {
      return `
        <article class="chat-message-ai ai-thinking" aria-live="polite">
          <div class="ai-response-header">
            <span class="ai-avatar">${C.mascot("mascot-small")}</span>
            <div><strong>Lynxly AI</strong><small>Lynxly denkt <span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span></small></div>
          </div>
        </article>
      `;
    }

    return `
      <article class="chat-message-ai" aria-live="polite">
        <div class="ai-response">
          <div class="ai-response-header">
            <span class="ai-avatar">${C.mascot("mascot-small")}</span>
            <div><strong>Lynxly AI</strong><small>Antwort</small></div>
          </div>
          <div class="ai-message-content">${renderMarkdownDocument(msg.text)}</div>
          <div class="ai-actions">
            <button class="save-ai-flashcards" data-id="${msg.id}" type="button" aria-label="KI-Antwort als Karten speichern">${C.icon("cards")} Als Karten</button>
            <button class="save-ai-mistake" data-id="${msg.id}" type="button" aria-label="KI-Antwort als Fehler speichern">${C.icon("target")} Als Fehler</button>
            <button class="save-ai-task" data-id="${msg.id}" type="button" aria-label="KI-Antwort als Aufgabe speichern">${C.icon("calendar")} Als Aufgabe</button>
          </div>
        </div>
      </article>
    `;
  };

  const renderBot = () => {
    const hasChat = state.chat.length > 0;
    const messages = state.chat;
    const attachmentReady = Boolean(state.ui.chatAttachmentName && pendingChatAttachment?.name === state.ui.chatAttachmentName);
    const notesStatus = state.ui.aiNotesStatus;
    const actions = [
      ["Erkläre das", "Erkläre mir das Schritt für Schritt: "],
      ["Frag mich ab", "Frag mich dazu ab: "],
      ["Antwort prüfen", "Prüfe meine Antwort und gib mir Hinweise: "],
      ["Karten erstellen", "Mache daraus Karteikarten: "],
      ["Lernplan machen", "Mache daraus einen Lernplan: "]
    ];
    return `
      <section class="ai-full-page ${hasChat ? "has-chat" : "is-empty"}">
        <h1>Lynxly AI</h1>
        <section class="ai-study-builder" aria-label="AI Lernmaterial erstellen">
          <div class="ai-builder-head">
            <div>
              <span>${isGermanProfile() ? "Notizen hochladen" : "Upload Notes"}</span>
              <h2>${isGermanProfile() ? "Mach aus Notizen Lernstoff" : "Turn notes into study material"}</h2>
              <p>${isGermanProfile() ? "Einfügen, Datei laden und direkt Karten, Quiz, Zusammenfassung oder Plan erstellen." : "Paste notes or load a file, then create cards, quiz, summary or plan."}</p>
            </div>
            ${C.icon("spark")}
          </div>
          <aside class="ai-privacy-note">
            ${C.icon("lock")}
            <p>${isGermanProfile()
              ? "Hinweis: Hochgeladene Notizen können zur KI-Verarbeitung gesendet werden. Lade keine sensiblen persönlichen Daten hoch."
              : "Note: uploaded notes may be sent to AI processing. Do not upload sensitive personal data."}</p>
          </aside>
          <textarea id="ai-notes-input" rows="4" placeholder="${isGermanProfile() ? "Notizen hier einfügen ..." : "Paste notes here ..."}" ${state.ui.aiNotesFocus ? "autofocus" : ""}>${C.escapeHtml(state.ui.aiNotesDraft || "")}</textarea>
          ${notesStatus ? `
            <article class="ai-file-status ${C.escapeHtml(notesStatus)}" aria-live="polite">
              <strong>${C.escapeHtml(state.ui.aiNotesFileName || "Datei")}</strong>
              <span>${C.escapeHtml(state.ui.aiNotesFileType || "Datei")} · ${C.escapeHtml(state.ui.aiNotesFileSize || "Größe unbekannt")} · ${notesStatus === "ready" ? "Text bereit zur Prüfung" : notesStatus === "generating" ? "Generiere Lernmaterial ..." : notesStatus === "extracting" ? "Extrahiere Text ..." : "Bitte prüfen"}</span>
              ${state.ui.aiNotesPreview ? `<p>${C.escapeHtml(state.ui.aiNotesPreview)}</p>` : ""}
              ${state.ui.aiNotesError ? `<p>${C.escapeHtml(state.ui.aiNotesError)}</p>` : ""}
              <div class="ai-status-actions">
                ${state.ui.aiNotesDraft ? `<button class="secondary-button clear-ai-notes" type="button">Notizen löschen</button>` : ""}
                ${state.ui.aiGenerationLastMode && notesStatus !== "generating" ? `<button class="secondary-button retry-ai-generation" data-mode="${C.escapeHtml(state.ui.aiGenerationLastMode)}" type="button">Erneut versuchen</button>` : ""}
              </div>
            </article>
          ` : ""}
          <div class="ai-builder-actions">
            <label class="secondary-button ai-notes-file-button">${C.icon("upload")} ${isGermanProfile() ? "Alles hochladen" : "Upload anything"}<input id="ai-notes-file" type="file" accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp,text/*,application/pdf,image/*" /></label>
            <button class="secondary-button ai-note-generate" data-mode="summary" type="button" ${notesStatus === "generating" ? "disabled" : ""}>Zusammenfassung ${renderCostPreview(materialActionForMode("summary"))}</button>
            <button class="secondary-button ai-note-generate" data-mode="cards" type="button" ${notesStatus === "generating" ? "disabled" : ""}>Lernkarten ${renderCostPreview(materialActionForMode("cards"))}</button>
            <button class="secondary-button ai-note-generate" data-mode="quiz" type="button" ${notesStatus === "generating" ? "disabled" : ""}>Quiz ${renderCostPreview(materialActionForMode("quiz"))}</button>
            <button class="primary-button ai-note-generate" data-mode="plan" type="button" ${notesStatus === "generating" ? "disabled" : ""}>Lernplan ${renderCostPreview(materialActionForMode("plan"))}</button>
          </div>
        </section>
        <section class="ai-window">
          ${hasChat ? `
            <div class="ai-output" aria-live="polite" aria-label="Chatverlauf mit Lynxly AI">
              ${messages.map(renderChatMessage).join("")}
            </div>
          ` : `
            <div class="ai-start-screen">
              <h2>${isGermanProfile() ? "Los gehts mit Lernen" : "Let's start learning"}</h2>
              <p>${isGermanProfile() ? "Lynxly hilft dir Schritt für Schritt, mit Text, Foto, Datei oder Stimme." : "Lynxly helps you step by step with text, photo, file, or voice."}</p>
            </div>
          `}
          ${attachmentReady ? `<div class="attachment-pill">${C.icon(pendingChatAttachment?.kind === "file" ? "upload" : "camera")} ${pendingChatAttachment?.kind === "file" ? "Datei" : "Foto"} bereit: ${C.escapeHtml(state.ui.chatAttachmentName)}</div>` : ""}
          <form id="chat-form" class="ai-full-input">
            <div class="ai-search-shell">
              <div class="ai-attach-wrap ${state.ui.aiAttachMenuOpen ? "open" : ""}">
                <button class="ai-plus-button" id="ai-attach-toggle" type="button" aria-label="Foto oder Datei hinzufügen" aria-expanded="${state.ui.aiAttachMenuOpen ? "true" : "false"}">${C.icon("add")}</button>
                <div class="ai-attach-menu">
                  <label class="ai-attach-option">${C.icon("camera")} Foto<input id="ai-photo-input" type="file" accept="image/*" /></label>
                  <label class="ai-attach-option">${C.icon("upload")} Datei<input id="ai-file-input" type="file" accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,image/*,text/*,application/pdf" /></label>
                </div>
              </div>
              <button class="ai-mic-button voice-input" type="button" title="Mündlich fragen" aria-label="Mündlich fragen" aria-pressed="false">${C.icon("mic")}</button>
              <textarea id="chat-input" name="message" rows="1" placeholder="${isGermanProfile() ? "Frag Lynxly etwas" : "Ask anything"}"></textarea>
              <button id="ai-send-submit" class="ai-send-button" type="submit" form="chat-form" title="Frage senden" aria-label="Frage senden">
                <span class="ai-send-arrow" aria-hidden="true">${C.icon("arrowUp")}</span>
              </button>
            </div>
          </form>
          <div class="ai-quick-actions">
            ${actions.map(([label, prompt]) => `<button class="ai-quick-action" data-prompt="${C.escapeHtml(prompt)}" type="button">${C.escapeHtml(label)}</button>`).join("")}
          </div>
        </section>
      </section>
    `;
  };

  const scrollAiConversation = () => {
    const scrollToBottom = () => {
      const output = document.querySelector(".ai-output");
      if (output) {
        output.scrollTop = output.scrollHeight;
        const messages = output.querySelectorAll(".chat-message-user, .chat-message-ai");
        const latest = messages[messages.length - 1];
        latest?.scrollIntoView({ block: "end", behavior: "auto" });
      }
      document.querySelector("#chat-input")?.focus({ preventScroll: true });
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
    };
    requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
  };

  const startVoiceInput = () => {
    const input = document.querySelector("#chat-input");
    const button = document.querySelector(".voice-input");
    if (!input || !button) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      input.value = `${input.value}${input.value ? "\n" : ""}Mündliche Eingabe wird in diesem Browser nicht unterstützt. Du kannst deine Frage hier eintippen.`.trim();
      input.focus();
      return;
    }
    if (voiceRecognition) {
      voiceRecognition.stop();
      return;
    }
    const recognition = new Recognition();
    voiceRecognition = recognition;
    const startValue = input.value.trim();
    recognition.lang = state.settings.language === "en" ? "en-US" : "de-CH";
    recognition.interimResults = true;
    recognition.continuous = false;
    button.classList.add("listening");
    button.setAttribute("aria-pressed", "true");
    button.title = "Aufnahme läuft";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      input.value = `${startValue}${startValue && transcript ? "\n" : ""}${transcript}`.trim();
      input.focus({ preventScroll: true });
    };
    recognition.onerror = () => {
      input.placeholder = "Mikrofon konnte nicht gestartet werden. Prüfe die Browser-Berechtigung.";
    };
    recognition.onend = () => {
      voiceRecognition = null;
      button.classList.remove("listening");
      button.setAttribute("aria-pressed", "false");
      button.title = "Mündlich fragen";
      input.focus({ preventScroll: true });
    };
    recognition.start();
  };

  const aiCreditInfo = () => {
    const entitlement = currentEntitlement();
    const used = Number(entitlement.aiCredits?.used || 0);
    const reserved = Number(entitlement.aiCredits?.reserved || 0);
    const allowance = Number(entitlement.aiCredits?.allowance || 10);
    return {
      used,
      reserved,
      allowance,
      remaining: Math.max(0, allowance - used - reserved),
      reset: entitlement.aiCredits?.month || monthKey()
    };
  };
  const formatChf = (value) => `CHF ${Number(value || 0).toFixed(2)}`;
  const plusPriceLine = () => {
    const plus = planConfig("plus");
    return state.settings.billingCycle === "monthly"
      ? `${formatChf(plus.price?.monthly || 4.9)} / Monat`
      : `${formatChf(plus.price?.annual || 39.9)} / Jahr`;
  };
  const plusSubPrice = () => {
    const plus = planConfig("plus");
    return state.settings.billingCycle === "monthly"
      ? "Monatlich kündbar. Verlängert sich monatlich, sobald echte Zahlungen verbunden sind."
      : `Standard: jährlich · entspricht ${formatChf(plus.price?.annualMonthlyEquivalent || 3.33)} / Monat.`;
  };
  const nextCreditResetText = (entitlement = currentEntitlement()) => {
    if (entitlement.examPass?.active && entitlement.examPass?.endsAt) {
      const examPassEnd = new Date(entitlement.examPass.endsAt);
      if (!Number.isNaN(examPassEnd.getTime())) {
        return `Exam-Pass-Credits laufen am ${formatDate(examPassEnd.toISOString(), { day: "numeric", month: "long", year: "numeric" })} ab.`;
      }
    }
    const creditMonth = String(entitlement.aiCredits?.month || monthKey());
    const monthMatch = creditMonth.match(/^(\d{4})-(\d{2})$/);
    const safeMonth = monthMatch && Number(monthMatch[2]) >= 1 && Number(monthMatch[2]) <= 12 ? creditMonth : monthKey();
    const [year, month] = safeMonth.split("-").map(Number);
    const reset = new Date(Date.UTC(year || new Date().getUTCFullYear(), month || new Date().getUTCMonth() + 1, 1));
    return `Deine Credits werden am ${formatDate(reset.toISOString(), { day: "numeric", month: "long", year: "numeric" })} zurückgesetzt.`;
  };
  const renderPlanFeatureList = (features, options = {}) => `<ul class="premium-feature-list">${features.map((feature) => {
    const locked = feature.comingSoon || feature.implemented === false;
    const label = typeof feature === "string" ? feature : feature.label;
    return `<li class="${locked ? "coming-soon" : ""}">${C.escapeHtml(label)}${locked && options.showStatus !== false ? ` <small>Bald verfügbar</small>` : ""}</li>`;
  }).join("")}</ul>`;
  const renderCostPreview = (action) => {
    const credits = aiCreditInfo();
    const cost = actionCost(action);
    return `<span class="credit-cost-pill" title="${C.escapeHtml(actionLabel(action))}">${cost} Credit${cost === 1 ? "" : "s"} · danach ${Math.max(0, credits.remaining - cost)} übrig</span>`;
  };
  const weeklyReportData = () => {
    const nextExam = state.exams.filter((exam) => dayDelta(exam.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const weak = weakestSubject();
    const sortedSubjects = sortedSubjectsByAverage();
    const strong = sortedSubjects[0];
    const mistakeCounts = openMistakes().reduce((map, mistake) => {
      const subject = mistake.subject || "Allgemein";
      map[subject] = Number(map[subject] || 0) + 1;
      return map;
    }, {});
    const weakestTopic = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || weak?.name || "Noch offen";
    return {
      studyDays: state.weeklyStats.studyDays?.length || 0,
      sessions: Number(state.weeklyStats.studySessions || 0),
      cards: Number(state.weeklyStats.cardsReviewed || 0),
      mistakes: Number(state.weeklyStats.mistakesFixed || 0),
      strongest: strong?.name || "Noch keine Daten",
      weakest: weakestTopic,
      exam: nextExam ? `${nextExam.subject} · ${relativeDayLabel(nextExam.date)}` : "Keine Prüfung eingetragen",
      next: nextExam ? `Heute ${nextExam.subject} kurz vorbereiten.` : (openMistakes().length ? "Einen offenen Fehler beheben." : "5 Study Cards wiederholen.")
    };
  };
  const renderWeeklyReportPreview = () => {
    const report = weeklyReportData();
    return `
      <section class="panel weekly-report-card">
        <div class="panel-header"><div><span>Plus</span><h2>Wochenbericht</h2></div>${C.icon("chart")}</div>
        <div class="weekly-report-grid">
          <article><span>Lerntage</span><strong>${report.studyDays}</strong></article>
          <article><span>Sessions</span><strong>${report.sessions}</strong></article>
          <article><span>Karten</span><strong>${report.cards}</strong></article>
          <article><span>Fehler behoben</span><strong>${report.mistakes}</strong></article>
        </div>
        <p><strong>Stärkstes Thema:</strong> ${C.escapeHtml(report.strongest)} · <strong>Schwächstes Thema:</strong> ${C.escapeHtml(report.weakest)}</p>
        <p><strong>Nächste Prüfung:</strong> ${C.escapeHtml(report.exam)}</p>
        <p><strong>Nächste Aktion:</strong> ${C.escapeHtml(report.next)}</p>
      </section>
    `;
  };
  const renderPlanPricing = () => {
    const plan = currentPlan();
    const entitlement = currentEntitlement();
    const credits = aiCreditInfo();
    const waitlist = entitlement.proWaitlist || {};
    const trialEnds = entitlement.trial?.active && entitlement.trial?.endsAt
      ? formatDate(entitlement.trial.endsAt, { day: "2-digit", month: "long", year: "numeric" })
      : "";
    const examEnds = entitlement.examPass?.active && entitlement.examPass?.endsAt
      ? formatDate(entitlement.examPass.endsAt, { day: "2-digit", month: "long", year: "numeric" })
      : "";
    return `
      <section class="premium-landing">
        <span class="eyebrow">Lynxly Pläne</span>
        <h1>Free bleibt stark. Plus spart dir Lernzeit.</h1>
        <p>Alle Angaben kommen aus einer zentralen Plan-Konfiguration. Manuelle Study Cards, Noten, Tasks und Fehlerbank bleiben kostenlos.</p>
        <div class="ai-credit-meter" aria-label="KI-Credits">
          <div><strong>${credits.remaining}</strong><span>KI-Credits übrig</span></div>
          <small>${credits.used} / ${credits.allowance} genutzt${credits.reserved ? ` · ${credits.reserved} reserviert` : ""}. ${C.escapeHtml(nextCreditResetText(entitlement))}</small>
        </div>
      </section>
      <section class="billing-toggle" aria-label="Abrechnung wählen">
        <button class="${state.settings.billingCycle === "annual" ? "active" : ""} billing-cycle" data-cycle="annual" type="button">Jährlich <span>CHF 39.90</span></button>
        <button class="${state.settings.billingCycle === "monthly" ? "active" : ""} billing-cycle" data-cycle="monthly" type="button">Monatlich <span>CHF 4.90</span></button>
      </section>
      <section class="pricing-grid premium-grid plan-stack">
        <article class="price-card plan-card ${plan === "free" ? "active-plan" : ""}">
          <span>Free</span>
          <h2>${C.escapeHtml(planConfig("free").headline || "Organisiere Schule")}</h2>
          <strong>${C.escapeHtml(planConfig("free").price?.label || "CHF 0")}</strong>
          <p>${Number(planConfig("free").monthlyCredits || 10)} KI-Credits pro Monat</p>
          ${renderPlanFeatureList(planFeatureItems("free"))}
          <button class="secondary-button" type="button" disabled>${plan === "free" ? "Aktueller Plan" : "In Free enthalten"}</button>
        </article>
        <article class="price-card plan-card featured ${plan === "plus" ? "active-plan" : ""}">
          <em class="plan-badge">Am beliebtesten</em>
          <span>Lynxly Plus</span>
          <h2>${C.escapeHtml(planConfig("plus").headline || "Lerne smarter")}</h2>
          <strong>${plusPriceLine()}</strong>
          <p class="plan-annual">${plusSubPrice()}</p>
          ${trialEnds ? `<p class="plan-state">Testphase aktiv bis ${C.escapeHtml(trialEnds)}.</p>` : ""}
          <p>${Number(planConfig("plus").monthlyCredits || 200)} gewichtete KI-Credits pro Monat</p>
          ${renderPlanFeatureList(planFeatureItems("plus").filter((feature) => feature.implemented !== false))}
          <button class="primary-button activate-plan" data-plan="plus" type="button">${plan === "plus" ? "Plus aktiv" : "Plus auswählen"}</button>
          ${!entitlement.trial?.used ? `<button class="secondary-button start-plus-trial" type="button">7 Tage Plus testen</button>` : ""}
          <small>Keine Zahlungsdaten für die lokale Testphase nötig. Nach Ablauf wird automatisch auf Free zurückgestuft; deine Karten, Noten und Historie bleiben erhalten.</small>
        </article>
      </section>
      <section class="exam-pass-card ${plan === "exam_pass" ? "active-plan" : ""}">
        <div>
          <span class="eyebrow">Exam Pass</span>
          <h2>14 Tage Prüfungsvorbereitung</h2>
          <p>${C.escapeHtml(planConfig("exam_pass").price?.label || "CHF 6.90 einmalig")}. Kein Abo, keine automatische Verlängerung. Enthält ${Number(planConfig("exam_pass").monthlyCredits || 300)} einmalige KI-Credits, die mit dem Pass ablaufen.</p>
          ${renderPlanFeatureList(planFeatureItems("exam_pass"))}
          ${examEnds ? `<small>Aktiv bis ${C.escapeHtml(examEnds)}.</small>` : `<small>Nicht kaufbar, bis Prüfungssimulation und intensiver Prüfungsplan fertig verbunden sind.</small>`}
        </div>
        <button class="secondary-button" type="button" disabled>Bald verfügbar</button>
      </section>
      <section class="panel pro-waitlist-card">
        <div class="panel-header"><div><span>Pro</span><h2>Bald verfügbar</h2></div>${C.icon("lock")}</div>
        <p class="panel-note">Pro kann aktuell nicht gekauft werden. Die Warteliste speichert Account-ID, E-Mail, Einwilligung und Anmeldedatum serverseitig zur aktuellen Session.</p>
        ${renderPlanFeatureList(planFeatureItems("pro"))}
        <form id="pro-waitlist-form" class="pro-waitlist-form">
          <label>E-Mail <input name="email" type="email" value="${C.escapeHtml(waitlist.email || state.user.email || "")}" placeholder="name@schule.ch" ${waitlist.active ? "disabled" : ""} /></label>
          <label class="toggle-field"><input name="consent" type="checkbox" value="on" ${waitlist.active ? "checked disabled" : ""} /><span>Ich möchte über Pro informiert werden.</span></label>
          <button class="secondary-button join-pro-waitlist" data-action="${waitlist.active ? "unsubscribe" : "join"}" type="submit">${waitlist.active ? "Von Warteliste abmelden" : "Auf Warteliste setzen"}</button>
          ${waitlist.signupAt ? `<small>Angemeldet am ${formatDate(waitlist.signupAt, { day: "2-digit", month: "long", year: "numeric" })}.</small>` : ""}
        </form>
      </section>
      ${renderWeeklyReportPreview()}
      <section class="panel premium-credit-costs">
        <div class="panel-header"><div><span>Credits</span><h2>Kosten vor dem Start</h2></div>${C.icon("spark")}</div>
        <div class="credit-cost-grid">
          ${Object.keys(premiumConfig().creditCosts || {}).map((action) => `<article><span>${C.escapeHtml(actionLabel(action))}</span><strong>${actionCost(action)} Credits</strong></article>`).join("")}
        </div>
        <p>Vor teuren Aktionen zeigt Lynxly Kosten, aktuelles Guthaben und den Stand danach. App- oder Anbieterfehler werden nicht belastet.</p>
      </section>
      <section class="panel premium-note-panel">
        <h2>Wichtig</h2>
        <p>Du kannst nach Kündigung Free weiter nutzen: eigene Study Cards, Noten, Tasks, Fehlerbank und lokale Historie bleiben. Plus-Funktionen, volle Sammlungen und adaptive KI-Aktionen werden wieder gesperrt.</p>
        <p><a href="#settings">Dateneinstellungen</a> · <a href="#settings">Datenschutz</a> · <a href="#settings">Nutzungsbedingungen</a>. Daten werden aktuell lokal im Browser und der Premiumstatus serverseitig für diese Session gespeichert.</p>
      </section>
    `;
  };

  const renderPremium = () => `
    ${C.sectionTitle("Premium", "Lynxly Pläne")}
    ${renderPlanPricing()}
  `;

  const badgeDefinition = (id) => badgeDefinitions.find((badge) => badge.id === id) || { id, title: id, text: "Freigeschaltet" };
  const progressBar = (value, max, label, className = "") => {
    const safeMax = Math.max(1, Number(max || 1));
    const safeValue = Math.max(0, Math.min(safeMax, Number(value || 0)));
    const percent = Math.round((safeValue / safeMax) * 100);
    return `<span class="xp-progress ${className}" role="progressbar" aria-label="${C.escapeHtml(label)}" aria-valuemin="0" aria-valuemax="${safeMax}" aria-valuenow="${safeValue}"><i style="width:${percent}%"></i></span>`;
  };
  const isoWeekNumber = () => {
    const date = dateObject(todayIso());
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  };
  const friendWeeklyXp = (friend) => {
    if (friend.weeklyXp !== undefined) return Number(friend.weeklyXp || 0);
    return Math.round(
      Number(friend.cardsReviewed || 0) * 5
      + Number(friend.mistakesFixed || 0) * 20
      + Number(friend.studySessions || 0) * 50
      + Number(friend.improved || 0) * 4
    );
  };
  const userLeaderboardStats = () => ({
    id: "you",
    name: state.leaderboardPrivacy.visible ? (state.leaderboardPrivacy.displayName || "Du") : "Du (privat)",
    initials: (state.leaderboardPrivacy.displayName || state.user.name || "D").slice(0, 1).toUpperCase(),
    private: !state.leaderboardPrivacy.visible,
    weeklyXp: Number(state.xpThisWeek || state.weeklyStats.xp || 0)
  });
  const leaderboardRows = () => {
    return [
      ...state.friends.map((friend) => ({ ...friend, weeklyXp: friendWeeklyXp(friend) })),
      userLeaderboardStats()
    ].sort((a, b) => Number(b.weeklyXp || 0) - Number(a.weeklyXp || 0));
  };
  const daysLeftInWeek = () => Math.max(1, 8 - (new Date().getDay() || 7));
  const classLeaderboardRows = () => {
    return [...(state.classLeague.classmates || []), classUserStats()]
      .sort((a, b) => Number(b.weeklyXp || 0) - Number(a.weeklyXp || 0));
  };
  const classRankInfo = () => {
    const rows = [...(state.classLeague.classmates || []), classUserStats()].sort((a, b) => Number(b.weeklyXp || 0) - Number(a.weeklyXp || 0));
    const rank = rows.findIndex((row) => row.id === "you") + 1;
    return { rank: rank || rows.length, total: rows.length, tier: tierById(state.leagueTier) };
  };
  const classLeagueResult = (index) => {
    if (index < 3) return { id: "podium", title: `${index + 1}. Platz`, text: "Aufstieg · Top 3" };
    if (index < 7) return { id: "stay", title: "Bleibt", text: "Bleibt in der Liga" };
    return { id: "demote", title: "Abstieg", text: "Wird heruntergestuft" };
  };
  const classRankMedal = (place) => {
    if (place > 3) return `<strong class="league-rank-number">${place}</strong>`;
    const label = place === 1 ? "Goldmedaille" : place === 2 ? "Silbermedaille" : "Bronzemedaille";
    return `<strong class="league-rank-medal medal-${place}" aria-label="${label}, Platz ${place}"><span>${place}</span></strong>`;
  };
  const podiumTrophy = (place) => `
    <svg class="podium-trophy trophy-${place}" viewBox="0 0 64 64" aria-hidden="true">
      <path class="cup-side left" d="M19 18H9c0 12 5 19 15 21"/>
      <path class="cup-side right" d="M45 18h10c0 12-5 19-15 21"/>
      <path class="cup-main" d="M18 10h28v14c0 12-6 20-14 20S18 36 18 24Z"/>
      <path class="cup-shine" d="M32 10v34"/>
      <path class="cup-stem" d="M28 44h8v8h-8z"/>
      <path class="cup-base" d="M22 52h20v7H22z"/>
    </svg>
  `;
  const renderClassPodium = (rows) => {
    const podium = rows.slice(0, 3);
    return `
      <section class="class-podium" aria-label="Podest der Woche">
        ${podium.map((row, index) => {
          const name = row.private ? "Privat" : row.displayName;
          const place = index + 1;
          return `
            <article class="podium-place place-${place}">
              ${podiumTrophy(place)}
              <div class="podium-block"><span>${place}</span></div>
              <div class="podium-name"><strong>${C.escapeHtml(name)}</strong><small>${Number(row.weeklyXp || 0)} XP</small></div>
            </article>
          `;
        }).join("")}
      </section>
    `;
  };
  const renderBadgeGrid = () => {
    const unlocked = new Set(state.badges.map((badge) => badge.id));
    return `
      <section class="badge-grid">
        ${badgeDefinitions.map((badge) => `
          <article class="badge-chip ${unlocked.has(badge.id) ? "unlocked" : "locked"}">
            <span>${unlocked.has(badge.id) ? C.icon("spark") : C.icon("lock")}</span>
            <div><strong>${C.escapeHtml(badge.title)}</strong><small>${C.escapeHtml(badge.text)}</small></div>
          </article>
        `).join("")}
      </section>
    `;
  };
  const progressInsights = () => {
    const allReviewCards = allCardsForReview();
    const masteredCards = allReviewCards.filter((card) => ["good", "easy"].includes(state.cardSchedule?.[card.id]?.rating || state.cardReviewStatus?.[card.id])).length;
    const due = pendingDueCards().length;
    const weakTopics = weakTopicStats();
    const latestTests = (state.testResults || []).slice(0, 5);
    const avgQuiz = latestTests.length ? Math.round(latestTests.reduce((sum, test) => sum + Number(test.scorePercent || 0), 0) / latestTests.length) : null;
    const studyDays = Number(state.weeklyStats.studyDays?.length || 0);
    const sessions = Number(state.weeklyStats.studySessions || 0);
    const activityScore = Math.min(100, studyDays * 14 + sessions * 8 + Number(state.streak.current || 0) * 4);
    const mastery = allReviewCards.length ? Math.round((masteredCards / allReviewCards.length) * 100) : 0;
    const retention = allReviewCards.length ? Math.max(0, Math.round(((allReviewCards.length - due) / allReviewCards.length) * 100)) : 0;
    const weakPenalty = Math.min(40, weakTopics.reduce((sum, item) => sum + item.count, 0) * 5);
    const confidence = Math.max(0, Math.min(100, Math.round(mastery * 0.38 + retention * 0.28 + activityScore * 0.22 + (avgQuiz ?? 60) * 0.12 - weakPenalty * 0.35)));
    const nextExam = state.exams.filter((exam) => dayDelta(exam.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    const examSoonBoost = nextExam ? Math.max(0, 20 - Math.max(0, dayDelta(nextExam.date)) * 3) : 0;
    const readiness = nextExam
      ? Math.max(0, Math.min(100, Math.round(mastery * 0.35 + retention * 0.2 + confidence * 0.2 + activityScore * 0.15 + examSoonBoost - weakPenalty * 0.4)))
      : Math.min(100, Math.round((mastery + retention + confidence) / 3));
    const readinessDataPoints = [allReviewCards.length, weakTopics.length, latestTests.length, studyDays, sessions].filter(Boolean).length;
    const readinessAvailable = Boolean(nextExam && readinessDataPoints >= 2);
    const readinessLabel = !readinessAvailable
      ? "Noch nicht genügend Daten"
      : readiness < 25 ? "Einstieg"
        : readiness < 55 ? "Auf gutem Weg"
          : readiness < 78 ? "Fast bereit"
            : "Prüfungsbereit";
    const masteredTopics = personalDecks()
      .filter((deck) => deck.cards.length && deckMasteryScore(deck) >= 70)
      .slice(0, 4)
      .map((deck) => ({ title: deck.title, subject: deck.subject, score: deckMasteryScore(deck) }));
    const reviewTopics = weakTopics.slice(0, 4);
    const recommendedNextSession = reviewTopics[0]
      ? `${reviewTopics[0].topic} wiederholen`
      : due ? `${Math.min(5, due)} fällige Karten wiederholen`
        : nextExam ? `${nextExam.subject} kurz vorbereiten`
          : "Erste Lernrunde starten";
    return {
      allReviewCards,
      masteredCards,
      due,
      weakTopics,
      avgQuiz,
      studyDays,
      sessions,
      activityScore,
      mastery,
      retention,
      confidence,
      readiness,
      readinessAvailable,
      readinessLabel,
      readinessDataPoints,
      masteredTopics,
      reviewTopics,
      recommendedNextSession,
      nextExam,
      masteryText: allReviewCards.length ? `${masteredCards} von ${allReviewCards.length} Karten sind als Good/Easy markiert.` : "Noch keine Karten bewertet. Starte eine kurze Lernrunde.",
      retentionText: allReviewCards.length ? `${due} Karte${due === 1 ? "" : "n"} sind fällig. Weniger fällige Karten erhöhen Retention.` : "Retention startet, sobald du Karten wiederholst.",
      readinessText: readinessAvailable
        ? `${nextExam.subject}: Karten-Sicherheit, fällige Wiederholungen, offene Fehler, Quizscore und Lernrhythmus werden gemeinsam geschätzt.`
        : "Lynxly braucht mindestens eine Prüfung und etwas Lernhistorie, bevor die Bereitschaft sinnvoll geschätzt wird.",
      confidenceText: `${avgQuiz === null ? "Noch kein Testscore" : `${avgQuiz}% Ø Quizscore`}, ${sessions} Sessions und ${weakTopics.length} offene Schwachstellen.`
    };
  };
  const renderGradeProgressCard = () => {
    const insights = gradeInsights();
    const next = insights.nextSubject;
    const nextAvg = next ? subjectDisplayAverage(next) : null;
    const nextTarget = next?.targetGrade ? Number(next.targetGrade) : null;
    const needed = next ? requiredNextGrade(next, {
      weight: 1,
      categoryId: next.gradeMode === "category" ? next.gradeCategories?.[0]?.id || "" : ""
    }) : null;
    const hasGrades = Number.isFinite(insights.overall);
    const summary = hasGrades
      ? `Ø ${formatSchoolAverage(insights.overall, { digits: 2 })} · Ziel ${Number.isFinite(insights.target) ? formatSchoolAverage(insights.target, { digits: 2 }) : "–"} · ${insights.belowTargetCount} ${insights.belowTargetCount === 1 ? "Fach" : "Fächer"} unter Ziel`
      : "Trage deine erste Note ein, damit Lynxly deinen Lernfokus besser planen kann.";
    const nextCopy = next
      ? `${next.name}: ${nextAvg === null ? "–" : formatSchoolAverage(nextAvg, { digits: 2 })}${Number.isFinite(nextTarget) ? ` · Ziel ${formatSchoolAverage(nextTarget, { digits: 2 })}` : ""}`
      : "Noch kein Fach mit Noten vorhanden.";
    return `
      <article class="grade-progress-card panel">
        <div class="panel-header">
          <div><span>Noten</span><h2>Noten</h2></div>
          ${C.icon("chart")}
        </div>
        <p>${C.escapeHtml(summary)}</p>
        <div class="grade-progress-grid">
          <article><span>Durchschnitt</span><strong>${hasGrades ? C.escapeHtml(formatSchoolAverage(insights.overall, { digits: 2 })) : "–"}</strong><small>Gesamt</small></article>
          <article><span>Ziel</span><strong>${Number.isFinite(insights.target) ? C.escapeHtml(formatSchoolAverage(insights.target, { digits: 2 })) : "–"}</strong><small>Zielschnitt</small></article>
          <article><span>Unter Ziel</span><strong>${insights.belowTargetCount}</strong><small>Fächer</small></article>
        </div>
        <div class="grade-next-action">
          <div>
            <span>Nächster Fokus</span>
            <strong>${C.escapeHtml(next?.name || "Noten starten")}</strong>
            <small>${C.escapeHtml(nextCopy)}</small>
            ${Number.isFinite(needed) ? `<em>Nächste benötigte Note: ${C.escapeHtml(formatSchoolAverage(needed, { digits: 2 }))}</em>` : ""}
          </div>
          <button class="secondary-button start-grade-study" data-subject="${C.escapeHtml(next?.name || "")}" type="button" ${next ? "" : "disabled"}>Lernen starten</button>
        </div>
        <a class="primary-button" href="#grades">Noten verwalten</a>
      </article>
    `;
  };
  const renderProgressPersonal = () => {
    const progress = levelProgress();
    const currentTier = tierById(state.leagueTier);
    const records = state.personalRecords;
    const insights = progressInsights();
    const nextExams = state.exams.filter((exam) => dayDelta(exam.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    const mascotLine = Number(state.xpThisWeek || 0) > 0
      ? "Lynxly sagt: Du baust diese Woche echte Lernroutine auf. Bleib scharf."
      : "Lynxly sagt: Ein kleiner Schritt heute reicht, um wieder einzusteigen.";
    return `
      <section class="progress-personal academic-progress">
        <article class="progress-section readiness-card">
          <span>Bereit</span>
          <h2>Prüfungsbereitschaft</h2>
          <div class="readiness-main">
            <div>
              <strong>${insights.readinessAvailable ? `${insights.readiness}%` : insights.readinessLabel}</strong>
              <small>${insights.nextExam ? `${insights.nextExam.subject} · ${relativeDayLabel(insights.nextExam.date)}` : "Keine kommende Prüfung eingetragen"}</small>
            </div>
            <a class="secondary-button" href="${insights.nextExam ? "#planner" : "#planner"}">${insights.nextExam ? "Prüfung öffnen" : "Prüfung eintragen"}</a>
          </div>
          <p>${C.escapeHtml(insights.readinessText)}</p>
          <div class="readiness-mini-grid">
            <article><span>Gemeistert</span><strong>${insights.masteredTopics.length || insights.masteredCards}</strong><small>Themen/Karten</small></article>
            <article><span>Noch üben</span><strong>${insights.reviewTopics.length || insights.due}</strong><small>Prioritäten</small></article>
            <article><span>Nächste Session</span><strong>${C.escapeHtml(compactLabel(insights.recommendedNextSession, 22))}</strong><small>empfohlen</small></article>
          </div>
        </article>

        <section class="progress-section">
          <span>Bereit</span>
          <h2>Themen gemeistert</h2>
          ${insights.masteredTopics.length ? `
            <div class="progress-topic-list">${insights.masteredTopics.map((topic) => `<article><strong>${C.escapeHtml(topic.title)}</strong><small>${C.escapeHtml(topic.subject)} · ${topic.score}% sicher</small></article>`).join("")}</div>
          ` : C.emptyState("Noch keine sicheren Themen", "Bewerte Karten mit Gut oder Einfach, damit Lynxly gemeisterte Themen erkennt.")}
        </section>

        <section class="progress-section">
          <span>Noch üben</span>
          <h2>Was als Nächstes hilft</h2>
          ${insights.reviewTopics.length ? `
            <div class="progress-topic-list">${insights.reviewTopics.map((item) => `<button class="weak-topic-review" data-subject="${C.escapeHtml(item.subject)}" type="button"><strong>${C.escapeHtml(item.topic)}</strong><small>${item.count} offene Fehler · jetzt wiederholen</small></button>`).join("")}</div>
          ` : C.emptyState("Keine offenen Fehler", "Starte ein Quiz oder eine Kartenrunde, um neue Schwachstellen sichtbar zu machen.")}
        </section>

        <section class="progress-section">
          <span>Nächste Prüfungen</span>
          <h2>Was bald wichtig wird</h2>
          ${nextExams.length ? `
            <div class="progress-topic-list">${nextExams.map((exam) => `<article><strong>${C.escapeHtml(exam.subject)}</strong><small>${C.escapeHtml(exam.title)} · ${relativeDayLabel(exam.date)}</small></article>`).join("")}</div>
          ` : `<div class="empty-state"><strong>Keine kommenden Prüfungen</strong><p>Trage deine nächste Prüfung ein, damit Lynxly die Bereitschaft berechnen kann.</p><a class="primary-button" href="#planner">Prüfung eintragen</a></div>`}
        </section>

        <section class="progress-section">
          <span>Lernrhythmus</span>
          <h2>Diese Woche</h2>
          <div class="progress-stat-grid compact">
            <article><span>Lerntage</span><strong>${state.weeklyStats.studyDays.length}</strong><small>diese Woche</small></article>
            <article><span>Karten</span><strong>${state.weeklyStats.cardsReviewed}</strong><small>wiederholt</small></article>
            <article><span>Fehler</span><strong>${state.weeklyStats.mistakesFixed}</strong><small>behoben</small></article>
            <article><span>Sessions</span><strong>${state.weeklyStats.studySessions}</strong><small>abgeschlossen</small></article>
          </div>
        </section>

        <section class="progress-section">
          <span>Notenentwicklung</span>
          ${renderGradeProgressCard()}
        </section>

        <section class="progress-section">
          <span>Erfolge</span>
          <h2>Was du aufgebaut hast</h2>
          <div class="record-list">
            <span>Beste XP-Woche <strong>${records.bestWeeklyXp}</strong></span>
            <span>Meiste Karten/Woche <strong>${records.bestCardsWeek}</strong></span>
            <span>Meiste Fehler/Woche <strong>${records.bestMistakesWeek}</strong></span>
            <span>Meiste Sessions/Woche <strong>${records.bestSessionsWeek}</strong></span>
          </div>
          ${renderBadgeGrid()}
        </section>

        <details class="progress-section gamification-details">
          <summary>XP, Ligen und soziale Vergleiche</summary>
          <article class="level-card">
            <div class="level-card-top">
              <div>
                <span>Aktuelle Liga</span>
                <div class="league-title-row">${leagueSymbol(currentTier.id, true)}</div>
                <p>${progress.next ? `${progress.remaining} XP fehlen bis zum nächsten Ziel: ${C.escapeHtml(progress.next.title)}` : "Höchstes Ziel für dieses MVP erreicht"}</p>
              </div>
              <div class="level-card-league-photo">${leagueSymbol(currentTier.id)}</div>
            </div>
            ${progressBar(Number(state.xpTotal || 0) - progress.current.min, progress.end - progress.current.min, `Fortschritt bis ${progress.next ? progress.next.title : currentTier.name}`, "large")}
            <div class="xp-meta"><strong>${state.xpThisWeek} XP diese Woche</strong><span>${state.xpTotal} XP gesamt</span><span>Rang ${classRankInfo().rank} ${leagueSymbol(classRankInfo().tier.id)}</span></div>
          </article>
          <div class="continue-actions compact"><button class="secondary-button progress-tab-jump" data-tab="friends" type="button">Freunde ansehen</button><button class="secondary-button progress-tab-jump" data-tab="class" type="button">Klasse ansehen</button></div>
          <p class="panel-note">Soziale Vergleiche zeigen nur Lernaktionen und XP. Du kannst sie im Profil ausblenden.</p>
        </details>

        <article class="mascot-card progress-mascot-card">${C.mascot("mascot-small")}<p>${C.escapeHtml(mascotLine)}</p></article>
      </section>
    `;
  };
  const renderFriendsProgress = () => {
    const rows = leaderboardRows();
    const friendsCards = state.friends.reduce((sum, friend) => sum + Number(friend.cardsReviewed || 0), 0);
    const friendsMistakes = state.friends.reduce((sum, friend) => sum + Number(friend.mistakesFixed || 0), 0);
    const teamCards = friendsCards + Number(state.weeklyStats.cardsReviewed || 0);
    const teamMistakes = friendsMistakes + Number(state.weeklyStats.mistakesFixed || 0);
    return `
      <section class="friends-progress">
        <article class="challenge-card">
          <div>
            <span>Freunde Challenge</span>
            <h2>${C.escapeHtml(state.friendsChallenge.title)}</h2>
            <p>Noch ${daysLeftInWeek()} Tag${daysLeftInWeek() === 1 ? "" : "e"} · Belohnung: ${C.escapeHtml(state.friendsChallenge.reward)}</p>
          </div>
          ${C.mascot("mascot-small")}
        </article>
        <div class="leaderboard-mode-pill" aria-label="Leaderboard nach XP sortiert">XP Leaderboard</div>
        <section class="leaderboard-list">
          ${rows.map((row, index) => `
            <article class="leaderboard-row ${row.id === "you" ? "you" : ""} ${row.private ? "private" : ""}">
              <strong>${index + 1}</strong>
              <span class="friend-avatar">${C.escapeHtml(row.initials || row.name.slice(0, 1))}</span>
              <div><b>${C.escapeHtml(row.name)}</b><small>${row.private ? "Privat sichtbar" : C.escapeHtml(leaderboardCategory.note)}</small></div>
              <em>${row.private ? "Privat" : `${Number(row.weeklyXp || 0)} ${C.escapeHtml(leaderboardCategory.unit)}`}</em>
            </article>
          `).join("")}
        </section>
        <section class="team-goal-card">
          <h2>Gemeinsam diese Woche</h2>
          <div class="team-goal-row"><span>Karten</span><strong>${teamCards} / ${state.friendsChallenge.cardsGoal}</strong>${progressBar(teamCards, state.friendsChallenge.cardsGoal, "Freunde-Ziel Karten")}</div>
          <div class="team-goal-row"><span>Fehler</span><strong>${teamMistakes} / ${state.friendsChallenge.mistakesGoal}</strong>${progressBar(teamMistakes, state.friendsChallenge.mistakesGoal, "Freunde-Ziel Fehler")}</div>
        </section>
        <article class="privacy-note-card">${C.icon("lock")} <span>Keine Noten, E-Mails oder privaten Durchschnitte erscheinen in der Freunde Challenge.</span></article>
      </section>
    `;
  };
  const renderClassLeague = () => {
    const rows = classLeaderboardRows();
    const ownRank = rows.findIndex((row) => row.id === "you") + 1;
    const totals = classTeamTotals();
    const goals = state.classLeague.goals || {};
    const tier = tierById(state.leagueTier);
    return `
      <section class="class-league-page">
        <article class="class-league-hero">
          <div>
            <span>${C.escapeHtml(state.classLeague.demoLabel || "Demo-Klassenliga · lokal gespeichert")}</span>
            <h2>${C.escapeHtml(state.classLeague.className || "Klasse")}</h2>
            <p>Woche ${isoWeekNumber()} · Rang ${ownRank || "–"}</p>
          </div>
          <div class="league-badge-stack">
            <strong class="league-badge">${leagueSymbol(tier.id)}</strong>
            <span class="league-badge-name">${C.escapeHtml(tier.name)}</span>
          </div>
        </article>
        <div class="leaderboard-mode-pill" aria-label="Klassenliga nach XP sortiert">XP Leaderboard</div>
        <section class="leaderboard-list class-league-list" aria-label="Wochenranking der Klassenliga">
          ${rows.map((row, index) => {
            const score = Number(row.weeklyXp || 0);
            const name = row.private ? "Privat" : row.displayName;
            const result = classLeagueResult(index);
            return `
              <article class="leaderboard-row class-rank-row result-${result.id} ${row.id === "you" ? "you" : ""} ${row.private ? "private" : ""}" aria-label="${C.escapeHtml(result.title)}, Rang ${index + 1}: ${C.escapeHtml(name)}, ${row.private ? "privat" : `${score} ${classLeagueCategory.unit}`}">
                ${classRankMedal(index + 1)}
                <span class="friend-avatar">${C.escapeHtml(row.initials || name.slice(0, 1))}</span>
                <div><b>${C.escapeHtml(name)}</b><small>${row.id === "you" ? `Du · ${result.text}` : C.escapeHtml(result.text)}</small></div>
                <em>${row.private ? "Privat" : `${score} ${C.escapeHtml(classLeagueCategory.unit)}`}</em>
              </article>
            `;
          }).join("")}
        </section>
        <section class="team-goal-card class-team-goal">
          <div class="panel-header"><div><span>Klassenbonus</span><h2>Gemeinsam diese Woche</h2></div><strong>+100 XP</strong></div>
          <div class="team-goal-row"><span>Karten wiederholt</span><strong>${totals.cardsReviewed} / ${goals.cardsReviewed}</strong>${progressBar(totals.cardsReviewed, goals.cardsReviewed, "Klassenziel Karten wiederholt")}</div>
          <div class="team-goal-row"><span>Fehler behoben</span><strong>${totals.mistakesFixed} / ${goals.mistakesFixed}</strong>${progressBar(totals.mistakesFixed, goals.mistakesFixed, "Klassenziel Fehler behoben")}</div>
          <div class="team-goal-row"><span>Lerneinheiten</span><strong>${totals.studySessions} / ${goals.studySessions}</strong>${progressBar(totals.studySessions, goals.studySessions, "Klassenziel Lerneinheiten")}</div>
          <p>${state.classLeague.bonusAwarded ? "Klassenbonus geschafft. Stark zusammen gelernt." : "Wenn alle Ziele erfüllt sind, bekommt deine lokale Demo-Klasse den Bonus."}</p>
        </section>
        <article class="league-reset-note"><strong>Wöchentlicher Neustart</strong><span>Top 3 steigen eine Liga auf. Platz 4 bis 7 bleibt. Alle darunter werden heruntergestuft, aber jede Woche startet frisch.</span></article>
      </section>
    `;
  };
  const renderProgress = () => {
    const tab = ["friends", "class"].includes(state.ui.progressTab) ? state.ui.progressTab : "me";
    return `
      <section class="progress-page sleek-screen">
        <div class="mistake-header">
          <div><span class="eyebrow">Lynxly</span><h1>Dein Lernfortschritt</h1></div>
        </div>
        <div class="settings-tabs progress-tabs" role="tablist" aria-label="Fortschritt Bereiche">
          <button class="progress-tab ${tab === "me" ? "active" : ""}" data-tab="me" type="button">Ich</button>
          <button class="progress-tab ${tab === "friends" ? "active" : ""}" data-tab="friends" type="button">Freunde</button>
          <button class="progress-tab ${tab === "class" ? "active" : ""}" data-tab="class" type="button">Klasse</button>
        </div>
        ${tab === "class" ? renderClassLeague() : tab === "friends" ? renderFriendsProgress() : renderProgressPersonal()}
      </section>
    `;
  };

  const renderDesignPanel = () => `
    <section class="panel design-settings-panel ${state.ui.designOpen ? "show" : ""}">
      <div class="panel-header"><div><span>Design</span><h2>Lynxly anpassen</h2></div>${isPlus() ? C.icon("palette") : C.icon("lock")}</div>
      <p class="panel-note">${isPlus() ? "Wähle Farben und Kartenstil direkt aus." : "Farben und Kartenstil sind Plus/Pro. Hell und Dunkel kannst du immer nutzen."}</p>
      <div class="interactive-option-grid">
        ${[
          ["blue", "Blau", "#2563eb"],
          ["green", "Grün", "#10b981"],
          ["violet", "Violett", "#7c3aed"],
          ["coral", "Koralle", "#f97316"]
        ].map(([value, label, color]) => `<button class="design-option setting-pick ${state.settings.accent === value ? "active" : ""}" data-name="accent" data-value="${value}" type="button" ${isPlus() ? "" : "disabled"}><i style="--swatch:${color}"></i><strong>${label}</strong><small>Akzent</small></button>`).join("")}
      </div>
      <div class="interactive-option-grid two">
        <button class="design-option setting-pick ${state.settings.cardStyle === "stacked" ? "active" : ""}" data-name="cardStyle" data-value="stacked" type="button" ${isPlus() ? "" : "disabled"}><strong>Gestapelt</strong><small>Karten mit Tiefe</small></button>
        <button class="design-option setting-pick ${state.settings.cardStyle === "clean" ? "active" : ""}" data-name="cardStyle" data-value="clean" type="button" ${isPlus() ? "" : "disabled"}><strong>Clean</strong><small>Ruhiger Look</small></button>
      </div>
      <div class="interactive-option-grid two">
        <button class="design-option setting-pick ${state.settings.theme === "light" ? "active" : ""}" data-name="theme" data-value="light" type="button"><strong>Sonne</strong><small>Hellmodus</small></button>
        <button class="design-option setting-pick ${state.settings.theme === "dark" ? "active" : ""}" data-name="theme" data-value="dark" type="button"><strong>Halbmond</strong><small>Dunkelmodus</small></button>
      </div>
    </section>
  `;

  const renderStudyPreferences = () => {
    const goal = Number(state.settings.dailyGoalMinutes || 5);
    const goalPreset = [2, 5, 10, 15].includes(goal) ? String(goal) : "custom";
    const visibility = state.settings.dashboardVisibility;
    const reminders = state.settings.reminderPreferences;
    return `
      <form class="panel study-preferences-card" id="study-preferences-form">
        <div class="panel-header"><div><span>Start & Lernen</span><h2>Lernpräferenzen</h2></div>${C.icon("target")}</div>
        <p class="panel-note">Bestimme, wie klein dein Tagesfokus ist und welche Bereiche du auf Start sehen möchtest.</p>
        <div class="preferences-grid">
          <label>Tagesziel<select name="dailyGoalPreset"><option value="2" ${goalPreset === "2" ? "selected" : ""}>2 Minuten</option><option value="5" ${goalPreset === "5" ? "selected" : ""}>5 Minuten</option><option value="10" ${goalPreset === "10" ? "selected" : ""}>10 Minuten</option><option value="15" ${goalPreset === "15" ? "selected" : ""}>15 Minuten</option><option value="custom" ${goalPreset === "custom" ? "selected" : ""}>Individuell</option></select></label>
          <label>Eigene Minuten<input name="customDailyGoal" type="number" min="2" max="60" value="${goal}" inputmode="numeric" /></label>
          <label>Bevorzugte Aktion<select name="preferredDailyAction"><option value="smart" ${state.settings.preferredDailyAction === "smart" ? "selected" : ""}>Smarte Empfehlung</option><option value="cards" ${state.settings.preferredDailyAction === "cards" ? "selected" : ""}>Lernkarten</option><option value="questions" ${state.settings.preferredDailyAction === "questions" ? "selected" : ""}>Übungsfragen</option><option value="mistakes" ${state.settings.preferredDailyAction === "mistakes" ? "selected" : ""}>Fehler korrigieren</option><option value="summaries" ${state.settings.preferredDailyAction === "summaries" ? "selected" : ""}>Zusammenfassungen</option><option value="mixed" ${state.settings.preferredDailyAction === "mixed" ? "selected" : ""}>Gemischt</option></select></label>
          <label>Fokusgröße<select name="focusSize"><option value="tiny" ${state.settings.focusSize === "tiny" ? "selected" : ""}>Kleine Aktion</option><option value="short" ${state.settings.focusSize === "short" ? "selected" : ""}>Kurze Einheit</option><option value="full" ${state.settings.focusSize === "full" ? "selected" : ""}>Volle Einheit</option></select></label>
        </div>
        <fieldset><legend>Auf Home anzeigen</legend><div class="preference-toggle-grid">
          <label class="toggle-field"><input name="showStreak" type="checkbox" ${visibility.streak ? "checked" : ""} /><span>Streak</span></label>
          <label class="toggle-field"><input name="showProgress" type="checkbox" ${visibility.progress ? "checked" : ""} /><span>Fortschritt</span></label>
          <label class="toggle-field"><input name="showCoach" type="checkbox" ${visibility.aiCoach ? "checked" : ""} /><span>AI Coach</span></label>
          <label class="toggle-field"><input name="showGrades" type="checkbox" ${visibility.grades ? "checked" : ""} /><span>Noten</span></label>
          <label class="toggle-field"><input name="showPlanner" type="checkbox" ${visibility.planner ? "checked" : ""} /><span>Plan</span></label>
        </div></fieldset>
        <fieldset><legend>Erinnerungen</legend><div class="preferences-grid">
          <label class="toggle-field form-span-full"><input name="showReminders" type="checkbox" ${reminders.showOnHome ? "checked" : ""} /><span>Erinnerungen auf Home</span></label>
          <label>Prüfungen vorher<select name="testDays">${[1, 3, 7].map((day) => `<option value="${day}" ${Number(reminders.testDays) === day ? "selected" : ""}>${day} Tag${day === 1 ? "" : "e"}</option>`).join("")}</select></label>
          <label>Aufgaben vorher<select name="assignmentDays">${[1, 3, 7].map((day) => `<option value="${day}" ${Number(reminders.assignmentDays) === day ? "selected" : ""}>${day} Tag${day === 1 ? "" : "e"}</option>`).join("")}</select></label>
          <label class="toggle-field form-span-full"><input name="showOverdue" type="checkbox" ${reminders.showOverdue ? "checked" : ""} /><span>Offene überfällige Aufgaben zeigen</span></label>
        </div><button class="secondary-button request-notifications-button" type="button">Geräte-Mitteilungen aktivieren</button></fieldset>
        <fieldset><legend>Darstellung</legend><div class="preferences-grid">
          <label>Dichte<select name="dashboardDensity"><option value="comfortable" ${state.settings.dashboardDensity === "comfortable" ? "selected" : ""}>Komfortabel</option><option value="compact" ${state.settings.dashboardDensity === "compact" ? "selected" : ""}>Kompakt</option></select></label>
          <label class="toggle-field"><input name="mascotVisible" type="checkbox" ${state.settings.mascotVisible ? "checked" : ""} /><span>Maskottchen anzeigen</span></label>
          <label class="toggle-field form-span-full"><input name="reducedAnimations" type="checkbox" ${state.settings.reducedAnimations ? "checked" : ""} /><span>Animationen reduzieren</span></label>
        </div></fieldset>
        <button class="primary-button" type="submit">Präferenzen speichern</button>
      </form>
    `;
  };

  const renderSchoolSettings = () => {
    const profile = schoolProfile();
    const plusAvailable = profile.country === "CH" && profile.schoolLevel === "gymi";
    return `
      <form class="panel school-settings-card" id="school-settings-form">
        <div class="panel-header"><div><span>School Settings</span><h2>Schulsystem</h2></div>${C.icon("book")}</div>
        <p class="panel-note">Lynxly nutzt diese Angaben für Noten, Pluspunkte, Erinnerungen und deinen Tagesfokus.</p>
        <div class="preferences-grid">
          <label>Country / Region
            <select name="country" id="settings-school-country">
              ${countryOptions.map((country) => `<option value="${country.id}" ${country.id === profile.country ? "selected" : ""}>${C.escapeHtml(country.label)}</option>`).join("")}
            </select>
          </label>
          <label>School level
            <select name="schoolLevel" id="settings-school-level">
              ${renderLevelOptions(profile.country, profile.schoolLevel)}
            </select>
          </label>
          <label>Grade system
            <select name="gradingSystem">
              ${schoolGradeSystems.map((system) => `<option value="${system.id}" ${system.id === profile.gradingSystem ? "selected" : ""}>${C.escapeHtml(system.label)}</option>`).join("")}
            </select>
          </label>
          <label>Language style
            <select name="languageStyle">
              <option value="de_ch" ${profile.languageStyle === "de_ch" ? "selected" : ""}>Swiss German wording</option>
              <option value="de_standard" ${profile.languageStyle === "de_standard" ? "selected" : ""}>Standard German wording</option>
              <option value="en_us" ${profile.languageStyle === "en_us" ? "selected" : ""}>American English wording</option>
              <option value="en_uk" ${profile.languageStyle === "en_uk" ? "selected" : ""}>British English wording</option>
              <option value="simple" ${profile.languageStyle === "simple" ? "selected" : ""}>Simple wording</option>
            </select>
          </label>
          <label class="toggle-field form-span-full ${plusAvailable ? "" : "is-muted"}">
            <input name="plusPointsEnabled" type="checkbox" ${profile.plusPointsEnabled && plusAvailable ? "checked" : ""} ${plusAvailable ? "" : "disabled"} />
            <span>Pluspunkte aktivieren</span>
            <small>${plusAvailable ? "Nur für Schweizer Gymi-Profile sichtbar." : "Pluspunkte sind nur für Schweiz + Gymnasium / Gymi verfügbar."}</small>
          </label>
        </div>
        <div class="school-settings-summary">
          <article><span>Profil</span><strong>${C.escapeHtml(profile.countryLabel)} · ${C.escapeHtml(profile.schoolLevelLabel)}</strong></article>
          <article><span>Anzeige</span><strong>${C.escapeHtml(gradeSystemBySchoolId(profile.gradingSystem).label)}</strong></article>
        </div>
        <div class="button-row">
          <button class="primary-button" type="submit">Schulsystem speichern</button>
          <button class="secondary-button reset-school-onboarding" type="button">Onboarding zurücksetzen</button>
        </div>
      </form>
    `;
  };

  const renderSettings = () => {
    const tab = state.ui.settingsTab === "plan" ? "plan" : "profile";
    return `
      <section class="settings-page account-page">
        <div class="mistake-header">
          <div><span class="eyebrow">Account</span><h1>Profil</h1></div>
          <a class="secondary-button" href="#dashboard">Zurück</a>
        </div>
        <div class="settings-tabs" role="tablist" aria-label="Account Bereiche">
          <button class="settings-tab ${tab === "profile" ? "active" : ""}" data-tab="profile" type="button">Profil</button>
          <button class="settings-tab ${tab === "plan" ? "active" : ""}" data-tab="plan" type="button">Plan</button>
        </div>
        ${tab === "plan" ? `
          <section class="account-plan-panel">
            ${renderPlanPricing()}
          </section>
        ` : `
          <section class="panel account-profile-card">
            <div class="account-profile-head">
              <div class="account-logo-wrap">${C.mascot("mascot-small")}</div>
              <div>
                <span>Profil</span>
                <h2>${C.escapeHtml(state.user.name || "Lynxly Nutzer")}</h2>
                <p>Lynxly speichert deine Daten lokal in deinem Browser.</p>
              </div>
            </div>
            <div class="account-detail-grid">
              <article><span>E-Mail</span><strong>${C.escapeHtml(state.user.email || "Keine E-Mail")}</strong></article>
              <article><span>Sicherheit</span><strong>Lokale Demo</strong></article>
              <article><span>Schule</span><strong>${C.escapeHtml(`${schoolProfile().countryLabel} · ${schoolProfile().schoolLevelLabel}`)}</strong></article>
              <button class="account-plan-open" type="button" aria-label="Plan und Preise öffnen"><span>Plan</span><strong>${C.escapeHtml(planLabel(currentPlan()))}</strong><em>Öffnen</em></button>
            </div>
            <p class="panel-note">Aktuell gibt es noch kein echtes Konto und keine Cloud-Synchronisierung. Deine Daten bleiben lokal in diesem Browser, bis du sie exportierst oder löschst.</p>
            <div class="button-row account-learning-links">
              <a class="secondary-button" href="#grades">Noten öffnen</a>
              <a class="secondary-button" href="#progress">Fortschritt öffnen</a>
              <a class="secondary-button" href="#cards">Lernkarten öffnen</a>
            </div>
            <div class="button-row account-data-actions">
              <button class="secondary-button export-local-data" type="button">Daten exportieren</button>
              <button class="secondary-button clear-generated-data" type="button">KI-Daten löschen</button>
              <button class="danger-logout delete-local-data" type="button">Alle lokalen Daten löschen</button>
            </div>
          </section>
          ${renderSchoolSettings()}
          ${renderStudyPreferences()}
          <form class="panel leaderboard-privacy-card" id="leaderboard-privacy-form">
            <div class="panel-header"><div><span>Freunde Challenge</span><h2>Privatsphäre</h2></div>${C.icon("lock")}</div>
            <label>Anzeigename<input name="displayName" maxlength="24" value="${C.escapeHtml(state.leaderboardPrivacy.displayName || state.user.name || "Du")}" placeholder="z. B. Max" /></label>
            <label class="toggle-field"><input name="visible" type="checkbox" value="on" ${state.leaderboardPrivacy.visible ? "checked" : ""} /><span>Mich in der Freunde Challenge anzeigen</span><small>Es werden nur Lernaktionen gezeigt, niemals Noten oder E-Mail.</small></label>
            <button class="secondary-button" type="submit">Privatsphäre speichern</button>
          </form>
          <form class="panel leaderboard-privacy-card class-league-form" id="class-league-form">
            <div class="panel-header"><div><span>Klassenliga</span><h2>Privatsphäre</h2></div>${C.icon("lock")}</div>
            <label>Klassen-Code<input name="classCode" value="${C.escapeHtml(state.classCode || state.classLeague.classCode || "LYNX-2B")}" placeholder="LYNX-2B" /></label>
            <label>Anzeigename<input name="displayName" maxlength="24" value="${C.escapeHtml(state.classLeaguePrivacy.displayName || state.user.name || "Du")}" placeholder="z. B. Max" /></label>
            <label class="toggle-field"><input name="joined" type="checkbox" value="on" ${state.classLeaguePrivacy.joined ? "checked" : ""} /><span>Klassenliga nutzen</span><small>Aktuell lokal als Demo gespeichert.</small></label>
            <label class="toggle-field"><input name="visible" type="checkbox" value="on" ${state.classLeaguePrivacy.visible ? "checked" : ""} /><span>Mich in der Klassenliga anzeigen</span><small>Nur XP und Lernaktionen, keine Noten oder E-Mail.</small></label>
            <button class="secondary-button" type="submit">Klassenliga speichern</button>
          </form>
          <button class="design-toggle-button" type="button">${C.icon("palette")} Design anpassen</button>
          ${renderDesignPanel()}
          <button class="danger-logout settings-logout" type="button">${C.icon("trash")} Ausloggen</button>
        `}
      </section>
    `;
  };

  const render = () => {
    ensureCollections();
    if (matchTimer) {
      clearInterval(matchTimer);
      matchTimer = null;
    }
    applyTheme();
    const route = getRoute();
    document.body.dataset.route = route;
    if (route !== location.hash.replace("#", "") && location.hash) location.hash = route;
    setActiveNav(route);
    const views = { dashboard: renderTodayDashboard, grades: renderGrades, planner: renderPlanner, cards: renderCards, mistakes: renderMistakes, progress: renderProgress, session: renderStudySession, bot: renderBot, premium: renderPremium, settings: renderSettings };
    app.classList.remove("page-enter");
    const needsSchoolOnboarding = state.user.loggedIn && state.schoolProfile?.onboardingCompleted === false;
    const viewHtml = !state.user.loggedIn ? renderOnboarding(false) : needsSchoolOnboarding ? renderOnboarding(true) : views[route]();
    app.innerHTML = `${viewHtml}${state.ui.materialSheetOpen ? renderMaterialBottomSheet() : ""}`;
    requestAnimationFrame(() => app.classList.add("page-enter"));
    bindEvents(route);
    if (route === "cards" && state.cardStudySession?.active && state.cardStudySession.mode === "match" && state.cardStudySession.matchTimed) {
      matchTimer = window.setInterval(() => {
        if (getRoute() === "cards" && state.cardStudySession?.active && state.cardStudySession.mode === "match" && state.cardStudySession.matchTimed) render();
      }, 1000);
    }
    if (route === "bot") scrollAiConversation();
    else window.scrollTo({ top: 0, behavior: "auto" });
  };

  const bindFlashcardReviewControls = () => {
    const canRate = () => getRoute() === "cards"
      && state.ui.cardStudyOpen
      && state.cardStudySession?.active
      && state.cardStudySession.mode === "cards";
    document.querySelectorAll(".study-flashcard").forEach((card) => {
      if (!canRate()) return;
      let startX = 0;
      let startY = 0;
      let activePointer = false;
      card.addEventListener("pointerdown", (event) => {
        if (event.button && event.button !== 0) return;
        startX = event.clientX;
        startY = event.clientY;
        activePointer = true;
        card.classList.remove("swipe-left", "swipe-right", "swipe-up", "swipe-down");
        card.setPointerCapture?.(event.pointerId);
      });
      card.addEventListener("pointermove", (event) => {
        if (!activePointer) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
        event.preventDefault();
        card.classList.toggle("swipe-left", dx < -45 && Math.abs(dx) > Math.abs(dy));
        card.classList.toggle("swipe-right", dx > 45 && Math.abs(dx) > Math.abs(dy));
        card.classList.toggle("swipe-up", dy < -45 && Math.abs(dy) > Math.abs(dx));
        card.classList.toggle("swipe-down", dy > 45 && Math.abs(dy) > Math.abs(dx));
      });
      const finish = (event) => {
        if (!activePointer) return;
        activePointer = false;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const rating = absX > 72 && absX > absY
          ? (dx > 0 ? "good" : "again")
          : (absY > 72 ? (dy < 0 ? "hard" : "easy") : "");
        card.classList.remove("swipe-left", "swipe-right", "swipe-up", "swipe-down");
        if (!rating) return;
        event.preventDefault();
        card.dataset.swiped = "true";
        rateCurrentStudyCard(rating);
        save();
        render();
      };
      card.addEventListener("pointerup", finish);
      card.addEventListener("pointercancel", () => {
        activePointer = false;
        card.classList.remove("swipe-left", "swipe-right", "swipe-up", "swipe-down");
      });
    });
    if (cardKeyboardBound) return;
    document.addEventListener("keydown", (event) => {
      if (!canRate()) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (["input", "textarea", "select", "button"].includes(tag)) return;
      const ratings = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      if (event.code === "Space") {
        event.preventDefault();
        document.querySelector(".study-flashcard")?.classList.toggle("flipped");
        return;
      }
      const rating = ratings[event.key];
      if (!rating) return;
      event.preventDefault();
      rateCurrentStudyCard(rating);
      save();
      render();
    });
    cardKeyboardBound = true;
  };

  const bindEvents = (route) => {
    bindFlashcardReviewControls();
    document.querySelector("#home-notification-button")?.addEventListener("click", () => {
      const shouldOpen = !state.ui.notificationCenterOpen;
      if (shouldOpen) state.notifications = state.notifications.map((note) => ({ ...note, read: true }));
      state.ui.notificationCenterOpen = false;
      save();
      state.ui.notificationCenterOpen = shouldOpen;
      render();
      if (shouldOpen) document.querySelector(".close-notification-center")?.focus();
    });
    const closeNotificationCenter = () => {
      state.ui.notificationCenterOpen = false;
      save();
      render();
    };
    document.querySelector(".close-notification-center")?.addEventListener("click", closeNotificationCenter);
    document.querySelector(".notification-center-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeNotificationCenter();
    });
    document.querySelector(".notification-center")?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNotificationCenter();
    });
    document.querySelectorAll(".notification-center-item").forEach((item) => item.addEventListener("click", () => {
      state.ui.notificationCenterOpen = false;
      save();
    }));
    document.querySelector(".notification-mark-all")?.addEventListener("click", () => {
      state.notifications = state.notifications.map((note) => ({ ...note, read: true }));
      save();
      render();
    });
    document.querySelector(".notification-settings")?.addEventListener("click", () => {
      state.ui.notificationCenterOpen = false;
      state.ui.settingsTab = "profile";
      save();
      location.hash = "#settings";
      render();
    });
    document.querySelector(".close-material-sheet")?.addEventListener("click", () => {
      state.ui.materialSheetOpen = false;
      save();
      render();
    });
    document.querySelector(".material-sheet-backdrop")?.addEventListener("click", (event) => {
      if (event.target !== event.currentTarget) return;
      state.ui.materialSheetOpen = false;
      save();
      render();
    });
    document.querySelector(".material-sheet")?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      state.ui.materialSheetOpen = false;
      save();
      render();
    });
    document.querySelectorAll("[data-material-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.materialAction || "ask";
      state.ui.materialSheetOpen = false;
      if (["scan", "pdf", "text"].includes(action)) {
        state.ui.aiNotesFocus = true;
        state.ui.aiAttachMenuOpen = action !== "text";
        state.ui.aiNotesStatus = action === "scan" ? "Wähle ein Foto deiner Notizen aus." : action === "pdf" ? "Wähle ein PDF oder Dokument aus." : "";
        location.hash = "#bot";
      } else if (action === "manual") {
        state.ui.cardCreateOpen = true;
        state.ui.cardCreateMode = "manual";
        location.hash = "#cards";
      } else {
        location.hash = "#bot";
      }
      save();
      render();
    }));
    document.querySelector(".onboarding-start")?.addEventListener("click", () => {
      state.onboarding.onboardingStep = 1;
      save();
      render();
    });
    document.querySelector(".onboarding-demo")?.addEventListener("click", () => {
      applySampleData();
      state.onboarding = {
        ...state.onboarding,
        onboardingStep: 0,
        selectedGoal: "exam",
        selectedSubject: "Mathe",
        guestMode: true,
        signInSkipped: true,
        valueMomentSeen: true,
        firstReviewCompleted: false,
        completedAt: new Date().toISOString()
      };
      state.schoolProfile = normalizeSchoolProfile({ ...schoolProfile(), onboardingCompleted: true });
      save();
      location.hash = "#dashboard";
      render();
    });
    document.querySelector(".onboarding-later")?.addEventListener("click", () => {
      signInOnboardingUser("guest");
      state.onboarding.onboardingStep = 0;
      state.onboarding.completedAt = new Date().toISOString();
      save();
      location.hash = "#dashboard";
      render();
    });
    document.querySelectorAll(".onboarding-back").forEach((button) => button.addEventListener("click", () => {
      state.onboarding.onboardingStep = Math.max(0, Number(button.dataset.step || 0));
      save();
      render();
    }));
    document.querySelector("#onboarding-goal-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = formData(event.currentTarget);
      state.onboarding.selectedGoal = data.selectedGoal || "exam";
      state.onboarding.goal = state.onboarding.selectedGoal;
      state.onboarding.onboardingStep = 2;
      save();
      render();
    });
    document.querySelector("#onboarding-subject-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = formData(event.currentTarget);
      state.onboarding.selectedSubject = String(data.selectedSubject || "Mathe").trim() || "Mathe";
      state.onboarding.targetDate = data.targetDate || "";
      state.onboarding.targetDate && (state.onboarding.firstAction = "preview");
      state.onboarding.temporaryDeck = null;
      state.onboarding.generatedPreview = null;
      state.onboarding.onboardingStep = 3;
      save();
      render();
    });
    document.querySelector("#onboarding-notes-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = formData(form);
      const file = form.elements.notesFile?.files?.[0];
      let text = String(data.uploadedNotesText || "").trim();
      let status = "";
      if (file) {
        state.onboarding.uploadedFileName = file.name || "";
        const kind = notesFileKind(file);
        if (kind === "text") {
          text = (await file.text()).slice(0, 8000).trim() || text;
          status = `${file.name} wurde lokal gelesen.`;
        } else if (kind === "pdf" || kind === "image") {
          status = `${file.name}: OCR/PDF-Auslesen ist in dieser lokalen Demo noch nicht aktiv. Du kannst Text einfügen oder mit einer Demo-Preview starten.`;
        } else {
          status = "Dieser Dateityp wird lokal noch nicht ausgelesen. Du kannst Text einfügen oder manuell starten.";
        }
      }
      state.onboarding.uploadedNotesText = text;
      state.onboarding.uploadStatus = status;
      state.onboarding.temporaryDeck = null;
      state.onboarding.generatedPreview = null;
      ensureOnboardingPreview();
      state.onboarding.onboardingStep = 4;
      save();
      render();
    });
    document.querySelector(".onboarding-manual-preview")?.addEventListener("click", () => {
      state.onboarding.uploadedNotesText = state.onboarding.uploadedNotesText || "";
      state.onboarding.uploadStatus = "Manueller Start: Lynxly erstellt ein kleines Starter-Set aus deinem Ziel und Fach.";
      state.onboarding.temporaryDeck = null;
      state.onboarding.generatedPreview = null;
      ensureOnboardingPreview();
      state.onboarding.onboardingStep = 4;
      save();
      render();
    });
    document.querySelector(".onboarding-save-start")?.addEventListener("click", () => {
      ensureOnboardingPreview();
      state.onboarding.onboardingStep = 5;
      save();
      render();
    });
    document.querySelectorAll(".onboarding-auth-choice").forEach((button) => button.addEventListener("click", () => {
      startOnboardingFirstReview(button.dataset.method || "email");
    }));
    document.querySelectorAll(".onboarding-guest-start").forEach((button) => button.addEventListener("click", () => {
      startOnboardingFirstReview("guest");
    }));
    document.querySelector(".settings-logout")?.addEventListener("click", () => {
      state.user.loggedIn = false;
      state.ui.cardCreateOpen = false;
      save();
      location.hash = "#dashboard";
      render();
    });
    document.querySelector(".export-local-data")?.addEventListener("click", () => {
      const payload = JSON.stringify(state, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lynxly-data-${todayIso()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
    document.querySelector(".clear-generated-data")?.addEventListener("click", () => {
      state.generatedStudySets = [];
      state.ui.aiNotesDraft = "";
      state.ui.aiNotesFileName = "";
      state.ui.aiNotesFileType = "";
      state.ui.aiNotesFileSize = "";
      state.ui.aiNotesStatus = "";
      state.ui.aiNotesPreview = "";
      state.ui.aiNotesError = "";
      state.ui.aiGenerationLastMode = "";
      state.ui.aiGenerationSource = "";
      save();
      pushNotification("KI-Daten gelöscht", "Notiz-Upload und generierte Set-Historie wurden lokal entfernt.");
      render();
    });
    document.querySelector(".delete-local-data")?.addEventListener("click", () => {
      if (!window.confirm("Alle lokalen Lynxly-Daten in diesem Browser löschen?")) return;
      localStorage.removeItem("studyup-state-v6");
      state = window.StudyUpStorage.load();
      ensureCollections();
      save();
      location.hash = "#dashboard";
      render();
    });
      document.querySelector("#study-preferences-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
      const form = event.currentTarget;
      const data = formData(form);
      const presetGoal = data.dailyGoalPreset === "custom" ? Number(data.customDailyGoal || 5) : Number(data.dailyGoalPreset || 5);
      state.settings.dailyGoalMinutes = Math.max(2, Math.min(60, presetGoal));
      state.settings.customDailyGoalMinutes = Math.max(2, Math.min(60, Number(data.customDailyGoal || presetGoal)));
      state.settings.preferredDailyAction = data.preferredDailyAction || "smart";
      state.settings.focusSize = data.focusSize || "short";
      state.settings.dashboardVisibility = {
        streak: form.elements.showStreak.checked,
        progress: form.elements.showProgress.checked,
        aiCoach: form.elements.showCoach.checked,
        grades: form.elements.showGrades.checked,
        planner: form.elements.showPlanner.checked
      };
      state.settings.reminderPreferences = {
        showOnHome: form.elements.showReminders.checked,
        testDays: Number(data.testDays || 3),
        assignmentDays: Number(data.assignmentDays || 3),
        showOverdue: form.elements.showOverdue.checked
      };
      state.settings.dashboardDensity = data.dashboardDensity || "comfortable";
      state.settings.mascotVisible = form.elements.mascotVisible.checked;
      state.settings.reducedAnimations = form.elements.reducedAnimations.checked;
      state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
      save();
      pushNotification("Präferenzen gespeichert", "Home und Tagesfokus wurden angepasst.");
      render();
    });
    bindSchoolLevelSync("#settings-school-country", "#settings-school-level");
    document.querySelector("#school-settings-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = formData(form);
      state.schoolProfile = buildSchoolProfile({
        ...data,
        plusPointsEnabled: form.elements.plusPointsEnabled?.checked ? "on" : ""
      }, state.schoolProfile, true);
      state.settings.gradeSystem = state.schoolProfile.appGradeSystem;
      state.settings.language = state.schoolProfile.language;
      state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
      save();
      pushNotification("Schulsystem gespeichert", "Lynxly passt Home, Noten und Erinnerungen an.");
      render();
    });
    document.querySelector(".reset-school-onboarding")?.addEventListener("click", () => {
      state.schoolProfile = { ...schoolProfile(), onboardingCompleted: false };
      save();
      render();
    });
    document.querySelectorAll(".settings-tab").forEach((button) => button.addEventListener("click", () => {
      state.ui.settingsTab = button.dataset.tab || "profile";
      save();
      render();
    }));
    document.querySelector(".account-plan-open")?.addEventListener("click", () => {
      state.ui.settingsTab = "plan";
      save();
      render();
    });
    document.querySelector("#leaderboard-privacy-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = formData(event.currentTarget);
      state.leaderboardPrivacy.displayName = String(data.displayName || state.user.name || "Du").trim().slice(0, 24) || "Du";
      state.leaderboardPrivacy.visible = data.visible === "on";
      save();
      render();
    });
    document.querySelectorAll(".progress-tab").forEach((button) => button.addEventListener("click", () => {
      state.ui.progressTab = button.dataset.tab || "me";
      save();
      render();
    }));
    document.querySelectorAll(".progress-tab-jump").forEach((button) => button.addEventListener("click", () => {
      state.ui.progressTab = button.dataset.tab || "me";
      save();
      render();
    }));
    document.querySelectorAll(".weak-topic-review").forEach((button) => button.addEventListener("click", () => {
      const subject = button.dataset.subject || "";
      const deck = personalDecks().find((item) => item.subject === subject || item.title.includes(subject));
      if (deck) {
        prepareDeckForStudy("personal", { subject: deck.title });
        startDeckSession("learn");
        location.hash = "#cards";
      } else {
        startMistakeReviewSession({
          subject,
          limit: 5,
          reason: `Empfohlen, weil ${subject || "dieses Thema"} aktuell offene Fehler hat.`
        });
      }
      save();
      render();
    }));
    document.querySelector("#class-league-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = formData(event.currentTarget);
      state.classCode = String(data.classCode || "LYNX-2B").trim().slice(0, 18) || "LYNX-2B";
      state.classLeague.classCode = state.classCode;
      state.classLeaguePrivacy.displayName = String(data.displayName || state.user.name || "Du").trim().slice(0, 24) || "Du";
      state.classLeaguePrivacy.joined = data.joined === "on";
      state.classLeaguePrivacy.visible = data.visible === "on" && state.classLeaguePrivacy.joined;
      save();
      render();
    });
    document.querySelector(".design-toggle-button")?.addEventListener("click", () => {
      state.ui.designOpen = !state.ui.designOpen;
      save();
      render();
    });
    document.querySelectorAll(".setting-pick").forEach((button) => button.addEventListener("click", () => {
      const name = button.dataset.name;
      const value = button.dataset.value;
      if (!name || value === undefined) return;
      if ((name === "accent" || name === "cardStyle") && !isPlus()) return;
      state.settings[name] = value;
      save();
      render();
    }));
    document.querySelectorAll(".billing-cycle").forEach((button) => button.addEventListener("click", () => {
      state.settings.billingCycle = button.dataset.cycle === "monthly" ? "monthly" : "annual";
      save();
      render();
    }));
    document.querySelectorAll(".activate-plan").forEach((button) => button.addEventListener("click", async () => {
      const plan = button.dataset.plan;
      if (plan !== "plus") return;
      if (currentPlan() === "plus") return;
      pushNotification("Zahlung noch nicht verbunden", "Plus kann in dieser lokalen Demo nicht gekauft werden. Nach deiner ersten Lernrunde kannst du die 7-Tage-Testphase starten.");
      save();
      render();
    }));
    document.querySelector(".start-plus-trial")?.addEventListener("click", async () => {
      await startPlusTrial();
      save();
      render();
    });
    document.querySelector(".activate-exam-pass")?.addEventListener("click", async () => {
      try {
        const response = await fetch("/api/exam-pass/activate-demo", { method: "POST", headers: entitlementHeaders({ "Content-Type": "application/json" }), credentials: "same-origin" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Exam Pass konnte nicht aktiviert werden.");
        updateEntitlementCache(data.entitlement);
        pushNotification("Exam Pass aktiv", "Demo: Exam Pass ist 14 Tage aktiv. Kein echtes Payment wurde ausgelöst.");
      } catch (error) {
        pushNotification("Exam Pass nicht aktiv", error.message || "Bitte später erneut versuchen.");
      }
      save();
      render();
    });
    document.querySelector("#pro-waitlist-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = formData(form);
      const action = form.querySelector(".join-pro-waitlist")?.dataset.action || "join";
      try {
        if (action === "join" && values.consent !== "on") {
          pushNotification("Einwilligung fehlt", "Bitte bestätige, dass Lynxly dich über Pro informieren darf.");
          return;
        }
        const response = await fetch("/api/pro/waitlist", {
          method: "POST",
          headers: entitlementHeaders({ "Content-Type": "application/json" }),
          credentials: "same-origin",
          body: JSON.stringify({ action, email: values.email || "", consent: values.consent === "on" })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Warteliste konnte nicht gespeichert werden.");
        updateEntitlementCache(data.entitlement);
        pushNotification("Pro-Warteliste", data.message || "Gespeichert.");
      } catch (error) {
        pushNotification("Warteliste nicht gespeichert", error.message || "Bitte später erneut versuchen.");
      }
      save();
      render();
    });
    document.querySelector(".dismiss-plus-trial")?.addEventListener("click", () => {
      state.onboarding.plusTrialDismissedAt = new Date().toISOString();
      save();
      render();
    });
    document.querySelectorAll(".notify-now").forEach((button) => button.addEventListener("click", requestNotifications));
    document.querySelector(".start-study-session")?.addEventListener("click", () => {
      state.mistakeReviewSession = defaultMistakeReviewSession();
      state.ui.studySessionStep = 0;
      state.ui.studySessionCardIndex = 0;
      location.hash = "#session";
      pushNotification("Lerneinheit gestartet", "Lynxly führt dich durch Fehler, Karten und Mini-Check.");
      save();
      render();
    });
    document.querySelector(".today-focus-action")?.addEventListener("click", (event) => {
      const type = event.currentTarget.dataset.focusType || "session";
      if (type === "cards") {
        startBestStudySession({ mode: "learn", focusType: "cards" });
      } else if (type === "mistakes") {
        const focus = getTodaysFocus();
        startBestStudySession({ mode: "learn", focusType: "mistakes", subject: focus.subject, limit: focus.target, reason: focus.reason });
      } else if (type === "grade-risk") {
        const focus = getTodaysFocus();
        startBestStudySession({ mode: "learn", focusType: "grade-risk", subject: focus.subject, limit: focus.target, reason: focus.reason });
      } else if (type === "upload") {
        state.ui.aiNotesFocus = true;
        location.hash = "#bot";
      } else if (type === "material") {
        state.ui.materialSheetOpen = true;
      } else if (type === "planner") {
        state.ui.showEventForm = true;
        state.ui.selectedPlannerDate = todayIso();
        location.hash = "#planner";
      } else if (type === "grades") {
        location.hash = "#grades";
      } else {
        startBestStudySession({ mode: "learn" });
        pushNotification("Fokus gestartet", "Lynxly führt dich durch einen kleinen Lernschritt.");
      }
      save();
      render();
    });
    document.querySelectorAll(".start-grade-study").forEach((button) => button.addEventListener("click", () => {
      const subject = button.dataset.subject || gradeRiskSubjects()[0]?.subject?.name || "";
      startBestStudySession({ mode: "learn", focusType: "grade-risk", subject, reason: subject ? `Empfohlen, weil ${subject} unter deiner Zielnote liegt.` : "Empfohlen aus deinen Noten." });
      state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
      save();
      render();
    }));
    document.querySelector(".refresh-today-focus")?.addEventListener("click", () => {
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      });
      document.querySelector(".request-notifications-button")?.addEventListener("click", () => {
        requestNotifications();
      });

    if (route === "session") {
      document.querySelector("#mistake-review-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        answerMistakeReview(formData(event.currentTarget).answer || "");
        save();
        render();
      });
      document.querySelectorAll(".reveal-mistake-explanation").forEach((button) => button.addEventListener("click", () => {
        revealMistakeExplanation();
        save();
        render();
      }));
      document.querySelectorAll(".retry-mistake-review").forEach((button) => button.addEventListener("click", () => {
        state.mistakeReviewSession.phase = "question";
        state.mistakeReviewSession.answer = "";
        save();
        render();
      }));
      document.querySelectorAll(".next-mistake-review").forEach((button) => button.addEventListener("click", () => {
        advanceMistakeReview();
        save();
        render();
      }));
      document.querySelector(".restart-mistake-review")?.addEventListener("click", () => {
        startMistakeReviewSession({ limit: 5, reason: "Wiederhole die noch offenen Punkte in einer kurzen Runde." });
        save();
        render();
      });
      document.querySelectorAll(".session-step-tab").forEach((button) => button.addEventListener("click", () => {
        state.ui.studySessionStep = Math.min(3, Math.max(0, Number(button.dataset.step || 0)));
        save();
        render();
      }));
      document.querySelectorAll(".session-fix-mistake").forEach((button) => button.addEventListener("click", () => {
        const mistake = state.mistakes.find((item) => item.id === button.dataset.id);
        markMistakeFixed(mistake);
        save();
        render();
      }));
      document.querySelector(".session-card-prev")?.addEventListener("click", () => {
        state.ui.studySessionCardIndex = Math.max(0, Number(state.ui.studySessionCardIndex || 0) - 1);
        save();
        render();
      });
      document.querySelector(".session-card-next")?.addEventListener("click", () => {
        state.ui.studySessionCardIndex = Math.min(sessionCards().length - 1, Number(state.ui.studySessionCardIndex || 0) + 1);
        save();
        render();
      });
      document.querySelectorAll(".session-rate-card").forEach((button) => button.addEventListener("click", () => {
        const cards = sessionCards();
        const index = Math.min(Math.max(0, Number(state.ui.studySessionCardIndex || 0)), Math.max(0, cards.length - 1));
        const card = cards[index];
        if (card) scheduleCardReview(card, button.dataset.rating, { rewardCard: true, mistakeReward: false });
        state.ui.studySessionCardIndex = Math.min(index + 1, Math.max(0, cards.length - 1));
        save();
        render();
      }));
      document.querySelector("#session-check-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        if (data.summary?.trim()) {
          state.studyTasks.unshift({ id: uid("task"), subject: "Mini-Check", title: data.summary.trim().slice(0, 90), date: todayIso(), done: true });
        }
        state.ui.studySessionStep = 3;
        save();
        render();
      });
      document.querySelector(".complete-study-session")?.addEventListener("click", () => {
        updateStreak();
        trackStudyAction("studySession");
        state.ui.studySessionStep = 0;
        state.ui.studySessionCardIndex = 0;
        pushNotification("Session abgeschlossen", "Deine Lernserie wurde aktualisiert.");
        save();
        location.hash = "#dashboard";
        render();
      });
    }

    if (route === "grades") {
      const selectedSubject = gradeSubjectById(state.ui.selectedGradeSubject);
      const selectedPartial = selectedSubject ? gradeEntryById(selectedSubject, state.ui.selectedPartialGroup) : null;
      document.querySelector("#toggle-subject-form")?.addEventListener("click", () => {
        state.ui.showSubjectForm = !state.ui.showSubjectForm;
        state.ui.selectedGradeSubject = null;
        state.ui.selectedPartialGroup = null;
        save();
        render();
      });
      document.querySelector("#subject-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        const name = String(data.name || "").trim();
        const weight = parseNumberInput(data.weight, 1);
        if (!name) {
          pushNotification("Fach fehlt", "Gib zuerst ein Fach ein.");
          return;
        }
        if (!Number.isFinite(weight) || weight <= 0) {
          pushNotification("Gewichtung prüfen", "Die Gewichtung muss positiv sein.");
          return;
        }
        state.subjects.push({
          id: uid("sub"),
          name,
          weight,
          targetGrade: "",
          nextExamDate: "",
          color: "",
          icon: "",
          relatedDeckIds: [],
          relatedTopics: [],
          gradeMode: "simple",
          gradeCategories: defaultGradeCategories(),
          grades: []
        });
        state.ui.showSubjectForm = false;
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      });
      document.querySelector(".subject-suggest-toggle")?.addEventListener("click", (event) => {
        const combo = event.currentTarget.closest("[data-subject-combo]");
        const open = !combo.classList.contains("open");
        combo.classList.toggle("open", open);
        event.currentTarget.setAttribute("aria-expanded", String(open));
      });
      document.querySelectorAll(".subject-suggestions button").forEach((button) => button.addEventListener("click", () => {
        const combo = button.closest("[data-subject-combo]");
        const input = combo?.querySelector("input[name='name']");
        if (input) {
          input.value = button.dataset.subject || button.textContent.trim();
          input.focus();
        }
        combo?.classList.remove("open");
        combo?.querySelector(".subject-suggest-toggle")?.setAttribute("aria-expanded", "false");
      }));
      document.querySelector("[data-subject-combo] input")?.addEventListener("input", (event) => {
        const combo = event.currentTarget.closest("[data-subject-combo]");
        combo?.classList.remove("open");
        combo?.querySelector(".subject-suggest-toggle")?.setAttribute("aria-expanded", "false");
      });
      document.querySelector("[data-subject-combo] input")?.addEventListener("focus", (event) => {
        const combo = event.currentTarget.closest("[data-subject-combo]");
        combo?.classList.remove("open");
        combo?.querySelector(".subject-suggest-toggle")?.setAttribute("aria-expanded", "false");
      });
      const openGradeSubject = (subjectId, row = null) => {
        if (!subjectId) return;
        if (row) {
          row.classList.remove("show-actions");
          delete row.dataset.swiped;
          delete row.dataset.swipedAt;
        }
        state.ui.selectedGradeSubject = subjectId;
        state.ui.selectedPartialGroup = null;
        state.ui.showSubjectForm = false;
        state.ui.showGradeEntryForm = false;
        state.ui.showTargetGradeForm = false;
        state.ui.showPartialEntryForm = false;
        state.ui.editingGradeId = "";
        save();
        render();
      };
      document.querySelectorAll(".grade-folder").forEach((button) => button.addEventListener("click", () => {
        const row = button.closest(".subject-folder-row");
        const swipedAt = Number(row?.dataset.swipedAt || 0);
        if (row?.dataset.swiped === "true" && Date.now() - swipedAt < 350) {
          delete row.dataset.swiped;
          delete row.dataset.swipedAt;
          return;
        }
        if (row) {
          row.classList.remove("show-actions");
          delete row.dataset.swiped;
          delete row.dataset.swipedAt;
        }
        openGradeSubject(button.dataset.id || row?.dataset.subjectId, row);
      }));
      document.querySelectorAll(".delete-subject").forEach((button) => button.addEventListener("click", (event) => {
        event.stopPropagation();
        const subject = gradeSubjectById(button.dataset.id);
        if (!subject) return;
        if ((subject.grades || []).length) {
          pushNotification("Fach enthält Noten", "Lösche zuerst die Noten in diesem Fach, damit nichts verloren geht.");
          save();
          render();
          return;
        }
        if (!window.confirm(`${subject.name} wirklich löschen?`)) return;
        state.subjects = state.subjects.filter((subject) => subject.id !== button.dataset.id);
        if (state.ui.selectedGradeSubject === button.dataset.id) state.ui.selectedGradeSubject = null;
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      }));
      document.querySelector(".back-to-subjects")?.addEventListener("click", () => {
        state.ui.selectedGradeSubject = null;
        state.ui.selectedPartialGroup = null;
        state.ui.showGradeEntryForm = false;
        state.ui.showTargetGradeForm = false;
        state.ui.showPartialEntryForm = false;
        state.ui.editingGradeId = "";
        save();
        render();
      });
      document.querySelector(".back-to-subject-detail")?.addEventListener("click", () => {
        state.ui.selectedPartialGroup = null;
        state.ui.showPartialEntryForm = false;
        save();
        render();
      });
      document.querySelector("#toggle-grade-entry-form")?.addEventListener("click", () => {
        const willOpen = !state.ui.showGradeEntryForm;
        state.ui.showGradeEntryForm = willOpen;
        state.ui.editingGradeId = "";
        state.ui.showPartialWeightForm = false;
        save();
        render();
      });
      document.querySelector(".target-grade-button")?.addEventListener("click", () => {
        state.ui.showTargetGradeForm = !state.ui.showTargetGradeForm;
        save();
        render();
      });
      document.querySelector("#target-grade-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        if (selectedSubject) {
          if (data.targetGrade && !gradeIsValid(data.targetGrade)) {
            pushNotification("Wunschnote prüfen", `Die Wunschnote muss zwischen ${gradeRangeText()} liegen.`);
            save();
            render();
            return;
          }
          selectedSubject.targetGrade = data.targetGrade || "";
          state.ui.targetGradeWeight = data.targetWeight || "1";
          state.ui.targetGradeCategoryId = data.targetCategoryId || "";
        }
        state.ui.showTargetGradeForm = false;
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      });
      document.querySelectorAll(".grade-mode-option").forEach((button) => button.addEventListener("click", () => {
        if (!selectedSubject) return;
        selectedSubject.gradeMode = button.dataset.mode || "simple";
        state.ui.whatIfResult = null;
        state.ui.showGradeEntryForm = false;
        state.ui.editingGradeId = "";
        save();
        render();
      }));
      document.querySelector(".category-normalize-toggle")?.addEventListener("change", (event) => {
        if (!selectedSubject) return;
        selectedSubject.normalizeCategories = event.currentTarget.checked;
        save();
        render();
      });
      document.querySelector("#category-add-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedSubject) return;
        const data = formData(event.currentTarget);
        selectedSubject.gradeCategories.push({
          id: uid("cat"),
          name: String(data.name || "").trim() || "Kategorie",
          percentage: Math.max(0, Number(data.percentage || 0))
        });
        save();
        render();
      });
      document.querySelectorAll(".category-name-input").forEach((input) => input.addEventListener("change", () => {
        if (!selectedSubject) return;
        const category = gradeCategoryById(selectedSubject, input.dataset.id);
        if (!category) return;
        category.name = input.value.trim() || "Kategorie";
        save();
        render();
      }));
      document.querySelectorAll(".category-percent-input").forEach((input) => input.addEventListener("change", () => {
        if (!selectedSubject) return;
        const category = gradeCategoryById(selectedSubject, input.dataset.id);
        if (!category) return;
        category.percentage = Math.max(0, Number(input.value || 0));
        save();
        render();
      }));
      document.querySelectorAll(".delete-category").forEach((button) => button.addEventListener("click", () => {
        if (!selectedSubject || selectedSubject.gradeCategories.length <= 1) return;
        selectedSubject.gradeCategories = selectedSubject.gradeCategories.filter((category) => category.id !== button.dataset.id);
        selectedSubject.grades.forEach((grade) => {
          if (grade.categoryId === button.dataset.id) grade.categoryId = "";
        });
        save();
        render();
      }));
      document.querySelectorAll(".weight-quick").forEach((button) => button.addEventListener("click", () => {
        const input = document.querySelector(`#${button.dataset.target}`);
        if (input) input.value = button.dataset.weight || "1";
      }));
      document.querySelector("#what-if-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        const subject = gradeSubjectById(state.ui.selectedGradeSubject);
        if (!subject || data.value === "") return;
        const value = parseNumberInput(data.value);
        if (!Number.isFinite(value) || !gradeIsValid(value)) {
          pushNotification("Note prüfen", `Die Note muss zwischen ${gradeRangeText()} liegen.`);
          save();
          render();
          return;
        }
        const weight = parseWeightInput(data.weight, 1);
        const categoryId = subject.gradeMode === "category" ? (data.categoryId || subject.gradeCategories?.[0]?.id || "") : "";
        state.ui.whatIfResult = {
          subjectId: subject.id,
          title: String(data.title || "").trim(),
          value,
          weight,
          categoryId,
          average: projectSubjectAverage(subject, value, { weight, categoryId })
        };
        save();
        render();
      });
      document.querySelector(".save-what-if-grade")?.addEventListener("click", () => {
        const subject = gradeSubjectById(state.ui.selectedGradeSubject);
        const result = state.ui.whatIfResult;
        if (!subject || !result || result.subjectId !== subject.id) return;
        const examNumber = subject.grades.filter((grade) => grade.type !== "partial").length + 1;
        const examLabel = schoolLabels().examNoun;
        subject.grades.push({
          id: uid("grade"),
          type: "exam",
          title: result.title || `${examLabel} ${examNumber}`,
          date: todayIso(),
          value: Number(result.value),
          weight: parseWeightInput(result.weight, 1),
          categoryId: result.categoryId || ""
        });
        state.ui.whatIfResult = null;
        save();
        render();
      });
      document.querySelector("#grade-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        const subject = gradeSubjectById(state.ui.selectedGradeSubject);
        if (!subject) return;
        const existingGrade = data.gradeId ? gradeEntryById(subject, data.gradeId) : null;
        const categoryId = subject.gradeMode === "category" ? (data.categoryId || subject.gradeCategories?.[0]?.id || "") : "";
        const weight = parseWeightInput(data.weight, 1);
        if (!existingGrade && data.isPartialFolder === "on") {
          const folderNumber = subject.grades.filter((grade) => grade.type === "partial").length + 1;
          const title = String(data.title || "").trim() || `Noten-Ordner ${folderNumber}`;
          const nextFolder = {
            id: uid("partial"),
            type: "partial",
            title,
            date: data.date || todayIso(),
            weight,
            categoryId,
            partialGrades: []
          };
          subject.grades.push(nextFolder);
          state.ui.selectedPartialGroup = nextFolder.id;
          state.ui.showPartialEntryForm = true;
        } else if (data.value !== "") {
        const value = parseNumberInput(data.value);
          if (!Number.isFinite(value) || !gradeIsValid(value)) {
            pushNotification("Note prüfen", `Die Note muss zwischen ${gradeRangeText()} liegen.`);
            save();
            render();
            return;
          }
          const examNumber = subject.grades.filter((grade) => grade.type !== "partial").length + 1;
          const title = String(data.title || "").trim() || (existingGrade?.title || `${schoolLabels().examNoun} ${examNumber}`);
          const nextGrade = {
            id: existingGrade?.id || uid("grade"),
            type: data.type || existingGrade?.type || "Prüfung",
            title,
            date: data.date || todayIso(),
            value,
            weight,
            categoryId,
            topic: String(data.topic || "").trim(),
            comment: String(data.comment || "").trim(),
            linkedDeckId: existingGrade?.linkedDeckId || "",
            linkedPlanTaskId: existingGrade?.linkedPlanTaskId || ""
          };
          if (existingGrade) Object.assign(existingGrade, nextGrade);
          else subject.grades.push(nextGrade);
        } else {
          return;
        }
        state.ui.showGradeEntryForm = false;
        state.ui.whatIfResult = null;
        state.ui.editingGradeId = "";
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      });
      document.querySelectorAll(".grade-ai-prompt").forEach((button) => button.addEventListener("click", () => {
        const subject = gradeSubjectById(button.dataset.subject);
        if (!subject) return;
        const action = button.dataset.action || "goal";
        const prompts = {
          goal: `Wie erreiche ich meine Zielnote in ${subject.name}?`,
          plan: `Erstelle einen kurzen Lernplan für ${subject.name}.`,
          quiz: `Erstelle ein kurzes Quiz für mein schwaches Thema in ${subject.name}.`
        };
        state.chat.push({ id: uid("msg"), role: "user", text: prompts[action] || prompts.goal });
        state.chat.push({ id: uid("msg"), role: "bot", text: gradeAdviceMarkdown(subject, action) });
        save();
        location.hash = "#bot";
        render();
      }));
      document.querySelectorAll(".edit-grade-entry").forEach((button) => button.addEventListener("click", () => {
        const row = button.closest(".grade-swipe-row");
        if (row?.dataset.swiped === "true") {
          delete row.dataset.swiped;
          return;
        }
        state.ui.editingGradeId = button.dataset.id || "";
        state.ui.showGradeEntryForm = true;
        state.ui.showTargetGradeForm = false;
        state.ui.whatIfResult = null;
        save();
        render();
      }));
      const openPartialFolder = (folderId, row) => {
        if (row?.dataset.swiped === "true") {
          delete row.dataset.swiped;
          return;
        }
        if (!folderId) return;
        state.ui.selectedPartialGroup = folderId;
        state.ui.showPartialEntryForm = false;
        state.ui.showGradeEntryForm = false;
        state.ui.showTargetGradeForm = false;
        state.ui.showPartialWeightForm = false;
        save();
        render();
      };
      document.querySelectorAll(".open-partial-folder").forEach((button) => button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openPartialFolder(button.dataset.id, button.closest(".grade-swipe-row"));
      }));
      document.querySelectorAll(".partial-folder-row").forEach((row) => row.addEventListener("click", (event) => {
        if (event.target.closest(".delete-grade")) return;
        openPartialFolder(row.dataset.partialId, row);
      }));
      document.querySelector("#toggle-partial-entry-form")?.addEventListener("click", () => {
        state.ui.showPartialEntryForm = !state.ui.showPartialEntryForm;
        state.ui.showPartialWeightForm = false;
        save();
        render();
      });
      document.querySelector(".partial-weight-button")?.addEventListener("click", () => {
        state.ui.showPartialWeightForm = !state.ui.showPartialWeightForm;
        state.ui.showPartialEntryForm = false;
        save();
        render();
      });
      document.querySelector("#partial-weight-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        if (selectedPartial?.type === "partial") selectedPartial.weight = parseWeightInput(data.weight, 1);
        state.ui.showPartialWeightForm = false;
        save();
        render();
      });
      document.querySelector("#partial-grade-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        if (selectedPartial?.type === "partial" && data.value !== "") {
          const value = parseNumberInput(data.value);
          if (!Number.isFinite(value) || !gradeIsValid(value)) {
            pushNotification("Note prüfen", `Die Note muss zwischen ${gradeRangeText()} liegen.`);
            save();
            render();
            return;
          }
          const partNumber = selectedPartial.partialGrades.length + 1;
          const title = String(data.title || "").trim() || `Teilprüfung ${partNumber}`;
          selectedPartial.partialGrades.push({ id: uid("part"), title, date: data.date || todayIso(), value });
        }
        state.ui.showPartialEntryForm = false;
        save();
        render();
      });
      document.querySelectorAll(".delete-grade").forEach((button) => button.addEventListener("click", (event) => {
        event.stopPropagation();
        const subject = gradeSubjectById(state.ui.selectedGradeSubject);
        if (!subject) return;
        if (!window.confirm("Diese Note wirklich löschen?")) return;
        const partialId = button.dataset.partial;
        if (partialId) {
          const partial = gradeEntryById(subject, partialId);
          if (partial?.partialGrades) partial.partialGrades = partial.partialGrades.filter((entry) => entry.id !== button.dataset.grade);
        } else {
          subject.grades = subject.grades.filter((grade) => grade.id !== button.dataset.grade);
          if (state.ui.selectedPartialGroup === button.dataset.grade) state.ui.selectedPartialGroup = null;
        }
        if (state.ui.editingGradeId === button.dataset.grade) state.ui.editingGradeId = "";
        save();
        render();
      }));
      document.querySelectorAll(".grade-swipe-row, .subject-folder-row").forEach((row) => {
        let startX = 0;
        let startY = 0;
        let startOffset = 0;
        let currentOffset = 0;
        let dragging = false;
        let moved = false;
        let tapCanceled = false;
        const swipeWidth = 90;
        const setSwipeOffset = (value) => {
          currentOffset = Math.max(0, Math.min(swipeWidth, value));
          row.style.setProperty("--swipe-offset", `${currentOffset}px`);
          row.classList.toggle("swiping", dragging);
        };
        const finishSwipe = () => {
          if (!dragging) return;
          dragging = false;
          row.classList.remove("swiping");
          row.style.removeProperty("--swipe-offset");
          if (row.classList.contains("subject-folder-row") && !moved && !tapCanceled) {
            openGradeSubject(row.dataset.subjectId || row.querySelector(".grade-folder")?.dataset.id, row);
            return;
          }
          const openedActions = moved && currentOffset > swipeWidth * 0.38;
          row.classList.toggle("show-actions", openedActions);
          if (openedActions) {
            row.dataset.swiped = "true";
            row.dataset.swipedAt = String(Date.now());
          }
        };
        row.addEventListener("pointerdown", (event) => {
          if (event.button && event.button !== 0) return;
          if (event.target.closest(".delete-grade, .delete-subject")) return;
          startX = event.clientX || 0;
          startY = event.clientY || 0;
          startOffset = row.classList.contains("show-actions") ? swipeWidth : 0;
          currentOffset = startOffset;
          dragging = true;
          moved = false;
          tapCanceled = false;
          row.setPointerCapture?.(event.pointerId);
        });
        row.addEventListener("pointermove", (event) => {
          if (!dragging) return;
          const deltaX = startX - (event.clientX || startX);
          const deltaY = Math.abs(startY - (event.clientY || startY));
          if (Math.abs(deltaX) > 10 || deltaY > 10) tapCanceled = true;
          if (Math.abs(deltaX) < 12 && deltaY < 10) return;
          if (deltaY > Math.abs(deltaX) + 8) return;
          if (Math.abs(deltaX) > 16) moved = true;
          if (moved) event.preventDefault();
          setSwipeOffset(startOffset + deltaX);
        });
        row.addEventListener("pointerup", finishSwipe);
        row.addEventListener("pointercancel", finishSwipe);
      });
    }

    if (route === "planner") {
      document.querySelectorAll(".planner-view-tab").forEach((button) => button.addEventListener("click", () => {
        state.ui.plannerView = button.dataset.view === "month" ? "month" : "agenda";
        save();
        render();
      }));
      document.querySelector(".planner-prev-month")?.addEventListener("click", () => {
        state.ui.plannerMonthOffset = Number(state.ui.plannerMonthOffset || 0) - 1;
        save();
        render();
      });
      document.querySelector(".planner-next-month")?.addEventListener("click", () => {
        state.ui.plannerMonthOffset = Number(state.ui.plannerMonthOffset || 0) + 1;
        save();
        render();
      });
      document.querySelector("#toggle-event-form")?.addEventListener("click", () => {
        state.ui.showEventForm = !state.ui.showEventForm;
        save();
        render();
      });
      document.querySelector(".planner-empty-add")?.addEventListener("click", () => {
        state.ui.showEventForm = true;
        save();
        render();
      });
      document.querySelectorAll(".calendar-cell[data-date]").forEach((button) => button.addEventListener("click", () => {
        state.ui.selectedPlannerDate = button.dataset.date || todayIso();
        save();
        render();
      }));
      document.querySelectorAll(".planner-item-open").forEach((button) => button.addEventListener("click", () => {
        state.ui.selectedPlannerDate = button.dataset.date || todayIso();
        state.ui.plannerView = "month";
        save();
        render();
      }));
      document.querySelectorAll(".planner-item-start").forEach((button) => button.addEventListener("click", () => {
        const subject = button.dataset.subject || "";
        startBestStudySession({ mode: "learn", subject, reason: subject ? `Geplant aus deinem Kalender: ${subject}.` : "Geplant aus deinem Kalender." });
        save();
        render();
      }));
      document.querySelectorAll(".planner-item-complete").forEach((button) => button.addEventListener("click", () => {
        const id = button.dataset.id;
        const kind = button.dataset.kind;
        if (kind === "exam") {
          const exam = state.exams.find((item) => item.id === id);
          if (exam) exam.completed = true;
        } else if (kind === "homework") {
          const task = state.homework.find((item) => item.id === id);
          if (task) task.status = "Erledigt";
        } else {
          const item = state.planEvents.find((entry) => entry.id === id);
          if (item) item.done = true;
        }
        pushNotification("Erledigt gespeichert", "Der Eintrag wurde als erledigt markiert.");
        save();
        render();
      }));
      document.querySelectorAll(".planner-item-reschedule").forEach((button) => button.addEventListener("click", () => {
        const id = button.dataset.id;
        const kind = button.dataset.kind;
        if (kind === "exam") {
          const exam = state.exams.find((item) => item.id === id);
          if (exam) exam.date = addDays(exam.date, 1);
        } else if (kind === "homework") {
          const task = state.homework.find((item) => item.id === id);
          if (task) task.dueDate = addDays(task.dueDate, 1);
        } else {
          const item = state.planEvents.find((entry) => entry.id === id);
          if (item) item.date = addDays(item.date, 1);
        }
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      }));
      document.querySelectorAll(".planner-item-delete").forEach((button) => button.addEventListener("click", () => {
        const id = button.dataset.id;
        const kind = button.dataset.kind;
        if (kind === "exam") state.exams = state.exams.filter((item) => item.id !== id);
        else if (kind === "homework") state.homework = state.homework.filter((item) => item.id !== id);
        else state.planEvents = state.planEvents.filter((item) => item.id !== id);
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      }));
      document.querySelector(".generate-study-plan-now")?.addEventListener("click", () => {
        const nextExam = state.exams.filter((exam) => dayDelta(exam.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
        if (nextExam) {
          const events = createAutoPlan({
            subject: nextExam.subject,
            title: nextExam.title,
            date: nextExam.date,
            minutes: nextExam.minutesPerDay || state.settings.dailyGoalMinutes || 10,
            topics: nextExam.topics?.length ? nextExam.topics : topicList(nextExam.title || nextExam.subject),
            linkedExamId: nextExam.id
          });
          state.planEvents.unshift(...events);
          events.forEach(() => trackStudyAction("studyTaskAdded"));
          pushNotification("Study Plan erstellt", `${events.length} Lernblöcke für ${nextExam.subject} wurden eingetragen.`);
        } else {
          const weak = weakestSubject();
          const mistakes = openMistakes().slice(0, 4).map((mistake) => `${mistake.subject}: ${mistake.topic || mistake.question}`).join("\n");
          const plan = createPlanFromNotes(mistakes || `${weak?.name || "Lernen"} Grundlagen wiederholen\nStudy Cards erstellen\nMini-Quiz lösen`);
          pushNotification("Study Plan erstellt", `${plan.tasks.length} Tasks wurden vorgeschlagen.`);
        }
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        save();
        render();
      });
      const eventKindSelect = document.querySelector("#event-kind");
      const syncEventFields = () => {
        const isExam = eventKindSelect?.value === "exam";
        document.querySelector(".exam-basic-field")?.classList.toggle("hidden", !isExam);
        document.querySelector(".exam-extra-fields")?.classList.toggle("hidden", !isExam);
        const topicsField = document.querySelector("#event-topics");
        if (topicsField) {
          topicsField.required = isExam;
          topicsField.disabled = !isExam;
        }
      };
      eventKindSelect?.addEventListener("change", syncEventFields);
      syncEventFields();
      document.querySelector("#event-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        if (data.kind === "exam") {
          const exam = {
            id: uid("exam"),
            subject: data.subject,
            title: String(data.title || "").trim() || `${data.subject} Prüfung`,
            date: data.date,
            time: data.time || "",
            importance: data.importance || "normal",
            targetGrade: "",
            minutesPerDay: Math.max(2, Number(data.plannedStudyTime || 25)),
            topics: topicList(data.topics || data.title || data.subject),
            linkedDeckId: data.linkedDeckId || "",
            linkedMistakeIds: data.linkedMistakeId ? [data.linkedMistakeId] : [],
            gradeWeight: data.gradeWeight || "",
            notes: data.notes || ""
          };
          state.exams.unshift(exam);
          if (data.autoPlan === "on" && isPlus()) {
            state.planEvents.unshift(...createAutoPlan({ subject: exam.subject, title: exam.title, date: exam.date, minutes: exam.minutesPerDay, topics: exam.topics, linkedExamId: exam.id }));
          }
        } else if (data.kind === "homework") {
          state.homework.unshift({ id: uid("hw"), subject: data.subject, title: String(data.title || "").trim() || `${data.subject} Aufgabe`, description: "", dueDate: data.date, priority: "Mittel", status: "Offen" });
        } else {
          state.planEvents.unshift({ id: uid("event"), subject: data.subject, title: String(data.title || "").trim() || `${data.subject} Termin`, date: data.date, minutes: 25, type: "Termin", auto: false });
        }
        trackStudyAction("studyTaskAdded");
        state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
        state.ui.showEventForm = false;
        pushNotification("Eintrag gespeichert", `${data.subject}: ${data.title || (data.kind === "exam" ? "Prüfung" : "Plan")}`);
        save();
        render();
      });
    }

    if (route === "cards") {
      document.querySelector(".continue-study-button")?.addEventListener("click", () => {
        startBestStudySession({ mode: "learn" });
        save();
        render();
      });
      document.querySelector(".choose-study-mode-button")?.addEventListener("click", () => {
        const due = pendingDueCards();
        const personal = personalDecks();
        if (due.length) {
          state.ui.cardStudyMode = "due";
          state.ui.selectedCardPackId = "";
          state.ui.selectedCardSubject = "";
        } else if (personal.length) {
          state.ui.cardStudyMode = "personal";
          state.ui.selectedCardSubject = personal[0].title;
          state.ui.selectedCardPackId = "";
        } else if (state.cardLibrary.length) {
          state.ui.cardStudyMode = "library";
          state.ui.selectedCardPackId = state.cardLibrary[0].id;
          state.ui.selectedCardSubject = "";
        } else {
          location.hash = "#bot";
          save();
          render();
          return;
        }
        state.ui.cardStudyOpen = true;
        state.ui.cardStudyIndex = 0;
        state.cardStudySession = { ...defaultCardStudySession(), choosing: true };
        save();
        render();
      });
      document.querySelector("#card-search")?.addEventListener("input", (event) => {
        state.ui.cardSearch = event.currentTarget.value;
        save();
        const cursor = event.currentTarget.selectionStart || state.ui.cardSearch.length;
        clearTimeout(cardSearchTimer);
        cardSearchTimer = setTimeout(() => {
          render();
          const input = document.querySelector("#card-search");
          if (input) {
            input.focus();
            input.setSelectionRange(cursor, cursor);
          }
        }, 220);
      });
      document.querySelectorAll(".quizlet-large-stack, .recent-deck-row, .search-deck-row").forEach((button) => button.addEventListener("click", () => {
        if (button.dataset.stack === "mistakes") {
          location.hash = "#mistakes";
          render();
          return;
        }
        state.ui.cardStudyMode = button.dataset.stack;
        state.ui.cardStudyOpen = true;
        state.ui.cardStudyIndex = 0;
        state.ui.selectedCardPackId = button.dataset.packId || "";
        state.ui.selectedCardSubject = button.dataset.subject || (button.dataset.stack === "personal" ? "" : "");
        state.cardStudySession = { ...defaultCardStudySession(), choosing: true };
        save();
        render();
      }));
      document.querySelectorAll(".close-study-view").forEach((button) => button.addEventListener("click", () => {
        state.ui.cardStudyOpen = false;
        state.ui.cardStudyMode = "";
        state.ui.cardStudyIndex = 0;
        resetCardStudySession();
        save();
        render();
      }));
      document.querySelectorAll(".start-deck-session").forEach((button) => button.addEventListener("click", () => {
        startDeckSession(button.dataset.mode || button.dataset.option || "cards");
        save();
        render();
      }));
      document.querySelector(".start-more-cards")?.addEventListener("click", (event) => {
        state.cardStudySession = { ...defaultCardStudySession(), choosing: true };
        startDeckSession(event.currentTarget.dataset.mode || "cards");
        save();
        render();
      });
      document.querySelector(".choose-other-deck")?.addEventListener("click", () => {
        state.ui.cardStudyOpen = true;
        state.cardStudySession = { ...defaultCardStudySession(), choosing: true };
        state.activeModeSession = {};
        state.learningMode = "";
        state.ui.cardStudyIndex = 0;
        save();
        render();
      });
      document.querySelector(".study-prev")?.addEventListener("click", () => {
        state.ui.cardStudyIndex = Math.max(0, Number(state.ui.cardStudyIndex || 0) - 1);
        save();
        render();
      });
      document.querySelector(".study-next")?.addEventListener("click", () => {
        state.ui.cardStudyIndex = Math.min(activeStudyCards().length - 1, Number(state.ui.cardStudyIndex || 0) + 1);
        save();
        render();
      });
      document.querySelectorAll(".srs-rating").forEach((button) => button.addEventListener("click", () => {
        rateCurrentStudyCard(button.dataset.rating);
        save();
        render();
      }));
      document.querySelector("#test-setup-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        startConfiguredTest({
          write: data.write === "on",
          choice: data.choice === "on",
          mixed: data.mixed === "on",
          direction: data.direction || "front"
        });
        save();
        render();
      });
      document.querySelector("#test-list-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        submitFullTest(event.currentTarget);
        save();
        render();
      });
      document.querySelector(".mode-answer-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        if (state.cardStudySession?.mode === "test" || state.cardStudySession?.mode === "learn") {
          answerTestQuestion(data.answer || "");
        } else {
          answerCurrentCard(data.answer || "");
        }
        save();
        render();
      });
      document.querySelectorAll(".choice-option").forEach((button) => button.addEventListener("click", () => {
        const answer = button.dataset.answer || button.textContent || "";
        if (state.cardStudySession?.mode === "test" || state.cardStudySession?.mode === "learn") {
          answerTestQuestion(answer);
        } else {
          answerChoiceCard(answer);
        }
        save();
        render();
      }));
      document.querySelector(".mode-next-card")?.addEventListener("click", () => {
        advanceModeSession();
        save();
        render();
      });
      document.querySelectorAll(".save-mode-mistake").forEach((button) => button.addEventListener("click", () => {
        saveModeMistake(button.dataset.answerIndex);
        save();
        render();
      }));
      document.querySelectorAll(".mode-match-tile").forEach((button) => button.addEventListener("click", () => {
        const session = state.cardStudySession || {};
        if (!session.active || session.mode !== "match") return;
        const tileId = button.dataset.tileId || "";
        const selected = session.selectedMatchTileId || "";
        if (!selected) {
          state.cardStudySession = { ...session, selectedMatchTileId: tileId, lastWrongTileIds: [], lastResult: null };
          state.activeModeSession = { ...state.cardStudySession };
          save();
          render();
          return;
        }
        if (selected === tileId) {
          state.cardStudySession = { ...session, selectedMatchTileId: "", lastWrongTileIds: [], lastResult: null };
          state.activeModeSession = { ...state.cardStudySession };
          save();
          render();
          return;
        }
        const first = parseMatchTileId(selected);
        const second = parseMatchTileId(tileId);
        const correct = first.pairId === second.pairId && first.side !== second.side;
        const matchedIds = correct ? [...new Set([...(session.matchedIds || []), first.pairId])] : [...(session.matchedIds || [])];
        state.cardStudySession = {
          ...session,
          matchedIds,
          selectedMatchTileId: "",
          selectedPromptId: "",
          selectedAnswerId: "",
          wrongAttempts: Number(session.wrongAttempts || 0) + (correct ? 0 : 1),
          matchPenaltySeconds: Number(session.matchPenaltySeconds || 0) + (correct ? 0 : 1),
          lastWrongTileIds: correct ? [] : [selected, tileId],
          lastResult: { correct }
        };
        state.activeModeSession = { ...state.cardStudySession };
        if (correct) setCardReviewOnly(activeStudyCards().find((card) => card.id === first.pairId), "good");
        if (matchedIds.length >= Number(session.target || session.matchPairs?.length || 0)) completeDeckSession();
        save();
        render();
      }));
      document.querySelectorAll(".mode-match-prompt").forEach((button) => button.addEventListener("click", () => {
        const session = state.cardStudySession || {};
        const promptId = button.dataset.id;
        const answerId = session.selectedAnswerId || "";
        if (answerId) {
          const correct = promptId === answerId;
          const matchedIds = correct ? [...new Set([...(session.matchedIds || []), promptId])] : [...(session.matchedIds || [])];
          state.cardStudySession = {
            ...session,
            matchedIds,
            selectedPromptId: "",
            selectedAnswerId: "",
            wrongAttempts: Number(session.wrongAttempts || 0) + (correct ? 0 : 1),
            lastResult: { correct }
          };
          state.activeModeSession = { ...state.cardStudySession };
          if (correct) setCardReviewOnly(activeStudyCards().find((card) => card.id === promptId), "good");
          if (matchedIds.length >= Number(session.target || session.matchPairs?.length || 0)) completeDeckSession();
        } else {
          state.cardStudySession.selectedPromptId = promptId;
          state.cardStudySession.lastResult = null;
        }
        save();
        render();
      }));
      document.querySelectorAll(".mode-match-answer").forEach((button) => button.addEventListener("click", () => {
        const session = state.cardStudySession || {};
        const answerId = button.dataset.id;
        const promptId = session.selectedPromptId || "";
        if (!promptId) {
          state.cardStudySession.selectedAnswerId = answerId;
          save();
          render();
          return;
        }
        const correct = promptId === answerId;
        const matchedIds = correct ? [...new Set([...(session.matchedIds || []), promptId])] : [...(session.matchedIds || [])];
        state.cardStudySession = {
          ...session,
          matchedIds,
          selectedPromptId: "",
          selectedAnswerId: "",
          wrongAttempts: Number(session.wrongAttempts || 0) + (correct ? 0 : 1),
          lastResult: { correct }
        };
        state.activeModeSession = { ...state.cardStudySession };
        if (correct) setCardReviewOnly(activeStudyCards().find((card) => card.id === promptId), "good");
        if (matchedIds.length >= Number(session.target || session.matchPairs?.length || 0)) completeDeckSession();
        save();
        render();
      }));
      document.querySelector("#toggle-card-create")?.addEventListener("click", () => {
        state.ui.cardCreateOpen = !state.ui.cardCreateOpen;
        if (!state.ui.cardCreateOpen) state.ui.cardCreateMode = "";
        save();
        render();
      });
      document.querySelector(".close-card-create")?.addEventListener("click", () => {
        state.ui.cardCreateOpen = false;
        state.ui.cardCreateMode = "";
        save();
        render();
      });
      document.querySelectorAll(".choose-card-mode").forEach((button) => button.addEventListener("click", () => {
        state.ui.cardCreateMode = button.dataset.mode;
        if (button.dataset.mode === "self" && !state.ui.cardDeckType) state.ui.cardDeckType = "custom";
        save();
        render();
      }));
      document.querySelectorAll(".study-card-type").forEach((button) => button.addEventListener("click", () => {
        state.ui.cardDeckType = button.dataset.cardType || "custom";
        save();
        render();
      }));
      document.querySelectorAll(".study-flashcard").forEach((card) => card.addEventListener("click", () => {
        if (card.dataset.swiped === "true") {
          delete card.dataset.swiped;
          return;
        }
        card.classList.toggle("flipped");
      }));
      document.querySelector("#card-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        const deckType = state.ui.cardDeckType || "custom";
        const subject = String(data.subject || "Allgemein").trim() || "Allgemein";
        const deckTitle = String(data.deckTitle || subject).trim() || subject;
        state.flashcards.push({
          id: uid("card"),
          deckType,
          subject,
          title: deckTitle,
          topic: String(data.topic || "").trim(),
          question: String(data.question || "").trim(),
          answer: String(data.answer || "").trim(),
          difficulty: Number(data.difficulty || 2),
          exampleSentence: String(data.exampleSentence || "").trim(),
          pronunciation: String(data.pronunciation || "").trim(),
          reverse: data.reverse === "on",
          linkedTestId: data.linkedTestId || "",
          priority: data.priority === "on",
          explanation: String(data.explanation || "").trim(),
          repeatLater: data.repeatLater === "on",
          mistakeHistory: deckType === "mistake" ? 1 : 0,
          reviewCount: 0,
          source: "private",
          published: false
        });
        state.ui.cardCreateOpen = false;
        state.ui.cardCreateMode = "";
        save();
        render();
      });
      document.querySelector("#photo-card-input")?.addEventListener("change", (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        state.ui.lastPhotoName = file.name;
        pushNotification("Foto-Funktion kommt bald", "Lynxly speichert hier noch keine Karten aus Fotos.");
        save();
        render();
      });
    }

    if (route === "mistakes") {
      document.querySelector(".toggle-mistake-form")?.addEventListener("click", () => {
        state.ui.showMistakeForm = !state.ui.showMistakeForm;
        save();
        render();
      });
      document.querySelector(".cancel-mistake-form")?.addEventListener("click", () => {
        state.ui.showMistakeForm = false;
        save();
        render();
      });
      document.querySelector("#mistake-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formData(event.currentTarget);
        saveMistake({
          subject: data.subject,
          topic: data.topic,
          question: data.question,
          userAnswer: data.userAnswer,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          source: "Manuell"
        });
        state.ui.showMistakeForm = false;
        save();
        render();
      });
      document.querySelectorAll(".mistake-filter").forEach((button) => button.addEventListener("click", () => {
        state.ui.mistakeFilter = button.dataset.filter;
        save();
        render();
      }));
      document.querySelectorAll(".explain-mistake").forEach((button) => button.addEventListener("click", () => {
        const mistake = state.mistakes.find((item) => item.id === button.dataset.id);
        if (!mistake) return;
        const mode = button.dataset.mode || "full";
        mistake.aiExplanation = mistakeExplanation(mistake, mode);
        mistake.retryQuestion = `Retry: ${mistake.question}`;
        mistake.explanation = mistake.explanation || mistake.aiExplanation;
        trackStudyAction("mistakeReviewed");
        save();
        render();
      }));
      document.querySelectorAll(".adaptive-explain-mistake").forEach((button) => button.addEventListener("click", async () => {
        const mistake = state.mistakes.find((item) => item.id === button.dataset.id);
        if (!mistake) return;
        button.disabled = true;
        button.textContent = "Erkläre ...";
        try {
          const result = await explainMistakeAdaptively(mistake);
          const explanation = result.explanation || {};
          mistake.aiExplanation = [
            explanation.simple,
            explanation.workedExample,
            explanation.alternative,
            explanation.retryQuestion
          ].filter(Boolean).join("\n\n") || mistakeExplanation(mistake, "full");
          mistake.explanation = mistake.explanation || explanation.simple || "";
          mistake.retryQuestion = explanation.retryQuestion || `Retry: ${mistake.question}`;
          trackStudyAction("mistakeReviewed");
          pushNotification(
            result.basic ? "Basic-Erklärung erstellt" : "Adaptive Erklärung erstellt",
            result.basic ? "Ohne KI-Credits aus deinen gespeicherten Fehlerdaten." : `${result.creditsConsumed || actionCost("adaptive_mistake_explanation")} Credits wurden genutzt.`
          );
        } catch (error) {
          pushNotification("Adaptive Erklärung gesperrt", error.message || "Plus oder Credits erforderlich.");
        }
        save();
        render();
      }));
      document.querySelectorAll(".mistake-to-card").forEach((button) => button.addEventListener("click", () => {
        const mistake = state.mistakes.find((item) => item.id === button.dataset.id);
        const card = makeFlashcardFromMistake(mistake);
        if (card) {
          state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
          pushNotification("Karte erstellt", "Der Fehler ist jetzt als Study Card wiederholbar.");
        }
        save();
        render();
      }));
      document.querySelectorAll(".mistake-review-later").forEach((button) => button.addEventListener("click", () => {
        const mistake = state.mistakes.find((item) => item.id === button.dataset.id);
        scheduleMistakeReview(mistake, 2);
        pushNotification("Review geplant", "Lynxly zeigt dir diesen Fehler später wieder.");
        save();
        render();
      }));
      document.querySelectorAll(".fix-mistake, .reopen-mistake").forEach((button) => button.addEventListener("click", () => {
        const mistake = state.mistakes.find((item) => item.id === button.dataset.id);
        if (!mistake) return;
        if (button.classList.contains("reopen-mistake")) {
          mistake.reviewStatus = "open";
        } else {
          markMistakeFixed(mistake);
        }
        save();
        render();
      }));
    }

    if (route === "bot") {
      document.querySelector("#ai-notes-file")?.addEventListener("change", async (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        const input = document.querySelector("#ai-notes-input");
        state.ui.aiNotesFileName = file.name;
        state.ui.aiNotesFileType = notesFileKind(file);
        state.ui.aiNotesFileSize = formatFileSize(file.size);
        state.ui.aiNotesStatus = "extracting";
        state.ui.aiNotesPreview = "";
        state.ui.aiNotesError = "";
        save();
        render();
        try {
          const result = await extractNotesFromUpload(file);
          state.ui.aiNotesFileName = result.fileName;
          state.ui.aiNotesFileType = result.fileType;
          state.ui.aiNotesFileSize = result.fileSize || formatFileSize(file.size);
          state.ui.aiNotesStatus = result.status;
          state.ui.aiNotesPreview = result.preview;
          state.ui.aiNotesError = result.error;
          if (result.text) {
            state.ui.aiNotesDraft = result.text.slice(0, 12000);
            if (input) input.value = state.ui.aiNotesDraft;
            pushNotification("Notizen geladen", `${file.name} ist bereit für Study Cards, Quiz oder Plan.`);
          } else {
            pushNotification("Upload geprüft", result.error || "Diese Datei braucht noch eine manuelle Texteingabe.");
          }
        } catch (error) {
          state.ui.aiNotesStatus = "error";
          state.ui.aiNotesError = "Bitte kopiere den Text direkt in das Notizfeld.";
          pushNotification("Datei nicht gelesen", state.ui.aiNotesError);
        }
        save();
        render();
      });
      document.querySelector(".clear-ai-notes")?.addEventListener("click", () => {
        state.ui.aiNotesDraft = "";
        state.ui.aiNotesFileName = "";
        state.ui.aiNotesFileType = "";
        state.ui.aiNotesFileSize = "";
        state.ui.aiNotesStatus = "";
        state.ui.aiNotesPreview = "";
        state.ui.aiNotesError = "";
        state.ui.aiGenerationLastMode = "";
        state.ui.aiGenerationSource = "";
        save();
        render();
      });
      document.querySelectorAll(".ai-note-generate").forEach((button) => button.addEventListener("click", async () => {
        const input = document.querySelector("#ai-notes-input");
        const notes = String(input?.value || "").trim();
        const mode = button.dataset.mode || "summary";
        state.ui.aiNotesDraft = notes;
        state.ui.aiGenerationLastMode = mode;
        if (!notes) {
          state.chat.push({ id: uid("msg"), role: "bot", text: "## Notizen fehlen\n\nFüge zuerst kurze Notizen ein oder lade eine Textdatei. Danach kann Lynxly daraus Study Cards, Quiz, Zusammenfassung oder Plan erstellen." });
          save();
          render();
          return;
        }
        if (notes.length > uploadLimits.text) {
          state.ui.aiNotesStatus = "error";
          state.ui.aiNotesError = `Die Notizen sind zu lang (${notes.length.toLocaleString("de-CH")} Zeichen). Bitte kürze sie auf ungefähr ${uploadLimits.text.toLocaleString("de-CH")} Zeichen.`;
          state.ui.aiNotesPreview = "Tipp: Kopiere zuerst nur das wichtigste Kapitel oder Thema.";
          save();
          render();
          return;
        }
        state.ui.aiNotesStatus = "generating";
        state.ui.aiNotesError = "";
        state.ui.aiNotesPreview = isGermanProfile() ? "Lynxly erstellt Lernmaterial ..." : "Lynxly is creating study materials ...";
        save();
        render();
        let result;
        try {
          result = await generateStudyMaterialsWithAi(notes, { types: [mode] });
        } catch (error) {
          if (entitlementErrorCodes.has(error.code)) {
            const blockedAction = materialActionForMode(mode);
            state.ui.aiNotesStatus = "blocked";
            state.ui.aiNotesError = error.message;
            state.ui.aiNotesPreview = `${actionLabel(blockedAction)} · ${actionCost(blockedAction)} Credits`;
            state.chat.push({ id: uid("msg"), role: "bot", text: `## Plus benötigt\n\n${error.message}\n\nFree bleibt für manuelle Study Cards, Noten, Tasks, Fehlerbank und einfache lokale Erklärungen nutzbar.` });
            save();
            render();
            return;
          }
          result = {
            materials: normalizeGeneratedMaterials(generateStudyMaterials(notes, { types: [mode] }), notes, { types: [mode] }),
            offline: true,
            warning: "Die KI-Generierung ist fehlgeschlagen. Lynxly nutzt lokal erstellte Lernmaterialien."
          };
        }
        const materials = result.materials || normalizeGeneratedMaterials(generateStudyMaterials(notes, { types: [mode] }), notes, { types: [mode] });
        const subject = materials.subject;
        state.ui.aiNotesStatus = "ready";
        state.ui.aiNotesError = result.warning || "";
        state.ui.aiGenerationSource = result.offline ? "local" : "ai";
        state.ui.aiNotesPreview = result.offline
          ? "Lokaler Generator verwendet. Für echte KI OPENAI_API_KEY im Server konfigurieren."
          : `${materials.flashcards.length} Karten und ${materials.quiz.length} Quizfragen erstellt.`;
        if (mode === "cards") {
          saveGeneratedCards(materials);
          state.ui.cardStudyMode = "personal";
          state.ui.selectedCardSubject = materials.deckTitle;
          state.ui.cardStudyOpen = true;
          state.ui.cardStudyIndex = 0;
          state.cardStudySession = { ...defaultCardStudySession(), choosing: false };
          startDeckSession("learn");
          state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
          pushNotification("Study Cards erstellt", `${materials.flashcards.length} Karten aus deinen Notizen wurden gespeichert.`);
          save();
          location.hash = "#cards";
          render();
          return;
        }
        if (mode === "quiz") {
          startGeneratedQuiz(materials);
          state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
          pushNotification("Quiz bereit", `${materials.quiz.length} interaktive Fragen wurden erstellt.`);
          save();
          render();
          return;
        }
        if (mode === "plan") {
          const tasks = materials.studyPlan.length ? materials.studyPlan : materials.plan;
          state.studyTasks.unshift(...tasks);
          tasks.forEach(() => trackStudyAction("studyTaskAdded"));
          rememberGeneratedStudySet(materials, result.offline ? "local" : "ai");
          state.todaysFocus = { ...window.StudyUpSeed.todaysFocus, version: 0, date: "" };
          state.chat.push({ id: uid("msg"), role: "user", text: `Erstelle einen Lernplan aus meinen Notizen zu ${subject}.` });
          state.chat.push({ id: uid("msg"), role: "bot", text: notesPlanMarkdown(subject, materials.topics) });
          pushNotification("Lernplan erstellt", `${tasks.length} Lernschritte wurden in Tasks gespeichert.`);
          save();
          render();
          return;
        }
        rememberGeneratedStudySet(materials, result.offline ? "local" : "ai");
        state.chat.push({ id: uid("msg"), role: "user", text: `Fasse meine Notizen zu ${subject} zusammen.` });
        state.chat.push({ id: uid("msg"), role: "bot", text: notesSummaryMarkdown(materials) });
        save();
        render();
      }));
      document.querySelector(".retry-ai-generation")?.addEventListener("click", (event) => {
        const mode = event.currentTarget.dataset.mode || state.ui.aiGenerationLastMode || "summary";
        document.querySelector(`.ai-note-generate[data-mode="${mode}"]`)?.click();
      });
      document.querySelector("#ai-attach-toggle")?.addEventListener("click", () => {
        state.ui.aiAttachMenuOpen = !state.ui.aiAttachMenuOpen;
        save();
        render();
      });
      document.querySelector("#ai-photo-input")?.addEventListener("change", async (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          state.chat.push({ id: uid("msg"), role: "bot", text: "Bitte wähle ein Foto aus deiner Mediathek aus." });
          save();
          render();
          return;
        }
        try {
          pendingChatAttachment = { name: file.name, kind: "photo", dataUrl: await prepareChatImage(file) };
          state.ui.chatAttachmentName = file.name;
          state.ui.aiAttachMenuOpen = false;
          save();
          render();
        } catch (error) {
          pendingChatAttachment = null;
          state.ui.chatAttachmentName = "";
          state.chat.push({ id: uid("msg"), role: "bot", text: "Das Foto konnte nicht gelesen werden. Bitte probiere ein anderes Bild." });
          save();
          render();
        }
      });
      document.querySelector("#ai-file-input")?.addEventListener("change", async (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        const snippet = await readFileSnippet(file);
        pendingChatAttachment = { name: file.name, kind: "file", dataUrl: "", text: snippet };
        state.ui.chatAttachmentName = file.name;
        state.ui.aiAttachMenuOpen = false;
        save();
        render();
      });
      document.querySelector(".voice-input")?.addEventListener("click", startVoiceInput);
      document.querySelector("#chat-input")?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        event.preventDefault();
        event.currentTarget.closest("form")?.requestSubmit();
      });
      document.querySelectorAll(".ai-quick-action").forEach((button) => button.addEventListener("click", () => {
        const input = document.querySelector("#chat-input");
        input.value = `${button.dataset.prompt || ""}${input.value}`.trim();
        input.focus();
      }));
      document.querySelectorAll(".save-ai-flashcards").forEach((button) => button.addEventListener("click", () => {
        const answer = state.chat.find((message) => message.id === button.dataset.id)?.text || "";
        const question = lastUserMessageBefore(button.dataset.id);
        state.flashcards.push({ id: uid("card"), subject: "KI", title: "Lynxly AI", question, answer, difficulty: 2, reviewCount: 0, source: "ai", published: false });
        pushNotification("Karte gespeichert", "Die KI-Antwort wurde als Karte abgelegt.");
        save();
        render();
      }));
      document.querySelectorAll(".save-ai-mistake").forEach((button) => button.addEventListener("click", () => {
        const answer = state.chat.find((message) => message.id === button.dataset.id)?.text || "";
        saveMistake({ subject: "KI", topic: "KI-Übung", question: lastUserMessageBefore(button.dataset.id), correctAnswer: "", userAnswer: "", explanation: answer, source: "KI" });
        pushNotification("Fehler gespeichert", "Der Punkt wurde in die Fehlerbank gelegt.");
        save();
        render();
      }));
      document.querySelectorAll(".save-ai-task").forEach((button) => button.addEventListener("click", () => {
        const question = lastUserMessageBefore(button.dataset.id);
        state.studyTasks.unshift({ id: uid("task"), subject: "KI", title: question.slice(0, 80), date: todayIso(), done: false });
        trackStudyAction("studyTaskAdded");
        pushNotification("Lernaufgabe gespeichert", "Die Aufgabe erscheint jetzt auf Home.");
        save();
        render();
      }));
      document.querySelector("#chat-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = formData(event.currentTarget).message.trim();
        const attachment = pendingChatAttachment?.name === state.ui.chatAttachmentName ? state.ui.chatAttachmentName : "";
        const imageData = pendingChatAttachment?.name === attachment && pendingChatAttachment.kind === "photo" ? pendingChatAttachment.dataUrl : "";
        const fileText = pendingChatAttachment?.name === attachment && pendingChatAttachment.kind === "file" && pendingChatAttachment.text ? `\n\nDateiauszug aus ${attachment}:\n${pendingChatAttachment.text}` : "";
        if (!message && !attachment) return;
        const userText = message || (attachment ? `Bitte hilf mir mit ${pendingChatAttachment?.kind === "file" ? "dieser Datei" : "diesem Foto"}.` : "");
        const attachmentLabel = attachment ? ` [${pendingChatAttachment?.kind === "file" ? "Datei" : "Foto"}: ${attachment}]` : "";
        state.chat.push({ id: uid("msg"), role: "user", text: `${userText}${attachmentLabel}` });
        state.chat.push({ id: uid("msg"), role: "bot", text: "Ich denke kurz nach ..." });
        state.ui.chatAttachmentName = "";
        save();
        render();
        const answer = await askLynxlyAI(`${userText}${fileText}`, attachment, imageData);
        const placeholder = [...state.chat].reverse().find((msg) => msg.role === "bot" && msg.text === "Ich denke kurz nach ...");
        if (placeholder) placeholder.text = answer;
        pendingChatAttachment = null;
        state.ui.chatAttachmentName = "";
        save();
        render();
      });
    }

    if (route === "premium") {
      document.querySelectorAll(".setting-control").forEach((control) => control.addEventListener("change", () => {
        if (!isPlus()) return;
        state.settings[control.name] = control.value;
        save();
        render();
      }));
    }
  };

  navLinks.forEach((link) => link.addEventListener("click", () => {
    state.ui.materialSheetOpen = false;
    if (link.dataset.route === "progress") {
      ensureCollections();
      state.ui.progressTab = "me";
      state.ui.leaderboardTab = "xp";
    }
    if (link.dataset.route === "settings") {
      state.ui.settingsTab = "profile";
    }
    save();
  }));
  materialNavButtons.forEach((button) => button.addEventListener("click", () => {
    state.ui.materialSheetOpen = true;
    save();
    render();
    requestAnimationFrame(() => document.querySelector(".material-sheet button")?.focus());
  }));
  logoutButton?.addEventListener("click", () => {
    ensureCollections();
    state.user.loggedIn = false;
    state.ui.selectedGradeSubject = null;
    state.ui.selectedPartialGroup = null;
    state.ui.cardCreateOpen = false;
    save();
    location.hash = "#dashboard";
    render();
  });

  ensureCollections();
  state.ui.notificationCenterOpen = false;
  save();
  applyTheme();
  window.addEventListener("hashchange", render);
  if (!location.hash) location.hash = "#dashboard";
  render();
  syncEntitlements().then(() => {
    applyTheme();
    render();
  });
})();





