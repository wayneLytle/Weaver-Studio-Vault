# Architecture Guardrails

This project follows a layered architecture. Changes must not cross layers inappropriately and should keep responsibilities clear.

Layers
- Frontend (React + Vite + Tailwind) at `WeaverMainScreen/`
- API Gateway (Node/Express orchestrator) at `WeaverMainScreen/server/`
- Core Engine (Rust/WASM) at `core-wasm/` (planned)
- AI Services (Python FastAPI) at `ai-services/` (planned)
- Data (Prisma/Postgres/Redis/S3/Vector) under `infra/` and gateway wiring
- Deployment/Observability under `ops/` and CI/CD

Rules (initial)
- No LLM API keys or direct SDK calls in frontend. All AI calls go through the API Gateway.
- Frontend imports may not import server-only modules (e.g., `express`, `fs`, `openai`).
- API Gateway exposes `/v1/*` only; legacy `/api/*` will be kept temporarily behind a compatibility flag.
- Contracts live in `shared/contracts.ts` and `/contracts` (OpenAPI). Frontend consumes only those types.
- WASM modules are versioned and loaded from `core-wasm/` output. No direct Rust code in frontend.

Validation
- `npm run arch:check` validates these rules locally and in CI.
