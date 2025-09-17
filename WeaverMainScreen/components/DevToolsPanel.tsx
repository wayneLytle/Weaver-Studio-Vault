import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AiEngine } from '../types';

type DevToolsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  engine: AiEngine;
  openaiModel?: string;
  geminiModel?: string;
  onEngineChange?: (e: AiEngine) => void;
  onOpenaiModelChange?: (m: string) => void;
  onGeminiModelChange?: (m: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
};

const VERBOSE_KEY = 'wms-verbose-logs';
const FLAGS_KEY = 'wms-feature-flags';

function readVerbose(): boolean {
  try { return localStorage.getItem(VERBOSE_KEY) === '1'; } catch { return false; }
}
function writeVerbose(v: boolean) {
  try { localStorage.setItem(VERBOSE_KEY, v ? '1' : '0'); (window as any).__wms_verbose = v; } catch {}
}
function readFlags(): Record<string, boolean> {
  try { const raw = localStorage.getItem(FLAGS_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function writeFlags(obj: Record<string, boolean>) {
  try { localStorage.setItem(FLAGS_KEY, JSON.stringify(obj)); (window as any).__wms_flags = obj; } catch {}
}

function useConsoleCapture(active: boolean) {
  const restoreRef = useRef<null | (() => void)>(null);
  useEffect(() => {
    if (!active) return;
    const buffer: Array<{ level: 'log'|'info'|'warn'|'error'; ts: number; args: any[] }> = [];
    const orig = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    (window as any).__wms_log_buffer = buffer;
    console.log = (...args: any[]) => { buffer.push({ level: 'log', ts: Date.now(), args }); orig.log.apply(console, args); };
    console.info = (...args: any[]) => { buffer.push({ level: 'info', ts: Date.now(), args }); orig.info.apply(console, args); };
    console.warn = (...args: any[]) => { buffer.push({ level: 'warn', ts: Date.now(), args }); orig.warn.apply(console, args); };
    console.error = (...args: any[]) => { buffer.push({ level: 'error', ts: Date.now(), args }); orig.error.apply(console, args); };
    restoreRef.current = () => { console.log = orig.log; console.info = orig.info; console.warn = orig.warn; console.error = orig.error; };
    return () => { restoreRef.current?.(); restoreRef.current = null; };
  }, [active]);
}

type Geom = { x: number; y: number; w: number; h: number };
const GEOM_KEY = 'wms-devtools-geom';

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ isOpen, onClose, engine, openaiModel, geminiModel, onEngineChange, onOpenaiModelChange, onGeminiModelChange, isMuted, onToggleMute }) => {
  const [verbose, setVerbose] = useState<boolean>(() => readVerbose());
  const [flags, setFlags] = useState<Record<string, boolean>>(() => readFlags());
  const [newFlag, setNewFlag] = useState<string>('');
  const [logTick, setLogTick] = useState(0);
  const logs = (window as any).__wms_log_buffer as Array<{ level: string; ts: number; args: any[] }>|undefined;
  useConsoleCapture(isOpen && verbose);
  const minW = 320, minH = 260;
  const [pingResult, setPingResult] = useState<string | null>(null);
  const defaultGeom = (): Geom => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const stored = (() => { try { const raw = localStorage.getItem(GEOM_KEY); return raw ? JSON.parse(raw) as Geom : null; } catch { return null; } })();
    if (stored) {
      return {
        x: clamp(stored.x, 8, Math.max(8, vw - minW - 8)),
        y: clamp(stored.y, 8, Math.max(8, vh - minH - 8)),
        w: clamp(stored.w, minW, Math.max(minW, vw - 16)),
        h: clamp(stored.h, minH, Math.max(minH, vh - 16)),
      };
    }
    const w = 420, h = Math.round(vh * 0.65);
    return { x: Math.max(8, vw - w - 16), y: 16, w, h };
  };
  const [geom, setGeom] = useState<Geom>(() => defaultGeom());
  const dragging = useRef<null | { kind: 'move' | 'e' | 's' | 'se'; sx: number; sy: number; start: Geom }>(null);

  useEffect(() => { writeVerbose(verbose); }, [verbose]);
  useEffect(() => { writeFlags(flags); }, [flags]);
  useEffect(() => { try { localStorage.setItem(GEOM_KEY, JSON.stringify(geom)); } catch {} }, [geom]);

  useEffect(() => {
    if (!isOpen || !verbose) return;
    const t = setInterval(() => setLogTick((n)=>n+1), 750);
    return () => clearInterval(t);
  }, [isOpen, verbose]);

  const openaiModels = useMemo(() => [
    'gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o3-mini'
  ], []);
  const geminiModels = useMemo(() => [
    'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-pro'
  ], []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const onMouseDownMove = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { kind: 'move', sx: e.clientX, sy: e.clientY, start: { ...geom } };
    bindDragListeners();
  };
  const onMouseDownEdge = (kind: 'e'|'s'|'se') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { kind, sx: e.clientX, sy: e.clientY, start: { ...geom } };
    bindDragListeners();
  };

  const bindDragListeners = () => {
    const onMove = (ev: MouseEvent) => {
      const st = dragging.current;
      if (!st) return;
      const dx = ev.clientX - st.sx;
      const dy = ev.clientY - st.sy;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (st.kind === 'move') {
        const nx = clamp(st.start.x + dx, 8, Math.max(8, vw - st.start.w - 8));
        const ny = clamp(st.start.y + dy, 8, Math.max(8, vh - st.start.h - 8));
        setGeom(g => ({ ...g, x: nx, y: ny }));
      } else {
        if (st.kind === 'e' || st.kind === 'se') {
          const nw = clamp(st.start.w + dx, minW, Math.max(minW, vw - st.start.x - 8));
          setGeom(g => ({ ...g, w: nw }));
        }
        if (st.kind === 's' || st.kind === 'se') {
          const nh = clamp(st.start.h + dy, minH, Math.max(minH, vh - st.start.y - 8));
          setGeom(g => ({ ...g, h: nh }));
        }
      }
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const panelId = useMemo(() => `wms-devtools-${Math.random().toString(36).slice(2, 8)}`, []);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Scoped geometry style to avoid inline styles */}
      <style>{`#${panelId}{left:${geom.x}px;top:${geom.y}px;width:${geom.w}px;height:${geom.h}px;}`}</style>
      {/* Floating Window */}
      <div
        id={panelId}
        role="dialog"
        aria-label="Developer Tools"
        className={`absolute pointer-events-auto bg-[#0b0f13] border-2 border-[#e0c87a] text-[#e0c87a] shadow-2xl rounded box-border max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]`}
      >
        {/* Header (drag handle) */}
        <div
          className="px-3 py-2 border-b-2 border-[#e0c87a] flex items-center justify-between cursor-move select-none rounded-t"
          onMouseDown={onMouseDownMove}
        >
          <div className="tracking-widest uppercase text-sm">Developer Tools</div>
          <button onClick={onClose} className="px-2 py-1 rounded border border-[#e0c87a]" title="Close">Close</button>
        </div>

        {/* Content (scrollable) */}
  <div className="p-3 overflow-auto h-[calc(100%-44px)] overscroll-contain">

          {/* Engine & Model */}
        <section className="mb-4">
          <div className="uppercase text-xs tracking-widest mb-2">Engine & Models</div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-2">
              <span>Engine</span>
              <select value={engine} onChange={(e)=>onEngineChange?.(e.target.value as AiEngine)} className="bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]">
                <option value="openai">openai</option>
                <option value="gemini">gemini</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>OpenAI Model</span>
              <select value={openaiModel} onChange={(e)=>onOpenaiModelChange?.(e.target.value)} className="bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]">
                {openaiModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Gemini Model</span>
              <select value={geminiModel} onChange={(e)=>onGeminiModelChange?.(e.target.value)} className="bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]">
                {geminiModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input className="accent-[#e0c87a]" type="checkbox" checked={!!isMuted} onChange={()=>onToggleMute?.()} />
              <span>Mute Response Chime</span>
            </label>
          </div>
        </section>

          {/* Verbose & Flags */}
        <section className="mb-4">
          <div className="uppercase text-xs tracking-widest mb-2">Diagnostics</div>
          <label className="flex items-center gap-2 mb-2">
            <input className="accent-[#e0c87a]" type="checkbox" checked={verbose} onChange={(e)=>setVerbose(e.target.checked)} />
            <span>Verbose Logging</span>
          </label>
          <div className="mb-2">
            <div className="text-[11px] opacity-80 mb-1">Feature Flags</div>
            <div className="flex items-center gap-2 mb-2">
              <input value={newFlag} onChange={(e)=>setNewFlag(e.target.value)} placeholder="flag-name" className="flex-1 bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]" />
              <button onClick={()=>{ if (!newFlag) return; if (flags[newFlag]===undefined) setFlags({ ...flags, [newFlag]: true }); setNewFlag(''); }} className="px-2 py-1 rounded border border-[#e0c87a]">Add</button>
            </div>
            <div className="flex flex-col gap-1">
              {Object.keys(flags).length === 0 && <div className="text-[11px] opacity-70">No flags set.</div>}
              {Object.entries(flags).map(([k,v]) => (
                <label key={k} className="flex items-center justify-between gap-2">
                  <span>{k}</span>
                  <div className="flex items-center gap-2">
                    <input className="accent-[#e0c87a]" type="checkbox" checked={v} onChange={(e)=>setFlags({ ...flags, [k]: e.target.checked })} />
                    <button onClick={()=>{ const { [k]:_, ...rest } = flags; setFlags(rest); }} className="px-1 py-0.5 rounded border border-[#e0c87a]/50 text-[11px]">Remove</button>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

          {/* Syncfusion Status */}
          <section className="mb-4">
            <div className="uppercase text-xs tracking-widest mb-2">Syncfusion</div>
            <div className="text-[12px] opacity-80 mb-2">License and Service URL as detected by the frontend.</div>
            <div className="grid grid-cols-1 gap-1 text-[12px]">
              <div>
                <span className="opacity-70">License Key Present:</span>
                <span className="ml-2">{((import.meta as any).env?.VITE_SYNCFUSION_LICENSE_KEY ? 'Yes' : 'No')}</span>
              </div>
              <div className="break-all">
                <span className="opacity-70">Service URL:</span>
                <span className="ml-2">{(import.meta as any).env?.VITE_SYNCFUSION_SERVICE_URL || '(not set)'}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="px-2 py-1 rounded border border-[#e0c87a]"
                onClick={async ()=>{
                  setPingResult(null);
                  const url = (import.meta as any).env?.VITE_SYNCFUSION_SERVICE_URL as string | undefined;
                  if (!url) { setPingResult('No service URL set'); return; }
                  try {
                    const health = url.replace(/\/$/, '') + '/SystemProperties';
                    const res = await fetch(health, { method: 'GET' });
                    const text = await res.text();
                    setPingResult(`HTTP ${res.status}: ${text.slice(0, 300)}${text.length>300?'…':''}`);
                  } catch (e:any) {
                    setPingResult(`Error: ${e?.message || String(e)}`);
                  }
                }}
              >Ping Service</button>
              {pingResult && <div className="text-[12px] opacity-80 break-all">{pingResult}</div>}
            </div>
            <div className="text-[11px] opacity-60 mt-2">Add to your .env in WeaverMainScreen:</div>
            <pre className="bg-[#141a20] border border-[#e0c87a]/40 rounded p-2 text-[12px] overflow-x-auto w-full max-w-full">VITE_SYNCFUSION_LICENSE_KEY=...{"\n"}VITE_SYNCFUSION_SERVICE_URL=https://your-doceditor-server/api/documenteditor/</pre>
          </section>

          {/* OpenAI Check */}
        <section className="mb-4">
          <div className="uppercase text-xs tracking-widest mb-2">OpenAI Check</div>
          <div className="text-[12px] opacity-80 mb-2">Run this in a terminal at <code>WeaverMainScreen</code>:</div>
          <pre className="bg-[#141a20] border border-[#e0c87a]/40 rounded p-2 text-[12px] overflow-x-auto w-full max-w-full">npm run check:openai</pre>
        </section>

          {/* Console Tail */}
        {verbose && (
          <section className="mb-4">
            <div className="uppercase text-xs tracking-widest mb-2">Console Tail</div>
            <div className="h-[180px] overflow-y-auto overflow-x-auto bg-[#141a20] border border-[#e0c87a]/30 rounded p-2 text-[12px] leading-snug">
              {!logs || logs.length === 0 ? (
                <div className="opacity-70">No logs yet. Interact with the app…</div>
              ) : (
                logs.slice(-150).map((row, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words">
                    <span className={row.level === 'error' ? 'text-red-300' : row.level === 'warn' ? 'text-yellow-300' : 'text-[#e0c87a]'}>
                      [{new Date(row.ts).toLocaleTimeString()}] {row.level.toUpperCase()}: {row.args.map(a => typeof a === 'string' ? a : (()=>{ try { return JSON.stringify(a); } catch { return String(a); } })()).join(' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

          <div className="text-[11px] opacity-60">Settings are stored locally in your browser for development.</div>
        </div>

        {/* Resize Handles */}
        <div onMouseDown={onMouseDownEdge('e')} className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize" aria-hidden="true" />
        <div onMouseDown={onMouseDownEdge('s')} className="absolute left-0 bottom-0 w-full h-1.5 cursor-ns-resize" aria-hidden="true" />
        <div onMouseDown={onMouseDownEdge('se')} className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize" aria-hidden="true" />
      </div>
    </div>
  );
};

export default DevToolsPanel;
