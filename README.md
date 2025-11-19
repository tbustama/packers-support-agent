# Next.js Packers Fan Companion

## Setup
1. Copy repository files.
2. `cp .env.example .env.local` and add your `OPENAI_API_KEY`.
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000

## How it works
- Client sends `{ message, mode }` to `/api/packers-agent`.
- API constructs messages (system prompt + few-shot + user), calls OpenAI Chat Completions endpoint, defensively parses model output to JSON, validates against schema with AJV, and returns coerced, valid JSON.

## Notes & recommendations
- Replace model name or endpoint to match your provider/SDK if needed.
- Add rate-limiting and logging in production.
- Keep `SYSTEM_PROMPT` and few-shot examples short enough to fit token limits for your chosen model.
