# Lynxly

Lynxly is a local-first study coach for students. It helps organize school work, generate Study Cards from notes, run quizzes, save mistakes, track progress, and plan the next useful learning step.

## Run Locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:4173
```

On Windows you can also double-click `start-lynxly.bat`.

## AI Setup

Lynxly works without an API key by using local fallback generators. To enable real AI chat, OCR/image extraction, and stronger study-material generation:

1. Copy `.env.example` to `.env`.
2. Add `OPENAI_API_KEY`.
3. Start the server in an environment where the variables are loaded.

Never put the API key into frontend files.

## Deployment Notes

This project is a small Node server plus static frontend. For Vercel, keep:

- `index.html`
- `src/`
- `api/`
- `server.js`
- `ai-chat-core.js`
- `study-materials-core.js`
- `package.json`

The API routes also support Vercel-style serverless files in `api/`.

## Privacy Notes

Lynxly currently stores app data locally in the browser. Demo login is not production authentication. Uploaded notes may be sent to AI processing only when an AI backend is configured. Do not upload sensitive personal data.

Profile includes controls to export local data, clear generated AI data, or delete all local browser data.

## Manual QA Checklist

- Onboarding -> choose goal/date/topics -> upload notes -> generate Study Cards -> study.
- Text upload -> flashcards generated and no duplicates saved.
- PDF/image upload without API key -> honest fallback/error state.
- Generated quiz -> interactive questions -> wrong answers saved as mistakes.
- Continue Study chooses a useful session.
- Mistake review updates progress and XP.
- Flashcard review buttons work.
- Local fallback works without `OPENAI_API_KEY`.
- Theme defaults to dark and light mode remains available.
- Profile export/delete data works.
- No console errors on Home, Lernen, KI, Fortschritt, Profil.

## Known Placeholders

- Demo login is local-only.
- Payment is placeholder logic.
- Cloud sync and real class multiplayer need a backend.
- PDF/image extraction requires a configured AI backend.
