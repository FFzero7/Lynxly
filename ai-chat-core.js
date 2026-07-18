const aiInstructions = [
  "You are Lynxly AI, a trustworthy study coach for students.",
  "Answer in the same language as the student whenever possible.",
  "Use this structure: ## Antwort/Answer, ## Lösungsweg/Solution, numbered step titles when useful, and ## Ergebnis/Result.",
  "Always give the final answer first, then the full solution in the same message.",
  "Do not only give hints. Solve the task and explain the steps clearly.",
  "For fraction calculations, use exact fractions instead of long decimals.",
  "Fully simplify fractions and show common denominators when useful.",
  "Put important equations in LaTeX between $$...$$.",
  "Check all calculations before the final answer and show only one consistent result.",
  "If you notice a mistake while solving, remove the false claim from the final answer.",
  "Keep text sections short and readable."
].join(" ");

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
};

const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

const frac = (num, den = 1) => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  const sign = den < 0 ? -1 : 1;
  const n = Math.round(num * sign);
  const d = Math.round(Math.abs(den));
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
};

const addFrac = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const subFrac = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const mulFrac = (a, b) => frac(a.n * b.n, a.d * b.d);
const divFrac = (a, b) => frac(a.n * b.d, a.d * b.n);

const fracText = (f) => {
  if (!f) return "";
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
};

const fracTex = (f) => {
  if (!f) return "";
  if (f.d === 1) return String(f.n);
  const sign = f.n < 0 ? "-" : "";
  return `${sign}\\frac{${Math.abs(f.n)}}{${f.d}}`;
};

const reciprocal = (value) => frac(1, value);

const isGerman = (text = "") => /\b(was|wie|warum|bitte|lösung|loesung|rechne|erkläre|erklaere|übersetze|uebersetze|rohr|abfluss|füll)\b/i.test(text);
const label = (text, de, en) => isGerman(text) ? de : en;

const normalizeExpression = (message = "") => {
  const normalized = String(message)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/:/g, "/")
    .replace(/\bx\b/gi, "*")
    .replace(/,/g, ".");
  const match = normalized.match(/[-+]?\d[\d\s+\-*/().]*(?:\d|\))|\([^()]+\)/);
  if (!match) return "";
  const expression = match[0]
    .trim()
    .replace(/(\d)\s*\(/g, "$1*(")
    .replace(/\)\s*(\d)/g, ")*$1");
  return /^[\d\s+\-*/().]+$/.test(expression) ? expression : "";
};

const evaluateExpression = (expression = "") => {
  if (!expression || expression.length > 120) return null;
  try {
    const value = Function(`"use strict"; return (${expression});`)();
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    return null;
  }
};

const formatNumber = (value) => {
  const rounded = Number(value.toFixed(10));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.?0+$/, "");
};

