import React, { useEffect, useRef, useState } from 'react';
import { DocumentEditorContainer } from '@syncfusion/ej2-documenteditor';
import { registerLicense } from '@syncfusion/ej2-base';
import '@syncfusion/ej2-documenteditor/styles/material.css';

type SyncfusionDocxEditorProps = {
  serviceUrl?: string; // required for DOCX/PDF/SpellCheck/TrackChanges server-side features
  className?: string;
  onReady?: (container: DocumentEditorContainer) => void;
};

const SyncfusionDocxEditor: React.FC<SyncfusionDocxEditorProps> = ({ serviceUrl = '', className, onReady }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<DocumentEditorContainer | null>(null);
  const [ready, setReady] = useState(false);
  const [preset, setPreset] = useState<'default'|'editor'|'coach'>(()=>{
    try { return (localStorage.getItem('wms-syncfusion-preset') as any) || 'default'; } catch { return 'default'; }
  });

  useEffect(() => {
    try {
      const key = (import.meta as any).env?.VITE_SYNCFUSION_LICENSE_KEY as string | undefined;
      if (key) registerLicense(key);
    } catch {}
    if (!hostRef.current) return;
    const c = new DocumentEditorContainer({
      enableToolbar: true,
      serviceUrl: serviceUrl || '',
      height: '100%'
    });
    c.appendTo(hostRef.current);
    containerRef.current = c;
    setReady(true);
    onReady?.(c);
    return () => {
      try { c.destroy(); } catch {}
      containerRef.current = null;
    };
  }, [serviceUrl, onReady]);

  // Apply toolbar presets (best-effort; falls back silently if property unsupported)
  useEffect(() => {
    try { localStorage.setItem('wms-syncfusion-preset', preset); } catch {}
    const c = containerRef.current as any;
    if (!c) return;
    try {
      if (preset === 'default') {
        // let component decide defaults
        if (Array.isArray(c.toolbarItems)) c.toolbarItems = c.defaultToolbarItems || c.toolbarItems;
      } else if (preset === 'editor') {
        const items = [
          'New','Open','Separator','Undo','Redo','Separator','Find','Replace','Separator',
          'Bold','Italic','Underline','Strikethrough','Separator','FontSize','FontColor','Separator',
          'BulletList','NumberedList','Separator','AlignLeft','AlignCenter','AlignRight','Justify','Separator',
          'TrackChanges','AcceptAll','RejectAll','Comments','Separator','Export'
        ];
        c.toolbarItems = items;
      } else if (preset === 'coach') {
        const items = [
          'Find','Comments','TrackChanges','Accept','Reject','Separator','Export'
        ];
        c.toolbarItems = items;
      }
      // refresh if method is present
      if (c.enableToolbar && typeof c.refreshToolbar === 'function') c.refreshToolbar();
    } catch {}
  }, [preset]);

  const loadSfdt = async (file: File) => {
    if (!containerRef.current) return;
    const text = await file.text();
    try {
      containerRef.current.documentEditor.open(text);
    } catch (e) {
      console.error('Failed to open SFDT:', e);
    }
  };

  const handleOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.sfdt$/i.test(f.name)) {
      console.warn('Client-only mode supports SFDT import. DOCX import requires Syncfusion Document Editor Server.');
    }
    await loadSfdt(f);
    e.target.value = '';
  };

  const handleSaveSfdt = () => {
    if (!containerRef.current) return;
    try {
      const json = containerRef.current.documentEditor.serialize();
      // simple manifest validation
      const issues: string[] = [];
      try {
        const data = JSON.parse(json);
        const sections = Array.isArray((data as any).sections) ? (data as any).sections.length : 0;
        if (!sections) issues.push('No sections found');
        const textLen = JSON.stringify(data).length;
        if (textLen < 50) issues.push('Document content appears empty or too small');
      } catch { issues.push('SFDT parse failed'); }
      if (issues.length) {
        const proceed = window.confirm(`Manifest validation warnings:\n- ${issues.join('\n- ')}\n\nContinue to save SFDT?`);
        if (!proceed) return;
      }
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${Date.now()}.sfdt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to serialize SFDT:', e);
    }
  };

  return (
    <div className={className || ''}>
      <div className="flex items-center gap-2 mb-2 text-[#e0c87a] text-xs">
        <label className="inline-flex items-center gap-2" title="Persona toolbar preset">
          <span>Persona Mode</span>
          <select value={preset} onChange={(e)=>setPreset(e.target.value as any)} className="bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]">
            <option value="default">Default</option>
            <option value="editor">Editor</option>
            <option value="coach">Coach</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2" title="Open SFDT (client-only)">
          <span>Open SFDT</span>
          <input type="file" accept=".sfdt,application/json" onChange={handleOpen} className="text-[#e0c87a]" />
        </label>
        <button type="button" onClick={handleSaveSfdt} className="px-2 py-1 rounded border border-[#e0c87a]">Save SFDT</button>
        {!serviceUrl && (
          <span className="opacity-70">DOCX/PDF/SpellCheck require server <code>serviceUrl</code></span>
        )}
        {ready && <span className="opacity-70">Ready</span>}
      </div>
      <div ref={hostRef} className="w-full h-[65vh] rounded border border-[#e0c87a]/40" />
    </div>
  );
};

export default SyncfusionDocxEditor;
