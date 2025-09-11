<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1pX_QsM1HgWhC1sh34NXsojnkBsKVRPdb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Visual test runner

There is a small visual runner that performs UI actions and captures screenshots for comparison.

1. Install new dev deps (pixelmatch, pngjs, looks-same):
   ```powershell
   npm install
   ```

2. Start the dev server in one terminal:
   ```powershell
   npm run dev -- --host 127.0.0.1
   ```

3. In another terminal, run the visual runner:
   ```powershell
   node scripts/visual-runner.js scripts/visual-spec.json
   ```

4. Output and screenshots are written to `./visual-out` by default.

