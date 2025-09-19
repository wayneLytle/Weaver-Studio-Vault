import React, { useEffect, useMemo, useRef, useState } from 'react';
import WeaveYourTaleEditor, { WeaveEditorHandle } from './WeaveYourTaleEditor';
import ChatContainer from './ChatContainer';
import { buildTaleWeaverInstruction } from '../services/promptHelpers';
import type { TaleWeaverSettings, AiEngine } from '../types';
import ReviewsPanel from './ReviewsPanel';
import { getPersona, setPersona } from '../services/personaStore';
import RestorePointModal, { RestorePoint } from './RestorePointModal';
import HighlightModal from './HighlightModal';
import { useActiveUsers } from '../hooks/useActiveUsers';
import DevToolsPanel from './DevToolsPanel';

export interface TaleWeaverStudioProps {
  userName: string;
  settings: TaleWeaverSettings;
  engine: AiEngine;
  geminiModel?: string;
  openaiModel?: string;
  onEngineChange?: (engine: AiEngine) => void;
  onOpenaiModelChange?: (m: string) => void;
  onGeminiModelChange?: (m: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

type PanelProps = { title: string; children: React.ReactNode; className?: string };
const Panel: React.FC<PanelProps> = ({ title, children, className }) => (
  <div className={(className ? className + ' ' : '') + "rounded-lg border-2 border-[var(--wms-gold)] bg-[color:var(--wms-mid)]/85"}>
    <div className="px-3 py-2 border-b-2 border-[var(--wms-gold)] text-[var(--wms-gold)] tracking-widest uppercase text-xs bg-[color:var(--wms-deep)]/95">{title}</div>
    <div className="p-3">{children}</div>
  </div>
);

const TaleWeaverStudio: React.FC<TaleWeaverStudioProps> = ({ userName, settings, engine, geminiModel, openaiModel, onEngineChange, onOpenaiModelChange, onGeminiModelChange, isMuted, onToggleMute }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'review'>('editor');
  const header = useMemo(() => `${settings.genre || 'Story'} — ${settings.style || 'Style'} — ${settings.writer || 'Voice'}`, [settings]);
  const instruction = useMemo(() => buildTaleWeaverInstruction(userName, settings), [userName, settings]);
  const editorRef = useRef<WeaveEditorHandle | null>(null);
  const [highlightEnabled, setHighlightEnabled] = useState<boolean>(true);
  const [highlightColor, setHighlightColor] = useState<string>(() => {
    try { return localStorage.getItem('wms-highlight-color') || 'rgba(224,200,122,0.28)'; } catch { return 'rgba(224,200,122,0.28)'; }
  });
  const [editorialMode, setEditorialMode] = useState<boolean>(false);
  const [writerEmulation, setWriterEmulation] = useState<boolean>(Boolean(settings?.writer));
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(() => {
    try { return localStorage.getItem('wms-devtools-open') === '1'; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem('wms-devtools-open', showDevTools ? '1' : '0'); } catch {} }, [showDevTools]);

  const saveKey = 'wms-tw-draft';
  const handleSave = () => {
    try {
      const text: string = editorRef.current?.getAllText() || '';
      const listRaw = localStorage.getItem(saveKey);
      const list: Array<{ ts: number; text: string; summary?: any }> = listRaw ? JSON.parse(listRaw) : [];
      const prev = list.length ? list[list.length - 1].text : '';
      // simple diff summary (line based)
      const prevLines = prev.split(/\r?\n/);
      const newLines = text.split(/\r?\n/);
      let added = 0, removed = 0, changed = 0;
      const max = Math.max(prevLines.length, newLines.length);
      for (let i = 0; i < max; i++) {
        const a = prevLines[i];
        const b = newLines[i];
        if (a === undefined && b !== undefined) { added++; continue; }
        if (a !== undefined && b === undefined) { removed++; continue; }
        if (a !== b) {
          changed++;
        }
      }
      const summary = { added, removed, changed, totalPrev: prevLines.length, totalNew: newLines.length };
      const snapshot = { ts: Date.now(), text, summary };
      list.push(snapshot);
      localStorage.setItem(saveKey, JSON.stringify(list));
      try { localStorage.setItem(saveKey + ':lastSummary', JSON.stringify(summary)); } catch {}
    } catch {}
  };
  const handleRestore = () => setShowRestoreModal(true);

  const restoreSnapshot = (rp: RestorePoint) => {
    try {
      const text = rp.text || '';
      const sel = window.getSelection();
      sel?.removeAllRanges();
      const first = document.querySelector('[data-page="0"]');
      if (first) {
        const range = document.createRange();
        range.selectNodeContents(first);
        range.collapse(true);
        sel?.addRange(range);
        editorRef.current?.replaceSelection(text, { highlight: false });
      }
      setShowRestoreModal(false);
    } catch {}
  };

  // Local override states for selectors (fall back to incoming settings initially)
  const personaKey = 'wms-tw-persona';
  const [styleSel, setStyleSel] = useState<string | undefined>(()=>{
    try { return JSON.parse(localStorage.getItem(personaKey)||'{}').styleSel || settings.style; } catch { return settings.style; }
  });
  const [genreSel, setGenreSel] = useState<string | undefined>(()=>{
    try { return JSON.parse(localStorage.getItem(personaKey)||'{}').genreSel || settings.genre; } catch { return settings.genre; }
  });
  const [roleSel, setRoleSel] = useState<string | undefined>(()=>{
    try { return JSON.parse(localStorage.getItem(personaKey)||'{}').roleSel || settings.role; } catch { return settings.role; }
  });
  const [writerSel, setWriterSel] = useState<string | undefined>(()=>{
    try { return JSON.parse(localStorage.getItem(personaKey)||'{}').writerSel || settings.writer; } catch { return settings.writer; }
  });

  useEffect(()=>{
    const payload = { styleSel, genreSel, roleSel, writerSel };
    try { localStorage.setItem(personaKey, JSON.stringify(payload)); } catch {}
    // merge into personaStore profile (non-destructive)
    try {
      const existing = getPersona() || {} as any;
      setPersona({ ...existing, preferences: { ...(existing.preferences||{}), tone: styleSel }, role: roleSel, domain: genreSel, name: existing.name });
    } catch {}
  }, [styleSel, genreSel, roleSel, writerSel]);

  const styleOptions = ['Narrative','Poetic','Technical','Conversational','Epic','Sparse'];
  const genreOptions = ['Fantasy','Horror','Historical Fiction','Sci-Fi','Mystery','Thriller'];
  const roleOptions = ['Editor','Playwright','Coach','Story Analyst','Copyeditor'];
  const writerOptions = ['Tolkien','Agatha Christie','Moses','Shakespeare','Jane Austen'];
  const { users: activeUsers } = useActiveUsers('tale-weaver-session');

  const HighlightColorPicker: React.FC<{ highlightColor: string; setHighlightColor: (c:string)=>void }> = ({ highlightColor, setHighlightColor }) => {
    const [open,setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement|null>(null);
    return (
      <div ref={anchorRef} className="relative inline-flex items-center gap-2">
        <span>Highlight Color</span>
  <button type="button" onClick={()=>setOpen(true)} className="w-8 h-6 rounded border border-[#e0c87a]/50" title="Select highlight color" aria-label="Select highlight color" data-color={highlightColor} />
        {open && (
          <HighlightModal
            anchorRect={anchorRef.current ? anchorRef.current.getBoundingClientRect() : null}
            color={highlightColor}
            onClose={()=>{
              setOpen(false);
              // restore current highlight color after preview
              const spans = Array.from(document.querySelectorAll('span[data-talia-highlight="1"]')) as HTMLElement[];
              spans.forEach(s => { s.style.backgroundColor = highlightColor; });
            }}
            onApply={(rgba)=>{ setHighlightColor(rgba); try { localStorage.setItem('wms-highlight-color', rgba); } catch {}; }}
            onNone={()=>{
              setHighlightColor('transparent');
              try { localStorage.setItem('wms-highlight-color', 'transparent'); } catch {}
              editorRef.current?.acceptAllHighlights();
            }}
            onLivePreview={(rgba)=>{
              // update visible highlights live by recoloring span backgrounds
              const row = document.querySelector('[data-layout="editor-area"]');
              if (!row) return;
              const spans = Array.from(document.querySelectorAll('span[data-talia-highlight="1"]')) as HTMLElement[];
              spans.forEach(s => { s.style.backgroundColor = rgba; });
            }}
          />
        )}
      </div>
    );
  };

  const ActiveUsersBadge: React.FC<{ users: { id: string; name: string }[] }> = ({ users }) => {
    return (
      <div className="flex items-center gap-1 text-[#e0c87a]/70" title="Active collaborators (live stub)">
        <span className="uppercase tracking-widest">Active Users:</span>
        <div className="flex -space-x-2">
          {users.slice(0,5).map(u => (
            <div key={u.id} className="w-6 h-6 rounded-full bg-[#1a2229] border border-[#e0c87a]/40 flex items-center justify-center text-[9px] font-semibold" title={u.name}>
              {u.name.split(/\s+/).map(p=>p[0]).join('').slice(0,2)}
            </div>
          ))}
          {users.length > 5 && <div className="w-6 h-6 rounded-full bg-[#1a2229] border border-[#e0c87a]/40 flex items-center justify-center text-[9px]">+{users.length-5}</div>}
        </div>
      </div>
    );
  };

  return (
  <div
    className="h-full w-full flex flex-col overflow-hidden gap-wms"
  >
      {/* Restore Modal */}
      <RestorePointModal
        isOpen={showRestoreModal}
        onClose={()=>setShowRestoreModal(false)}
        onRestore={restoreSnapshot}
        draftKey={saveKey}
        currentText={editorRef.current?.getAllText() || ''}
      />

      {/* Top Bar */}
  <nav aria-label="Studio menu" className="tw-studio-bar rounded-lg border-2 border-[var(--wms-gold)] bg-[color:var(--wms-deep)]/95 px-3 py-1.5">
    <div className="flex items-center justify-between">
      <div className="tw-bar-title text-[var(--wms-gold)] tracking-widest uppercase text-sm">Weave Your Tale — {header}</div>
      <div className="flex items-center gap-4 text-xs">
        <ActiveUsersBadge users={activeUsers} />
        <button onClick={handleSave} className="px-2 py-1 rounded border border-[var(--wms-gold)] text-[var(--wms-gold)] tracking-widest">SAVE CHANGES</button>
        <button onClick={handleRestore} className="px-2 py-1 rounded border border-[var(--wms-gold)] text-[var(--wms-gold)] tracking-widest">RESTORE POINT</button>
        <button className="px-2 py-1 rounded border border-[var(--wms-gold)] text-[var(--wms-gold)] tracking-widest">EXIT TO LOBBY</button>
        <button onClick={()=>setShowDevTools(true)} className="px-2 py-1 rounded border border-[var(--wms-gold)] text-[var(--wms-gold)] tracking-widest" title="Open Developer Tools">DEV TOOLS</button>
      </div>
    </div>
  </nav>

      {/* Tri-column Panels (full height grid; each panel scrolls internally) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="studio-grid-3col flex-1 min-h-0">
          <Panel title="Talia" className="tw-panel flex flex-col min-h-0" role="region" aria-labelledby="panel-talia">
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <ChatContainer
                userName={userName}
                engine={engine}
                geminiModel={geminiModel}
                openaiModel={openaiModel}
                onEngineChange={onEngineChange}
                onOpenaiModelChange={onOpenaiModelChange}
                onGeminiModelChange={onGeminiModelChange}
                studioId={'tale-weaver'}
                isMuted={isMuted}
                onToggleMute={onToggleMute}
                systemInstructionOverride={instruction}
                containerClassName="flex-1 min-h-0 flex flex-col overflow-hidden tw-chat tw-chat--studio"
              />
            </div>
          </Panel>
          <Panel title="Weave Your Tale" className="tw-panel min-w-0 flex flex-col min-h-0" role="region" aria-labelledby="panel-editor">
            <div data-layout="editor-area" className="tw-editor-frame flex-1 min-h-0 overflow-hidden">
              <WeaveYourTaleEditor ref={editorRef} />
            </div>
          </Panel>
          <Panel title="Reviews & Suggestions" className="tw-panel flex flex-col min-h-0" role="region" aria-labelledby="panel-reviews">
            <div className="flex-1 min-h-0 overflow-auto">
              <ReviewsPanel
                userName={userName}
                engine={engine}
                openaiModel={openaiModel}
                geminiModel={geminiModel}
                style={styleSel}
                genre={genreSel}
                role={roleSel}
                writer={writerEmulation ? writerSel : undefined}
                editorialMode={editorialMode}
                highlightEnabled={highlightEnabled}
                highlightColor={highlightColor}
                getSelectedText={() => editorRef.current?.getSelectedText() || ''}
                getAllText={() => editorRef.current?.getAllText() || ''}
                onReplaceExact={(findText, newText) => {
                  return editorRef.current?.replaceFirstOccurrence(findText, newText, { highlight: highlightEnabled, color: highlightColor }) || false;
                }}
                onInsert={(text) => {
                  if (!text) return;
                  editorRef.current?.replaceSelection(text, { highlight: highlightEnabled, color: highlightColor });
                }}
              />
            </div>
          </Panel>
        </div>
      </div>

      {/* Bottom Bar (Footer) */}
  <footer aria-label="Studio controls" className="tw-studio-bar rounded-lg border-2 border-[var(--wms-gold)] bg-[color:var(--wms-deep)]/95 px-3 py-2">
  <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)_420px] text-xs text-[var(--wms-gold)] items-center gap-wms">
          {/* Left column (under Talia) */}
          <div className="flex items-center gap-4 justify-start whitespace-nowrap">
            <label className="inline-flex items-center gap-2">
              <input className="accent-[var(--wms-gold)]" type="checkbox" checked={writerEmulation} onChange={(e)=>setWriterEmulation(e.target.checked)} />
              <span>Writer Emulation</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input className="accent-[var(--wms-gold)]" type="checkbox" checked={editorialMode} onChange={(e)=>setEditorialMode(e.target.checked)} />
              <span>Editorial Mode</span>
            </label>
          </div>

          {/* Center column (under Editor) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center justify-center">
            <div className="flex items-center gap-1">
              <span>Style</span>
              <select title="Style" aria-label="Style" value={styleSel || ''} onChange={(e)=>setStyleSel(e.target.value||undefined)} className="w-full bg-[#141a20] border border-[color:var(--wms-gold)]/40 rounded px-1 py-0.5 text-[var(--wms-gold)]">
                <option value="">—</option>
                {styleOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span>Genre</span>
              <select title="Genre" aria-label="Genre" value={genreSel || ''} onChange={(e)=>setGenreSel(e.target.value||undefined)} className="w-full bg-[#141a20] border border-[color:var(--wms-gold)]/40 rounded px-1 py-0.5 text-[var(--wms-gold)]">
                <option value="">—</option>
                {genreOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span>Role</span>
              <select title="Role" aria-label="Role" value={roleSel || ''} onChange={(e)=>setRoleSel(e.target.value||undefined)} className="w-full bg-[#141a20] border border-[color:var(--wms-gold)]/40 rounded px-1 py-0.5 text-[var(--wms-gold)]">
                <option value="">—</option>
                {roleOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span>Writer</span>
              <select title="Writer" aria-label="Writer" value={writerSel || ''} onChange={(e)=>setWriterSel(e.target.value||undefined)} className="w-full bg-[#141a20] border border-[color:var(--wms-gold)]/40 rounded px-1 py-0.5 text-[var(--wms-gold)]">
                <option value="">—</option>
                {writerOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Right column (under Reviews) */}
          <div className="flex items-center gap-4 justify-end whitespace-nowrap">
            <label className="inline-flex items-center gap-2">
              <input className="accent-[var(--wms-gold)]" type="checkbox" checked={highlightEnabled} onChange={(e)=>setHighlightEnabled(e.target.checked)} />
              <span>Highlight Talia’s Edits</span>
            </label>
            <HighlightColorPicker highlightColor={highlightColor} setHighlightColor={setHighlightColor} />
          </div>
        </div>
      </footer>
      <DevToolsPanel
        isOpen={showDevTools}
        onClose={()=>setShowDevTools(false)}
        engine={engine}
        openaiModel={openaiModel}
        geminiModel={geminiModel}
        onEngineChange={onEngineChange}
        onOpenaiModelChange={onOpenaiModelChange}
        onGeminiModelChange={onGeminiModelChange}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
      />
    </div>
  );
};

export default TaleWeaverStudio;
