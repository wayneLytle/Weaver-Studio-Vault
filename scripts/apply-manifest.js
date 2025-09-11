#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function latestFileInDir(dir) {
  const files = fs.readdirSync(dir).map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtime.getTime() })).sort((a,b)=>b.t-a.t);
  return files.length ? files[0].f : null;
}

const MANIFEST_DIR = path.join(process.cwd(), 'data', 'dev_manifests');
const PATCH_DIR = path.join(process.cwd(), 'data', 'manifest-patches');
if (!fs.existsSync(PATCH_DIR)) fs.mkdirSync(PATCH_DIR, { recursive: true });

const latest = latestFileInDir(MANIFEST_DIR);
if (!latest) {
  console.error('No manifest files found in', MANIFEST_DIR);
  process.exit(1);
}

const manifestPath = path.join(MANIFEST_DIR, latest);
console.log('Using manifest:', manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// We'll attempt edits on components/AuthScreen.tsx
const targetPath = path.join(process.cwd(), 'components', 'AuthScreen.tsx');
if (!fs.existsSync(targetPath)) {
  console.error('Target file not found:', targetPath);
  process.exit(1);
}
const original = fs.readFileSync(targetPath, 'utf8');
let modified = original;

// Rule A: For insert events that look like a button insertion, add a new button into the vault-buttons nav
const insertEvents = (manifest.events || []).filter(e => e.op === 'insert' || (e.op && e.diff && (e.diff.kind === 'button' || e.diff.text || e.diff.label)));
for (const ev of insertEvents) {
  const label = (ev.diff && (ev.diff.text || ev.diff.label)) || 'NEW BUTTON';
  // build a simple button JSX using the project's sharedButtonClasses variable
  const btnJSX = `\n                            <OrnateFrame>\n                                <button aria-label="${label}" className={sharedButtonClasses + ' py-[13px]'}>\n                                    ${label}\n                                </button>\n                            </OrnateFrame>\n`;
  // insert into the first vault-buttons nav block (before its closing </nav>)
  const navRegex = /(\<nav[^>]*className=\"vault-buttons[^>]*\>[\s\S]*?)(<\/nav>)/m;
  if (navRegex.test(modified)) {
    modified = modified.replace(navRegex, (m, before, close) => {
      // try to insert inside the first OrnateFrame occurrence inside the nav if present
      // fallback: insert right before close
      return before + btnJSX + close;
    });
  }
}

// Rule B: For update events with text changes, attempt to replace occurrences of the old text in button labels
const updateEvents = (manifest.events || []).filter(e => e.op && e.op.startsWith('update') || e.op === 'modify');
for (const ev of updateEvents) {
  if (!ev.diff) continue;
  const oldText = ev.diff.oldText || ev.diff.fromText;
  const newText = ev.diff.text || ev.diff.toText || ev.diff.label;
  if (oldText && newText) {
    // naive replace of the literal oldText in JSX text nodes (e.g., >LOGIN< )
    const esc = oldText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const rx = new RegExp(`>(\\s*)${esc}(\\s*)<`, 'g');
    modified = modified.replace(rx, `>$1${newText}$2<`);
  }
}

// If modified differs from original, write out a patch file showing original and modified snippets
if (modified === original) {
  console.log('No changes suggested by generator for', targetPath);
  const out = { manifest: manifestPath, patchCreated: false };
  const outPath = path.join(PATCH_DIR, `patch-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote no-op patch descriptor to', outPath);
  process.exit(0);
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const patchFile = path.join(PATCH_DIR, `patch-${ts}.diff`);
const diffContent = `*** Update File: components/AuthScreen.tsx\n--- original\n+++ modified\n\n/* --- original content (truncated) --- */\n` + original.substring(0, 200) + `\n...\n/* --- modified preview (truncated) --- */\n` + modified.substring(0, 200) + `\n...\n`;
fs.writeFileSync(patchFile, diffContent, 'utf8');
// Also write the full modified file for inspection
const outFile = path.join(PATCH_DIR, `components.AuthScreen.modified.${ts}.tsx`);
fs.writeFileSync(outFile, modified, 'utf8');

console.log('Patch written to', patchFile);
console.log('Full modified target written to', outFile);
