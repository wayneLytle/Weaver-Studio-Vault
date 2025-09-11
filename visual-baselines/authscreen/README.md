Authscreen visual-baselines
==========================

What this folder contains
- `AuthScreenBG.png` — baseline background used for pixel-compare (before)
- `AuthScreenReviewReference.png` — reference image for manual review
- `*.svg` — button and icon assets used by the UI (kept as SVG for scalability)
- `spec.json` — visual-runner spec. Paths are resolved relative to this file.

Units and coordinates
- All coordinates in `spec.json` use percentages (0-100) relative to `canvasSize` (default 1920x1080).
- Position objects use `top`, `left`, `right`, `bottom` as percentage distances from edges.

Runner usage
- Run the visual runner from the repository root. Example (PowerShell):

    node .\scripts\visual-runner.cjs .\visual-baselines\authscreen\spec.json --headed

- The runner writes outputs to the `outDir` defined in `spec.json` (default `visual-out/authscreen`).
- For pixel comparisons, provide PNG baselines in this folder. The runner will report diffs in its JSON result.

Notes
- We removed a duplicate/ambiguous spec file to avoid conflicts. Keep this `spec.json` as the canonical spec for the auth screen.
- If you prefer SVG baselines, convert them to PNG at the target canvas size (1920x1080) before placing them here.

Contact
- If you want me to run the visual runner now and present the diff report, tell me to proceed.
