# WeaverDocServer

A minimal .NET 8 Web API that provides endpoints for Syncfusion Document Editor integration.

- Base URL: `http://localhost:5000`
- Controller base: `/api/documenteditor`
  - `GET /SystemProperties` — health/diagnostics
  - `POST /Import` — echoes SFDT JSON for wiring validation
  - `POST /Export` — returns SFDT as a file; placeholder for DOCX/PDF conversion
  - `GET /Capabilities` — reports conversion feature availability and diagnostics

## Run

- From VS Code: Run task "WeaverDocServer: Run".
- Or PowerShell:

```
cd "c:/Users/lytle/OneDrive/Desktop/Weavers Studio Vault V1.0/WeaverDocServer"
dotnet run --urls http://localhost:5000
```

## Frontend config

Set in `WeaverMainScreen/.env` (already added during setup):

```
VITE_SYNCFUSION_SERVICE_URL=http://localhost:5000/api/documenteditor/
```

Use the DevTools "Ping Service" button to verify connectivity.

## Notes

- Capability probing: `GET /api/documenteditor/Capabilities` returns JSON `{ status, docxConversion, pdfConversion, diagnostic }` so the frontend can adapt UI state.
- Fallback behavior: When server DOCX conversion is disabled the frontend offers a client-side fallback that downloads the raw SFDT (`.sfdt.json`).
- For full DOCX/PDF conversions, install and wire Syncfusion server-side conversion libraries and replace the placeholders in `DocumentEditorController`.
- CORS is enabled for `http://localhost:5173`, `5174`, and `5180` by default.
