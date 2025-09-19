<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yJG0caR4Cuoj0-kg9F6VHodAC1dAOndK

## Run Locally

**Prerequisites:**  Node.js

Standalone backend
- This frontend is now decoupled from TaleWeaver. Use the new server under `WeaverMainScreen/server`.
- Set `VITE_API_BASE=http://localhost:4101` in a `.env.local` alongside this README (or rely on the default 4101).
- Start the backend first, then run this app.


1. Install dependencies: `npm install`
2. Run the app: `npm run dev`

Do NOT put API keys in the frontend. Keys live only in `WeaverMainScreen/server/.env`.

### Document Editor (Syncfusion Removal)

- The previous Syncfusion-based editor has been removed from the Studio.
- The Studio now always uses the built-in editor UI (`WeaveYourTaleEditor`).
- Any Syncfusion service URLs and license keys have been deleted from env examples and should be removed from local `.env*` files.
- The `/doc-editor` route and related DevTools have been retired.

## API

- POST `/v1/chat` — unified orchestration endpoint. Accepts `OrchestratorInput` and returns `OrchestratorResult` (see `shared/contracts.ts`). Handles persona injection, engine/model selection, retries, and fallbacks.
Type contracts
- Source: `server/contracts/openapi.yaml`
- Generate types: `cd server && npm run gen:types` → writes `shared/generated/api.ts`

### CORS

- Server CORS supports multiple origins via `ALLOW_ORIGINS` (comma/space/semicolon separated).
- Defaults include `http://localhost:{5173,5174,5175,6006}` and `http://127.0.0.1:{5173,5174,5175,6006}`.
- For Storybook, add `http://127.0.0.1:6006` or `http://localhost:6006` to `ALLOW_ORIGINS` if not already permitted.

### CI / Checks

- Run architecture checks: `npm run arch:check`
- Quick integration test: `npm run ci:quick` (health, /v1/chat JSON, /v1/chat/stream SSE inc. end)
- Preflight CORS test: `npm run ci:preflight` (OPTIONS for chat and stream)
- All: `npm run ci:all`

### Dev Manifests Panel (Frontend)

- In dev mode and after login, a small button appears at bottom-right: “Manifests ✓/⚠︎”.
- Click to expand a list showing the load status of:
	- `ai.manifest.json`, `contributor.manifest.json`, `interaction.manifest.json`, `layout.manifest.json`, `offline.manifest.json`, `persona.manifest.json`.
- Files live under `WeaverMainScreen/New .Json/` and are bundled at build-time.
- Source: `components/DevManifestsPanel.tsx`, loader: `services/manifestLoader.ts`.

### Intent Routing CI

- Script: `scripts/ci-intent.mjs`
- Asserts that `intent=editorial` routes to OpenAI; tries `intent=tone` → Gemini.
- If Gemini isn’t configured/usable, the tone check is skipped with a warning but CI still passes.
- Run individually: `npm run ci:intent`, included in `npm run ci:all`.

CI quick check
- From repo root: `npm run arch:check && npm run ci:quick`
- POST `/v1/chat/stream` — SSE streaming of the same orchestration result as incremental chunks with a final `end` event containing metadata.
- POST `/api/openai/chat` — OpenAI direct (legacy)
- POST `/api/gemini/chat` — Gemini direct (legacy)
