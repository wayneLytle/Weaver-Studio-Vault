import React, { useEffect, useRef, useState } from 'react';
import type { AiEngine } from '../types';
import { chat } from '../services/chatService';

export type ReviewCard = {
  id: string;
  createdAt: number;
  selection: string;
  rationale: string;
  replacement: string;
  target?: string;
  status?: 'new' | 'accepted' | 'rejected';
};

export type ReviewsPanelProps = {
  userName: string;
  engine: AiEngine;
  geminiModel?: string;
  openaiModel?: string;
  style?: string;
  genre?: string;
  role?: string;
  writer?: string;
  editorialMode?: boolean;
  highlightEnabled: boolean;
  highlightColor: string;
  onInsert: (text: string) => void;
  onReplaceExact?: (findText: string, newText: string) => boolean;
  getSelectedText: () => string;
  getAllText: () => string; // for live suggestion sampling
};

const STORAGE_KEY = 'wms-tw-review-cards';
const LIVE_INTERVAL_MS = 30000; // 30s

const ReviewsPanel: React.FC<ReviewsPanelProps> = ({ userName, engine, geminiModel, openaiModel, style, genre, role, writer, editorialMode, highlightEnabled, highlightColor, onInsert, onReplaceExact, getSelectedText, getAllText }) => {
  const [cards, setCards] = useState<ReviewCard[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ReviewCard[];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [busy, setBusy] = useState(false); // manual review button busy
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveCard, setLiveCard] = useState<ReviewCard | null>(null);
  const [livePhase, setLivePhase] = useState<'idle' | 'fading-in' | 'visible' | 'fading-out'>('idle');
  const liveTimerRef = useRef<number | null>(null);
  const genRef = useRef<number>(0); // increment to cancel outdated generations
  const mountedRef = useRef<boolean>(false);
  const showRationale = true; // always show for simplified layout

  // persist cards whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); } catch {}
  }, [cards]);

  const buildSystemInstruction = (deeper: boolean) => [
    'You are Tālia, a warm, expert literary editor.',
    deeper ? 'Perform deeper analysis and coaching suitable for publication readiness.' : 'Focus on flow, clarity, rhythm, and style consistency.',
  'Given text, provide: a brief rationale; a specific target snippet from the text to replace; and a suggested replacement.',
  'Keep rationale under 120 words. Keep replacement tight and faithful to intent.',
  'Return RAW JSON only with keys rationale, target, replacement. Do NOT wrap JSON in markdown fences or any commentary.',
    style ? `Style: ${style}.` : '',
    genre ? `Genre: ${genre}.` : '',
    role ? `Role: ${role}.` : '',
    writer ? `Emulate: ${writer} (tone and cadence only).` : '',
  ].filter(Boolean).join(' ');

  const reviewSelected = async () => {
    const selection = (getSelectedText() || '').trim();
    if (!selection) return;
    setBusy(true);
    try {
      const sys = buildSystemInstruction(Boolean(editorialMode));
      const payload = {
        engine,
        model: engine === 'openai' ? openaiModel : geminiModel,
        messages: [
          { role: 'user', content: `Review this passage and reply as JSON with keys rationale, target, replacement. The 'target' must be a substring from the passage to replace. Passage:\n\n${selection}` },
        ],
        systemInstruction: sys,
        persona: undefined,
      } as const;
      const result = await chat(payload as any);
      const text = result?.content || '';
  let rationale = '', replacement = '', target = '';
      const stripFences = (raw: string) => raw.replace(/```[a-zA-Z]*\s*([\s\S]*?)```/g, '$1');
      const cleaned = stripFences(text).trim();
      const extractJson = (raw: string): any | null => {
        // attempt direct parse
        try { return JSON.parse(raw); } catch {}
        // find first JSON object substring
        const first = raw.indexOf('{');
        const last = raw.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const slice = raw.slice(first, last + 1);
          try { return JSON.parse(slice); } catch {}
        }
        return null;
      };
      const parsed = extractJson(cleaned);
      if (parsed) {
        rationale = (parsed.rationale || '').trim();
        target = (parsed.target || '').trim();
        replacement = (parsed.replacement || '').trim();
      } else {
        // heuristic fallback
        const rMatch = cleaned.match(/"?rationale"?\s*[:\-]\s*("([^"]+)"|([\s\S]*?))(,|"?target"?|"?replacement"?|$)/i);
        const tMatch = cleaned.match(/"?target"?\s*[:\-]\s*("([^"]+)"|([\s\S]*?))(,|"?replacement"?|$)/i);
        const replMatch = cleaned.match(/"?replacement"?\s*[:\-]\s*("([^"]+)"|([\s\S]*?))(\}|$)/i);
        rationale = (rMatch?.[2] || rMatch?.[3] || cleaned).trim().replace(/^"|"$/g,'');
        target = (tMatch?.[2] || tMatch?.[3] || selection).trim().replace(/^"|"$/g,'');
        replacement = (replMatch?.[2] || replMatch?.[3] || '').trim().replace(/^"|"$/g,'');
      }
      const card: ReviewCard = { id: String(Date.now()), createdAt: Date.now(), selection, rationale, replacement, target: target || selection, status: 'new' };
      setCards((prev) => [card, ...prev]);
    } finally {
      setBusy(false);
    }
  };

  const closeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  // Live suggestion generation
  const generateLiveSuggestion = async () => {
    if (liveBusy) return;
    const all = (getAllText() || '').trim();
    if (!all) return; // nothing to analyze yet
    setLiveBusy(true);
    const myGen = ++genRef.current;
    try {
      // sample last ~600 chars (end focus) for micro-suggestion
      const sample = all.slice(-600);
      const sys = buildSystemInstruction(false) + ' Create a MICRO-SUGGESTION on the provided text excerpt, focusing on clarity, rhythm, or vividness. Provide JSON with keys rationale and replacement. The replacement should be a refined version of a small portion or a single sentence, not the entire excerpt.';
      const payload = {
        engine,
        model: engine === 'openai' ? openaiModel : geminiModel,
        messages: [
          { role: 'user', content: `Provide a micro editorial improvement for this excerpt. Reply ONLY JSON with rationale and replacement. Excerpt:\n\n${sample}` },
        ],
        systemInstruction: sys,
        persona: undefined,
      } as const;
      const result = await chat(payload as any);
      if (genRef.current !== myGen) return; // outdated
      const text = result?.content || '';
      const stripFences = (raw: string) => raw.replace(/```[a-zA-Z]*\s*([\s\S]*?)```/g, '$1');
      const cleaned = stripFences(text).trim();
  let rationale = '', replacement = '', target = '';
      try {
        const parsed = JSON.parse(cleaned);
        rationale = (parsed.rationale || '').trim();
        target = (parsed.target || '').trim();
        replacement = (parsed.replacement || '').trim();
      } catch {
        // attempt inner object extraction
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          try {
            const parsed = JSON.parse(cleaned.slice(first, last + 1));
            rationale = (parsed.rationale || '').trim();
            replacement = (parsed.replacement || '').trim();
          } catch {}
        }
        if (!rationale) {
          const rMatch = cleaned.match(/"?rationale"?\s*[:\-]\s*("([^"]+)"|([\s\S]*?))(,|"?replacement"?|$)/i);
          rationale = (rMatch?.[2] || rMatch?.[3] || cleaned).trim().replace(/^"|"$/g,'');
        }
        if (!target) {
          const tMatch = cleaned.match(/"?target"?\s*[:\-]\s*("([^"]+)"|([\s\S]*?))(,|"?replacement"?|$)/i);
          target = (tMatch?.[2] || tMatch?.[3] || '').trim().replace(/^"|"$/g,'');
        }
        if (!replacement) {
          const replMatch = cleaned.match(/"?replacement"?\s*[:\-]\s*("([^"]+)"|([\s\S]*?))(\}|$)/i);
          replacement = (replMatch?.[2] || replMatch?.[3] || '').trim().replace(/^"|"$/g,'');
        }
      }
      const card: ReviewCard = { id: 'live-'+Date.now(), createdAt: Date.now(), selection: sample, rationale, replacement, target: target || '', status: 'new' };
      // handle fade-out of old live card then fade-in new one
      setLivePhase(prev => prev === 'visible' ? 'fading-out' : 'fading-in');
      if (liveCard) {
        // allow fade-out before replacing
        setTimeout(() => {
          setLiveCard(card);
          setLivePhase('fading-in');
          requestAnimationFrame(()=>{ setLivePhase('visible'); });
        }, 250);
      } else {
        setLiveCard(card);
        requestAnimationFrame(()=>{ setLivePhase('visible'); });
      }
    } finally {
      if (genRef.current === myGen) setLiveBusy(false);
    }
  };

  // interval to refresh live suggestion
  useEffect(() => {
    mountedRef.current = true;
    // initial delay shorter to show first suggestion sooner
    const first = window.setTimeout(() => generateLiveSuggestion(), 4000);
    const interval = window.setInterval(() => generateLiveSuggestion(), LIVE_INTERVAL_MS);
    return () => { mountedRef.current = false; window.clearTimeout(first); window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, openaiModel, geminiModel, style, genre, role, writer, editorialMode]);

  const acceptLive = () => {
    if (!liveCard) return;
    onInsert(liveCard.replacement || '');
    // archive into cards history
    setCards(prev => [{ ...liveCard, id: liveCard.id.replace('live-','hist-') }, ...prev]);
    setLivePhase('fading-out');
    setTimeout(()=>{ setLiveCard(null); setLivePhase('idle'); }, 250);
  };
  const dismissLive = () => {
    if (!liveCard) return;
    setLivePhase('fading-out');
    setTimeout(()=>{ setLiveCard(null); setLivePhase('idle'); }, 250);
  };

  // set CSS variable for highlight globally (scoped via style tag)
  const hlColor = (highlightEnabled ? (highlightColor || 'rgba(224,200,122,0.28)') : 'transparent');
  return (
    <div className="h-[72vh] flex flex-col">
      <style>{`:root{ --wms-hl-color: ${hlColor}; }`}</style>
      <div className="relative min-h-0 flex-1 overflow-hidden">
  <div className="absolute inset-0 overflow-y-auto pr-1 pb-20 scrollbar-thin hover:scrollbar-thumb-[#e0c87a]/70 scrollbar-thumb-[#e0c87a]/40 scrollbar-track-transparent">
          {liveCard && (
            <div
              className={
                'mb-3 rounded border border-[#e0c87a]/80 bg-[#12181e] p-3 transition-opacity duration-300 ' +
                (livePhase === 'fading-in' ? 'opacity-0' : livePhase === 'fading-out' ? 'opacity-0' : 'opacity-100')
              }
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-[#e0c87a]/90 uppercase tracking-widest">Live Suggestion — {new Date(liveCard.createdAt).toLocaleTimeString()}</div>
                <div className="flex gap-2">
                  <button onClick={dismissLive} className="text-[10px] px-2 py-0.5 rounded border border-[#e0c87a]/40 text-[#e0c87a]/70">Dismiss</button>
                  <button onClick={acceptLive} className="text-[10px] px-2 py-0.5 rounded border-2 border-[#e0c87a] text-[#e0c87a]">Accept</button>
                </div>
              </div>
              <div className="mb-2 text-sm text-stone-300">
                <p>{liveCard.rationale || '—'}</p>
              </div>
              <div className="mb-1">
                <div className="text-xs text-[#e0c87a]/80 uppercase tracking-widest mb-1">Suggestion</div>
                <div className="p-2 rounded bg-hl">
                  <pre className="whitespace-pre-wrap text-stone-200 text-sm">{liveCard.replacement || '—'}</pre>
                </div>
              </div>
              <div className="flex justify-end text-[10px] text-[#e0c87a]/50">Auto-refreshes every 30s</div>
            </div>
          )}
          {cards.length === 0 && (
            <div className="text-stone-400 text-sm mt-2 px-1">No feedback yet. Select text in the editor, then click Review Selected Work.</div>
          )}
          {cards.map((c) => (
            <div key={c.id} className="mb-3 rounded border border-[#e0c87a]/60 bg-[#0d1116] p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-[#e0c87a]/80 uppercase tracking-widest">Talia — {new Date(c.createdAt).toLocaleTimeString()}</div>
                <button onClick={()=>closeCard(c.id)} className="text-[10px] px-2 py-0.5 rounded border border-[#e0c87a]/40 text-[#e0c87a]/70">Close</button>
              </div>
              <div className="mb-2 text-sm text-stone-300">
                <p>{c.rationale || '—'}</p>
              </div>
              <div className="mb-2">
                <div className="text-xs text-[#e0c87a]/80 uppercase tracking-widest mb-1">Suggestion</div>
                <div className="p-2 rounded bg-hl">
                  <pre className="whitespace-pre-wrap text-stone-200 text-sm">{c.replacement || '—'}</pre>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = c.replacement || '';
                    const ok = c.target && onReplaceExact ? onReplaceExact(c.target, text) : false;
                    if (!ok) onInsert(text);
                  }}
                  className="px-3 py-1 rounded border-2 border-[#e0c87a] text-[#e0c87a]"
                >
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
  <div className="absolute left-0 right-0 bottom-0 z-10 px-0 py-2 bg-gradient-to-t from-[#0b0f13] via-[#0b0f13]/95 to-transparent backdrop-blur-[2px] shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.6)]">
          <div className="pt-2 flex justify-center">
            <button onClick={reviewSelected} disabled={busy} className="px-4 py-2 rounded border-2 border-[#e0c87a] text-[#e0c87a] disabled:opacity-60 tracking-widest text-xs">REVIEW SELECTED WORK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPanel;
