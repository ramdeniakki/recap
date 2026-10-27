# StudyPop – PDF to practice test (Next.js)

Upload a PDF, get questions, flashcards and a timed test with negative marking.
Data is saved in your browser's localStorage. No backend needed.

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## Files
- `app/page.js` – the whole app (React + Framer Motion)
- `app/globals.css` – styles and light/dark theme
- `app/layout.js` – page shell and metadata

Question generation is rule-based in `gen()` inside `app/page.js`.
To use an AI model instead, replace that function with an API call.
