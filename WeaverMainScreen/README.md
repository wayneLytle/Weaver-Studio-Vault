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
- Set `VITE_API_BASE_URL=http://localhost:4101` in a `.env.local` alongside this README (or rely on the default 4101).
- Start the backend first, then run this app.


1. Install dependencies: `npm install`
2. Run the app: `npm run dev`

Do NOT put API keys in the frontend. Keys live only in `WeaverMainScreen/server/.env`.

### Document Editor Export Capabilities

The document editor queries `/api/documenteditor/Capabilities` to determine whether server-side DOCX / PDF conversion is enabled.

- If `docxConversion` is `false`, selecting DOCX triggers a client-side fallback that downloads the raw SFDT JSON (`.sfdt.json`).
- If `pdfConversion` is `false`, PDF export is disabled in the selector.
- Status / errors surface in the toolbar; capability fetch failures show a transient indicator.

Back-end headers (`X-Export-Status`, `X-Export-Reason`) are used internally for diagnostics and may be surfaced in future DevTools panels.

## API

- POST `/api/chat` — unified orchestration endpoint. Accepts `OrchestratorInput` and returns `OrchestratorResult` (see `shared/contracts.ts`). Handles persona injection, engine/model selection, retries, and fallbacks.
- POST `/api/openai/chat` — OpenAI direct (legacy)
- POST `/api/gemini/chat` — Gemini direct (legacy)
