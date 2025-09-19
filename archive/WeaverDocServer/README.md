# WeaverDocServer (Archived)

Status: Archived on 2025-09-19

This .NET 8 Web API previously provided endpoints for Syncfusion Document Editor integration (SFDT processing and DOCX/PDF conversions).

Why archived
- The Studio removed Syncfusion from its logic and UI.
- The built-in editor (`WeaveYourTaleEditor`) is now the default and no longer requires a separate document server.

Historical details
- Former controller base: `/api/documenteditor`
- Example endpoints: `GET /SystemProperties`, `POST /Import`, `POST /Export`, `GET /Capabilities`
- Former dependencies: `Syncfusion.EJ2.WordEditor.AspNet.Core`, `Syncfusion.DocIO.Net.Core`, `Syncfusion.DocIORenderer.Net.Core`

Revival guidance (not recommended)
- If you must resurrect this project, replace Syncfusion packages and licensing with non-proprietary alternatives and update any env variables accordingly.
- Ensure CORS and security headers meet current standards before exposing any endpoints.
