# WeaverMainScreen Standalone Backend

Purpose: Decouple the WeaverMainScreen frontend from TaleWeaver API.

Endpoints:
- POST `/api/openai/chat` { model, temperature?, maxTokens?, messages, persona? } -> { content }
- POST `/api/gemini/chat` { model, projectId?, location?, temperature?, maxTokens?, messages, persona? } -> { content }
- GET `/health` -> { ok, ts }
- GET `/trace/last?n=5` -> recent trace events
- POST `/test/openai`, `/test/gemini` -> simple canned responses

Setup:
1. `cd WeaverMainScreen/server`
2. `npm install`
3. Copy `.env.example` to `.env` and set keys:
   - `OPENAI_API_KEY`
   - `GOOGLE_PROJECT_ID`, `GOOGLE_LOCATION`, and either `GOOGLE_APPLICATION_CREDENTIALS` file path or `GEMINI_SERVICE_ACCOUNT_JSON`
4. Run dev: `npm run dev` (defaults to `PORT=4100`)

Update the frontend to call `http://localhost:4100` via `VITE_API_BASE_URL`.
