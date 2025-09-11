import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '5mb' }));

const STORAGE_DIR = path.join(process.cwd(), 'data', 'dev_manifests');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

app.post('/dev/save-manifest', async (req, res) => {
  try {
    const manifest = req.body;
    if (!manifest) return res.status(400).json({ error: 'missing manifest body' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `manifest-${ts}.json`;
    const filePath = path.join(STORAGE_DIR, fileName);
    await fs.promises.writeFile(filePath, JSON.stringify(manifest, null, 2), 'utf8');
    return res.json({ ok: true, path: filePath, name: fileName });
  } catch (err) {
    console.error('save-manifest error', err);
    return res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Dev manifest API listening at http://localhost:${port}`);
});
