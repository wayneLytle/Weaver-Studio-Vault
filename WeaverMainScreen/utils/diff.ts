export type DiffToken = { type: 'equal' | 'add' | 'del'; text: string };

export function diffWords(oldStr: string, newStr: string): DiffToken[] {
  const a = tokenize(oldStr);
  const b = tokenize(newStr);
  const m = a.length; const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1; else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffToken[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { out.push({ type: 'equal', text: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: a[i] }); i++; }
    else { out.push({ type: 'add', text: b[j] }); j++; }
  }
  while (i < m) { out.push({ type: 'del', text: a[i++] }); }
  while (j < n) { out.push({ type: 'add', text: b[j++] }); }
  return mergeRuns(out);
}

function tokenize(str: string): string[] {
  // Split on whitespace boundaries, keeping punctuation attached
  return str.match(/\S+|\n/g) || [];
}

function mergeRuns(tokens: DiffToken[]): DiffToken[] {
  if (!tokens.length) return tokens;
  const merged: DiffToken[] = [];
  let prev = tokens[0];
  for (let k = 1; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.type === prev.type) {
      prev = { ...prev, text: prev.text + ' ' + t.text };
    } else {
      merged.push(prev);
      prev = t;
    }
  }
  merged.push(prev);
  return merged;
}

export function renderDiffHtml(oldStr: string, newStr: string): string {
  const tokens = diffWords(oldStr, newStr);
  return tokens.map(t => {
    if (t.type === 'equal') return escapeHtml(t.text) + ' ';
    if (t.type === 'add') return `<span style="background:rgba(40,180,99,0.28);">${escapeHtml(t.text)}</span> `;
    return `<span style="background:rgba(200,60,60,0.30);text-decoration:line-through;">${escapeHtml(t.text)}</span> `;
  }).join('').trim();
}

function escapeHtml(s: string){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string));
}