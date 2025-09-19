# WeaverMainScreen Standalone Backend

Purpose: Decouple the WeaverMainScreen frontend from TaleWeaver API.

Endpoints:
- POST `/api/openai/chat` { model, temperature?, maxTokens?, messages, persona? } -> { content }
- POST `/api/gemini/chat` { model, projectId?, location?, temperature?, maxTokens?, messages, persona? } -> { content }
- GET `/api/ai/status` -> { engines: { openai: { configured: boolean, models: string[] }, gemini: { configured: boolean, projectId?: string } } }
- GET `/health` -> { ok, ts }
- GET `/trace/last?n=5` -> recent trace events
- POST `/test/openai`, `/test/gemini` -> simple canned responses

Setup (standalone minimal):
1. `cd WeaverMainScreen/server`
2. `npm install`
3. Copy `.env.example` (or `.env.sample`) to `.env` and set:
   - `OPENAI_API_KEY` (required for OpenAI)
   - `GOOGLE_PROJECT_ID=weaver-studios` (Gemini project id; non-secret)
   - Optional: `GOOGLE_LOCATION=us-central1`
4. Authenticate for Gemini (NO STATIC KEY NEEDED):
   - Local dev: `gcloud auth application-default login && gcloud config set project weaver-studios`
   - CI: Workload Identity Federation already supplies credentials (no JSON file, no secret).
5. Run dev only for this server: `npm run dev` (port `4101`).

Unified multi-service startup (from repo root):
```
./start-dev.ps1            # frontend + chat server (watch)
./start-dev.ps1 -Prod      # build and run compiled server
./start-dev.ps1 -ChatOnly  # only chat server
./start-dev.ps1 -FrontendOnly  # only frontend
./start-dev.ps1 -KillExisting  # free ports 4101/5173 first
./stop-dev.ps1             # stop all started processes
```

Frontend calls `http://localhost:4101` (configure via `VITE_API_BASE_URL` if needed).

## Intent-based Routing

The orchestrator selects engine/model and now also considers a lightweight intent:
- `persona`/`editorial` → OpenAI
- `tone`/`threading` → Gemini
Client-provided `engine` always overrides routing. Intents are sent as `persona.taskManifest.intent` on `POST /v1/chat` and `/v1/chat/stream`.

## AI Status Endpoint

`GET /api/ai/status` returns a quick diagnostic of which engines are configured and basic model defaults.

Example:
```
{
   "engines": {
      "openai": { "configured": true, "models": ["gpt-4o-mini", "gpt-5-mini"] },
      "gemini": { "configured": true, "projectId": "your-project" }
   }
}
```

## Secret Management (Local vs CI)

| Item | Local | CI (GitHub Actions) | Secret? |
|------|-------|---------------------|---------|
| `OPENAI_API_KEY` | `.env` | Repository Secret | Yes |
| `GOOGLE_PROJECT_ID` | `.env` | Repo Variable or env | No |
| Google creds (Gemini) | ADC via `gcloud` | WIF OIDC token → ADC | Not stored |

Deprecated / optional (avoid): `GOOGLE_APPLICATION_CREDENTIALS`, `GEMINI_SERVICE_ACCOUNT_JSON` (only if ADC/WIF unavailable).

## Startup & Validation

On startup the server logs warnings if `OPENAI_API_KEY` or `GOOGLE_PROJECT_ID` are missing. For a quick end‑to‑end check:

```
Invoke-RestMethod http://localhost:4101/api/ai/status | ConvertTo-Json -Depth 4
Invoke-RestMethod http://localhost:4101/selftest/openai | ConvertTo-Json -Depth 4
```

You can also run the PowerShell helper script:
```
pwsh scripts/ai-status-check.ps1
```