const expressionToTex = (expression = "") => expression
  .replace(/\*/g, "\\cdot ")
  .replace(/\//g, "\\div ");

const tankProblemAnswer = (message = "") => {
  const lower = message.toLowerCase();
  if (!/tank|pipe|drain|rohr|abfluss|füll/i.test(message)) return "";
  const nums = message.match(/\d+(?:[.,]\d+)?/g)?.map((n) => Number(n.replace(",", "."))) || [];
  if (nums.length < 4) return "";

  const [pipeA, pipeB, drain, firstHours] = nums;
  if (!pipeA || !pipeB || !drain || !firstHours) return "";

  const a = reciprocal(pipeA);
  const b = reciprocal(pipeB);
  const out = reciprocal(drain);
  const common = lcm(lcm(a.d, b.d), out.d);
  const commonA = { n: a.n * (common / a.d), d: common };
  const commonB = { n: b.n * (common / b.d), d: common };
  const commonOut = { n: out.n * (common / out.d), d: common };
  const combined = subFrac(addFrac(a, b), out);
  const filled = mulFrac(frac(firstHours), combined);
  const remaining = subFrac(frac(1), filled);
  const finalRate = lower.includes("pipe b") || lower.includes("rohr b")
    ? subFrac(a, out)
    : combined;
  if (!combined || !filled || !remaining || !finalRate || finalRate.n <= 0 || remaining.n < 0) return "";
  const time = divFrac(remaining, finalRate);
  if (!time) return "";

  const de = isGerman(message);
  const answer = de ? `${fracText(time)} Stunden` : `${fracText(time)} hours`;

  return [
    `## ${label(message, "Antwort", "Answer")}`,
    "",
    `**${answer}**`,
    "",
    `## ${label(message, "Lösungsweg", "Solution")}`,
    "",
    `### 1. ${de ? "Füllraten bestimmen" : "Determine the rates"}`,
    "",
    de ? "Rohr A füllt pro Stunde:" : "Pipe A fills per hour:",
    "",
    `$$\n${fracTex(a)}\n$$`,
    "",
    de ? "Rohr B füllt pro Stunde:" : "Pipe B fills per hour:",
    "",
    `$$\n${fracTex(b)}\n$$`,
    "",
    de ? "Der Abfluss leert pro Stunde:" : "The drain empties per hour:",
    "",
    `$$\n-${fracTex(out)}\n$$`,
    "",
    `### 2. ${de ? "Gemeinsame Rate" : "Combined rate"}`,
    "",
    `$$\n${fracTex(a)}+${fracTex(b)}-${fracTex(out)}\n=\n${fracTex(commonA)}+${fracTex(commonB)}-${fracTex(commonOut)}\n=\n${fracTex(combined)}\n$$`,
    "",
    `### 3. ${de ? "Inhalt nach zwei Stunden" : "Amount after two hours"}`,
    "",
    `$$\n${firstHours}\\cdot${fracTex(combined)}=${fracTex(filled)}\n$$`,
    "",
    `### 4. ${de ? "Restmenge" : "Remaining amount"}`,
    "",
    `$$\n1-${fracTex(filled)}=${fracTex(remaining)}\n$$`,
    "",
    `### 5. ${de ? "Rate nach dem Schließen von Rohr B" : "Rate after closing pipe B"}`,
    "",
    `$$\n${fracTex(a)}-${fracTex(out)}=${fracTex(finalRate)}\n$$`,
    "",
    `### 6. ${de ? "Benötigte Zeit" : "Time needed"}`,
    "",
    `$$\n${fracTex(remaining)}\\div${fracTex(finalRate)}=${fracTex(time)}\n$$`,
    "",
    `## ${label(message, "Ergebnis", "Result")}`,
    "",
    de
      ? `Nach dem Schließen von Rohr B dauert es noch **${answer}**.`
      : `After pipe B is closed, it takes **${answer}** more to fill the tank.`
  ].join("\n");
};

const fallbackAnswer = (message = "", hasImage = false) => {
  const raw = String(message).trim();
  const de = isGerman(raw);
  if (hasImage) {
    return [
      `## ${label(raw, "Antwort", "Answer")}`,
      "",
      de ? "Ich kann das Foto im Offline-Modus nicht sicher lesen." : "I cannot reliably read the photo in offline mode.",
      "",
      `## ${label(raw, "Lösungsweg", "Solution")}`,
      "",
      de
        ? "Schreibe die Aufgabe kurz als Text, dann gebe ich dir Antwort und Lösungsweg in einer Nachricht."
        : "Type the task as text, then I will give you the answer and solution in one message."
    ].join("\n");
  }
  if (!raw) return "## Antwort\n\nSchick mir eine Aufgabe, dann antworte ich mit Lösung und Rechenweg.";

  const tank = tankProblemAnswer(raw);
  if (tank) return tank;

  const expression = normalizeExpression(raw);
  const value = evaluateExpression(expression);
  if (value !== null) {
    const answer = formatNumber(value);
    return [
      `## ${label(raw, "Antwort", "Answer")}`,
      "",
      `**${answer}**`,
      "",
      `## ${label(raw, "Lösungsweg", "Solution")}`,
      "",
      `### 1. ${de ? "Rechnung erkennen" : "Identify the expression"}`,
      "",
      `$$\n${expressionToTex(expression)}\n$$`,
      "",
      `### 2. ${de ? "Ausrechnen" : "Calculate"}`,
      "",
      `$$\n${expressionToTex(expression)}=${answer}\n$$`,
      "",
      `## ${label(raw, "Ergebnis", "Result")}`,
      "",
      de ? `Das Ergebnis ist **${answer}**.` : `The result is **${answer}**.`
    ].join("\n");
  }

  return [
    `## ${label(raw, "Antwort", "Answer")}`,
    "",
    de ? "Ich kann dir dabei helfen." : "I can help with that.",
    "",
    `## ${label(raw, "Lösungsweg", "Solution")}`,
    "",
    de
      ? `Zu deiner Frage "${raw}" würde ich zuerst die wichtigen Informationen sammeln und dann Schritt für Schritt lösen.`
      : `For your question "${raw}", I would first collect the important information and then solve it step by step.`
  ].join("\n");
};

const buildAiInput = (message, imageData, attachmentName) => {
  const text = message || (attachmentName ? `Help me with this photo: ${attachmentName}` : "Help me study.");
  if (!imageData) return text;
  return [{
    role: "user",
    content: [
      { type: "input_text", text },
      { type: "input_image", image_url: imageData }
    ]
  }];
};

module.exports = {
  aiInstructions,
  buildAiInput,
  fallbackAnswer
};
