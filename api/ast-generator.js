#!/usr/bin/env node
import express from 'express';
import fs from 'fs';
import path from 'path';
import { Project, ts } from 'ts-morph';

const app = express();
app.use(express.json({ limit: '10mb' }));

// allow cross-origin requests from the frontend dev server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const MANIFEST_DIR = path.join(process.cwd(), 'data', 'dev_manifests');
const PATCH_DIR = path.join(process.cwd(), 'data', 'manifest-patches-ast');
if (!fs.existsSync(PATCH_DIR)) fs.mkdirSync(PATCH_DIR, { recursive: true });

function latestFileInDir(dir) {
  const files = fs.readdirSync(dir).map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtime.getTime() })).sort((a,b)=>b.t-a.t);
  return files.length ? files[0].f : null;
}

app.post('/dev/create-patch', async (req, res) => {
  try {
    // pick latest manifest by default
    const latest = latestFileInDir(MANIFEST_DIR);
    if (!latest) return res.status(400).json({ error: 'no manifest' });
    const manifest = JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, latest), 'utf8'));

  // improved rules: use aria-label / className / role from insert events to find or create nodes
    const project = new Project({ tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json') });
    const filePath = path.join(process.cwd(), 'components', 'AuthScreen.tsx');
    const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);

    let modified = false;

    for (const ev of manifest.events || []) {
      if (ev.op === 'update' || ev.op === 'modify') {
        const oldText = ev.diff && (ev.diff.oldText || ev.diff.fromText);
        const newText = ev.diff && (ev.diff.text || ev.diff.toText || ev.diff.label);
        if (oldText && newText) {
          // find string literal occurrences in JSX text and replace
          const jsxTexts = sourceFile.getDescendantsOfKind(ts.SyntaxKind.JsxText);
          jsxTexts.forEach(node => {
            const txt = node.getText();
            if (txt.includes(oldText)) {
              node.replaceWithText(txt.replace(oldText, newText));
              modified = true;
            }
          });
        }
      }
      if (ev.op === 'insert' && ev.diff) {
        const props = ev.diff.props || {};
        const label = ev.diff.label || ev.diff.text || props.text || 'NEW_BUTTON';
        const aria = props.ariaLabel || ev.diff.ariaLabel || ev.diff.label;
        const cls = props.className || ev.diff.className;
        const roleAttr = props.role || ev.diff.role;

        // try to find an existing node by aria-label/className/role
        const jsxElements = sourceFile.getDescendantsOfKind(ts.SyntaxKind.JsxElement);
        let found = null;
        for (const el of jsxElements) {
          const txt = el.getText();
          if (aria && txt.includes(`aria-label=\"${aria}\"`)) { found = el; break; }
          if (cls && txt.includes(`className={${cls}}`) || (cls && txt.includes(`className=\"${cls}\"`))) { found = el; break; }
          if (roleAttr && txt.includes(`role=\"${roleAttr}\"`)) { found = el; break; }
        }

        // if found, try to append a button nearby; otherwise insert into the vault-buttons nav
        const insertionAttrs = [];
        if (aria) insertionAttrs.push(`aria-label=\"${aria}\"`);
        if (cls) insertionAttrs.push(`className=\"${cls}\"`);
        if (roleAttr) insertionAttrs.push(`role=\"${roleAttr}\"`);
        const insertionProps = insertionAttrs.length ? ' ' + insertionAttrs.join(' ') : '';

        const buttonJsx = `\n                            <OrnateFrame>\n                                <button${insertionProps}>\n                                    ${label}\n                                </button>\n                            </OrnateFrame>\n`;

        if (found) {
          const close = found.getClosingElement();
          if (close) {
            try {
              close.replaceWithText(buttonJsx + close.getText());
              modified = true;
            } catch (err) {
              // fallback to text-based patch when AST replace fails
              console.warn('AST replace failed for found node, falling back to text insertion:', String(err));
              const raw = fs.readFileSync(filePath, 'utf8');
              const insertBefore = close.getText();
              const pos = raw.indexOf(insertBefore);
              if (pos !== -1) {
                const newRaw = raw.slice(0, pos) + buttonJsx + raw.slice(pos);
                const tsNow = new Date().toISOString().replace(/[:.]/g, '-');
                const outPath = path.join(PATCH_DIR, `patch-${tsNow}.tsx`);
                fs.writeFileSync(outPath, newRaw, 'utf8');
                const origPath = outPath + '.orig';
                if (!fs.existsSync(origPath)) fs.writeFileSync(origPath, raw, 'utf8');
                return res.json({ ok: true, patch: outPath });
              }
            }
          }
        } else {
          const navs = jsxElements.filter(n => n.getText().includes('className="vault-buttons"') || n.getText().includes('vault-buttons'));
          if (navs.length > 0) {
            const nav = navs[0];
            const close = nav.getClosingElement();
            if (close) {
              try {
                close.replaceWithText(buttonJsx + close.getText());
                modified = true;
              } catch (err) {
                console.warn('AST replace failed for nav close, falling back to text insertion:', String(err));
                const raw = fs.readFileSync(filePath, 'utf8');
                const insertBefore = close.getText();
                const pos = raw.indexOf(insertBefore);
                if (pos !== -1) {
                  const newRaw = raw.slice(0, pos) + buttonJsx + raw.slice(pos);
                  const tsNow = new Date().toISOString().replace(/[:.]/g, '-');
                  const outPath = path.join(PATCH_DIR, `patch-${tsNow}.tsx`);
                  fs.writeFileSync(outPath, newRaw, 'utf8');
                  const origPath = outPath + '.orig';
                  if (!fs.existsSync(origPath)) fs.writeFileSync(origPath, raw, 'utf8');
                  return res.json({ ok: true, patch: outPath });
                }
              }
            }
          }
        }
      }
    }

    if (!modified) return res.json({ ok: true, patchCreated: false });

    const tsNow = new Date().toISOString().replace(/[:.]/g, '-');
    const outPath = path.join(PATCH_DIR, `patch-${tsNow}.tsx`);
    await sourceFile.save();
    // write the modified file copy as patch preview (we don't commit original file)
    fs.writeFileSync(outPath, sourceFile.getFullText(), 'utf8');
    // also save the original source for preview/inspection
    const origPath = outPath + '.orig';
    if (!fs.existsSync(origPath)) {
      const orig = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(origPath, orig, 'utf8');
    }
    return res.json({ ok: true, patch: outPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/dev/patches', (req, res) => {
  const list = fs.readdirSync(PATCH_DIR).map(f => ({ name: f, path: path.join(PATCH_DIR, f) }));
  res.json(list);
});

// receive activity events (client-side UI actions) for auditing / snapshotting
app.post('/dev/activity', (req, res) => {
  try {
    const ev = req.body;
    if (!ev || !ev.id) return res.status(400).json({ error: 'missing event' });
    const outDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const logPath = path.join(outDir, 'dev_activity.log');
    const line = JSON.stringify({ ts: new Date().toISOString(), ev }) + '\n';
    fs.appendFileSync(logPath, line, 'utf8');
    // optional snapshot
    if (ev.snapshot && typeof ev.snapshot === 'string') {
      const snapDir = path.join(outDir, 'activity-snapshots');
      if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir, { recursive: true });
      const snapPath = path.join(snapDir, `${ev.id}-${Date.now()}.html`);
      fs.writeFileSync(snapPath, ev.snapshot, 'utf8');
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('activity write failed', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/dev/patch-preview', (req, res) => {
  try {
    const p = req.query.path;
    if (!p) return res.status(400).json({ error: 'missing path' });
    const full = String(p);
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'not found' });
    const mod = fs.readFileSync(full, 'utf8');
    const orig = fs.existsSync(full + '.orig') ? fs.readFileSync(full + '.orig', 'utf8') : null;
    return res.json({ ok: true, original: orig, modified: mod });
  } catch (err) { return res.status(500).json({ error: String(err) }); }
});

app.post('/dev/apply-patch', (req, res) => {
  try {
    const { patch } = req.body || {};
    if (!patch || !fs.existsSync(patch)) return res.status(400).json({ error: 'missing patch' });
    // overwrite target file with patch content (explicit apply)
    // safety: only allow files inside components/
    const content = fs.readFileSync(patch, 'utf8');
    // parse first line to identify target (we'll assume AuthScreen for now)
    const target = path.join(process.cwd(), 'components', 'AuthScreen.tsx');
    fs.writeFileSync(target, content, 'utf8');
    return res.json({ ok: true, appliedTo: target });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('AST patch API listening at http://localhost:' + port));
