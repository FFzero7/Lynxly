const studyMaterialsInstructions = `
You generate structured study materials for Lynxly, a student study coach.
Return JSON only. Do not wrap it in markdown.
Use the language requested by the client.
Base every item on the supplied notes. Do not invent unsupported facts.
Create concise, useful materials for an interactive learning workflow.

Return this shape:
{
  "subject": "",
  "deckTitle": "",
  "topics": [],
  "flashcards": [
    {
      "question": "",
      "answer": "",
      "topic": "",
      "difficulty": "easy | medium | hard",
      "sourceSnippet": ""
    }
  ],
  "quiz": [
    {
      "question": "",
      "choices": [],
      "correctAnswer": "",
      "explanation": "",
      "topic": "",
      "difficulty": "easy | medium | hard"
    }
  ],
  "summary": {
    "title": "",
    "sections": [{ "heading": "", "content": "" }]
  },
  "studyPlan": [
    { "title": "", "subject": "", "topic": "", "dayOffset": 0 }
  ],
  "weakTopics": [
    { "topic": "", "reason": "", "difficulty": "easy | medium | hard" }
  ]
}
`;

const buildStudyMaterialsInput = (notes, options = {}) => `
Language: ${options.language || "de-CH"}
Requested output: ${Array.isArray(options.types) ? options.types.join(", ") : "all"}
Preferred subject: ${options.subject || "infer from notes"}
Preferred deck title: ${options.deckTitle || "create a short title"}

NOTES:
${String(notes || "").slice(0, 24000)}
`;

const parseStudyMaterials = (value) => {
  const text = String(value || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI returned no JSON object");
  return JSON.parse(text.slice(start, end + 1));
};

module.exports = { studyMaterialsInstructions, buildStudyMaterialsInput, parseStudyMaterials };
