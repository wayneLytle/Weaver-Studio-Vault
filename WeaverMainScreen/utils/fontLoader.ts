export type FontSpec = {
  label: string;
  family: string; // Google Fonts family name, e.g., "Cinzel Decorative"
  cssFamily?: string; // For CSS var; include quotes when spaces e.g., "'Cinzel Decorative'"
  weights?: number[]; // Desired weights (Google may subset automatically)
};

const ensurePreconnect = () => {
  if (document.getElementById('gf-preconnect')) return;
  const link1 = document.createElement('link');
  link1.id = 'gf-preconnect';
  link1.rel = 'preconnect';
  link1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(link1);
  const link2 = document.createElement('link');
  link2.rel = 'preconnect';
  link2.href = 'https://fonts.gstatic.com';
  // @ts-ignore
  link2.crossOrigin = '';
  document.head.appendChild(link2);
};

export function loadGoogleFont(family: string, weights: number[] = [700, 800, 900]) {
  try {
    ensurePreconnect();
    const id = 'gf-' + family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (document.getElementById(id)) return;
    const famParam = family.replace(/ /g, '+');
    const wParam = (weights && weights.length) ? `:wght@${Array.from(new Set(weights)).sort().join(';')}` : '';
    const href = `https://fonts.googleapis.com/css2?family=${famParam}${wParam}&display=swap`;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  } catch {}
}

export function applyTitleFont(cssFamily: string, weight: number) {
  try {
    document.documentElement.style.setProperty('--vault-title-font', cssFamily);
    document.documentElement.style.setProperty('--vault-title-weight', String(weight));
  } catch {}
}
