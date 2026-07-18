const buildAdaptiveMistakeExplanation = (mistake = {}) => {
  const subject = String(mistake.subject || "dieses Thema").trim();
  const topic = String(mistake.topic || mistake.question || "die Aufgabe").trim();
  const question = String(mistake.question || topic).trim();
  const correctAnswer = String(mistake.correctAnswer || "die richtige Lösung").trim();
  const userAnswer = String(mistake.userAnswer || "deine Antwort").trim();
  const explanation = String(mistake.explanation || "").trim();

  return {
    simple: `Bei ${subject} geht es hier vor allem um: ${topic}. Richtig ist: ${correctAnswer}. Vergleiche das direkt mit deiner Antwort: ${userAnswer}.`,
    diagnosis: `Deine Antwort wirkt noch nicht ganz passend zum Kern von ${topic}. Prüfe zuerst die Regel, Definition oder den Rechenschritt.`,
    workedExample: `Beispiel: Nimm zuerst nur die Frage "${question}". Schreibe die passende Regel oder Definition dazu auf. Danach prüfst du, ob deine Antwort genau diese Regel erfüllt.`,
    alternative: explanation
      ? `Anders erklärt: ${explanation}`
      : `Anders erklärt: Stell dir vor, du erklärst ${topic} einer Person in einem Satz. Wenn dieser Satz zur richtigen Antwort passt, bist du auf dem richtigen Weg.`,
    memoryTip: "Merke dir zuerst die Regel, dann prüfe Schritt für Schritt, ob deine Antwort dazu passt.",
    retryQuestion: `Versuche es noch einmal: Wie würdest du "${question}" jetzt beantworten, ohne auf die Lösung zu schauen?`,
    retryAnswer: correctAnswer,
    confidenceNotice: "Basic-Erklärung: lokal aus deinem gespeicherten Fehler erstellt, ohne KI-Credits."
  };
};

const adaptiveAiInstructions = `Du bist Lynxly, ein ruhiger Lerncoach für Schülerinnen und Schüler.
Antworte als gültiges JSON-Objekt mit exakt diesen Feldern:
misconceptionDiagnosis, simpleExplanation, workedExample, alternativeExplanation, memoryTip, retryQuestion, retryAnswer, confidenceNotice.
Gib keine HTML-Ausgabe. Fasse dich klar und hilfreich.`;

const adaptiveAiContext = (mistake = {}, profile = {}) => ({
  originalQuestion: String(mistake.question || "").slice(0, 1200),
  studentAnswer: String(mistake.userAnswer || "").slice(0, 800),
  correctAnswer: String(mistake.correctAnswer || "").slice(0, 800),
  subject: String(mistake.subject || "Allgemein").slice(0, 80),
  topic: String(mistake.topic || "").slice(0, 120),
  studentLevel: String(profile.studentLevel || profile.level || "Sekundarstufe").slice(0, 80),
  previousMistakes: Array.isArray(profile.previousMistakes)
    ? profile.previousMistakes.slice(0, 5).map((item) => String(item).slice(0, 240))
    : [],
  explanationStyle: String(profile.explanationStyle || "einfach, Schritt für Schritt").slice(0, 120),
  sourceMaterial: String(profile.sourceMaterial || "").slice(0, 2400)
});

const parseJsonObject = (text = "") => {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch (_) {}
    }
  }
  return {};
};

const normalizeAdaptiveAiExplanation = (value = {}, mistake = {}) => {
  const basic = buildAdaptiveMistakeExplanation(mistake);
  const source = typeof value === "string" ? parseJsonObject(value) : value;
  return {
    misconceptionDiagnosis: String(source.misconceptionDiagnosis || basic.diagnosis).slice(0, 900),
    simpleExplanation: String(source.simpleExplanation || basic.simple).slice(0, 1200),
    workedExample: String(source.workedExample || basic.workedExample).slice(0, 1600),
    alternativeExplanation: String(source.alternativeExplanation || basic.alternative).slice(0, 1200),
    memoryTip: String(source.memoryTip || basic.memoryTip).slice(0, 500),
    retryQuestion: String(source.retryQuestion || basic.retryQuestion).slice(0, 900),
    retryAnswer: String(source.retryAnswer || basic.retryAnswer).slice(0, 900),
    confidenceNotice: String(source.confidenceNotice || "Diese Erklärung basiert auf deinen gespeicherten Fehlerdaten.").slice(0, 500)
  };
};

const adaptiveMistakeMarkdown = (mistake = {}, result = buildAdaptiveMistakeExplanation(mistake)) => {
  const diagnosis = result.misconceptionDiagnosis || result.diagnosis;
  const simple = result.simpleExplanation || result.simple;
  const worked = result.workedExample;
  const alternative = result.alternativeExplanation || result.alternative;
  const retry = result.retryQuestion;
  const retryAnswer = result.retryAnswer;
  const confidence = result.confidenceNotice;
  const tip = result.memoryTip;
  return `## Einfache Erklärung

${simple}

## Möglicher Denkfehler

${diagnosis}

## Schritt für Schritt

${worked}

## Anders erklärt

${alternative}

${tip ? `## Merktipp\n\n${tip}\n` : ""}
## Retry

${retry}

${retryAnswer ? `**Mögliche Lösung:** ${retryAnswer}\n` : ""}
${confidence ? `\n_${confidence}_` : ""}`;
};

module.exports = {
  adaptiveAiContext,
  adaptiveAiInstructions,
  adaptiveMistakeMarkdown,
  buildAdaptiveMistakeExplanation,
  normalizeAdaptiveAiExplanation
};
