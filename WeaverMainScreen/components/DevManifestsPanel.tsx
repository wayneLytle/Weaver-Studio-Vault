import React, { useEffect, useMemo, useState } from 'react';
import { getCachedManifests, loadManifests } from '../services/manifestLoader';

type Entry = { key: string; ok: boolean; details?: string };

function validate(): Entry[] {
  const m = getCachedManifests();
  const out: Entry[] = [];
  const add = (key: string, ok: boolean, details?: string) => out.push({ key, ok, details });
  add('ai.manifest.json', !!m?.ai, !m?.ai ? 'missing' : undefined);
  add('contributor.manifest.json', !!m?.contributor, !m?.contributor ? 'missing' : undefined);
  add('interaction.manifest.json', !!m?.interaction, !m?.interaction ? 'missing' : undefined);
  add('layout.manifest.json', !!m?.layout, !m?.layout ? 'missing' : undefined);
  add('offline.manifest.json', !!m?.offline, !m?.offline ? 'missing' : undefined);
  const hasPersona = !!m?.persona?.persona || !!m?.persona;
  add('persona.manifest.json', hasPersona, !hasPersona ? 'missing' : undefined);
  // Spot-check AI routing shape
  if (m?.ai?.routing && typeof m.ai.routing === 'object') {
    const intents = Object.keys(m.ai.routing);
    if (intents.length === 0) add('ai.routing', false, 'empty');
  }
  return out;
}

export default function DevManifestsPanel() {
  const [expanded, setExpanded] = useState(false);
  const [rev, setRev] = useState(0);
  useEffect(() => {
    (async () => { try { await loadManifests(); setRev((r) => r + 1); } catch {} })();
  }, []);
  const checks = useMemo(() => validate(), [rev]);
  const anyFail = checks.some(c => !c.ok);
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={(anyFail ? 'border-red-400 text-red-200' : 'border-amber-400 text-amber-200') + ' rounded-md border-2 bg-[#0a0c0e]/95 px-3 py-1 text-xs tracking-widest uppercase shadow-[0_0_10px_rgba(0,0,0,0.35)] hover:shadow-[0_0_16px_rgba(224,200,122,0.25)]'}
        title="Dev: Manifests"
      >
        Manifests {anyFail ? '⚠︎' : '✓'}
      </button>
      {expanded && (
        <div className="mt-2 w-80 max-w-[90vw] rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e]/95 p-3 text-sm text-stone-200">
          <div className="text-xs uppercase tracking-widest text-[#e0c87a]/80 mb-2">Manifest Status</div>
          <ul className="space-y-1">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center justify-between">
                <span>{c.key}</span>
                <span className={c.ok ? 'text-green-400' : 'text-red-400'}>{c.ok ? 'OK' : (c.details || 'FAIL')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
