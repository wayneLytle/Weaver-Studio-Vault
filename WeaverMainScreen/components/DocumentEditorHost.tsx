import React, { useEffect, useRef, useState } from 'react';
import { useDocumentCapabilities } from '../hooks/useDocumentCapabilities';
import { registerLicense } from '@syncfusion/ej2-base';
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-documenteditor/styles/material.css';
import { DocumentEditorContainerComponent, Toolbar } from '@syncfusion/ej2-react-documenteditor';

// Register license if present
try { const key = (import.meta as any).env?.VITE_SYNCFUSION_LICENSE_KEY; if (key) registerLicense(key); } catch {}

Toolbar; // ensure tree-shaken modules retained

export const DocumentEditorHost: React.FC = () => {
  const ref = useRef<DocumentEditorContainerComponent | null>(null);
  const [ready, setReady] = useState(false);
  const serviceUrl = ((import.meta as any).env?.VITE_SYNCFUSION_SERVICE_URL || '').replace(/\/$/, '');
  const apiBase = serviceUrl || '/api/documenteditor';

  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'docx'|'pdf'>('docx');
  const [status, setStatus] = useState<string>('');
  const { capabilities } = useDocumentCapabilities(apiBase);
  async function handleExport() {
    try {
      setStatus('');
      setExporting(true);
      const editor = ref.current?.documentEditor;
      if (!editor) { setStatus('Editor not ready'); return; }
      const sfdt = editor.serialize();
      const chosen = format === 'pdf' ? 'Pdf' : 'Docx';
      if (chosen === 'Docx' && !capabilities.docxConversion) {
        // Server disabled for DOCX, fall back to raw SFDT download for transparency
        const blob = new Blob([sfdt], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'tale.sfdt.json';
        document.body.appendChild(a); a.click(); a.remove();
        setStatus('Server DOCX conversion unavailable (downloaded SFDT)');
        return;
      }
      if (chosen === 'Pdf' && !capabilities.pdfConversion) {
        setStatus('PDF conversion unavailable');
        return;
      }
      const resp = await fetch(`${apiBase}/Export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: chosen, data: sfdt, fileName: 'tale' })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        setStatus(`Export failed (${resp.status}): ${txt}`);
        return;
      }
      const dispositionName = `tale.${format}`;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dispositionName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(`Exported ${dispositionName}`);
    } catch (e:any) {
      setStatus('Export error: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (ref.current && !ready) {
      setReady(true);
    }
  }, [ready]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-4 px-3 py-2 border-b border-[#e0c87a]/30 bg-[#0b0f13] text-[#e0c87a] text-sm">
        <div className="font-semibold tracking-wide flex-1">Document Editor</div>
        <select aria-label="Export format"
          value={format}
          onChange={e => setFormat(e.target.value as any)}
          className="bg-[#161d23] border border-[#e0c87a]/40 text-xs px-2 py-1 rounded outline-none disabled:opacity-50"
          disabled={!ready || exporting}
          title={capabilities.fetched ? (!capabilities.docxConversion && format==='docx' ? 'Server DOCX conversion disabled; will download SFDT' : (!capabilities.pdfConversion && format==='pdf' ? 'Server PDF conversion disabled' : '')) : 'Checking capabilities...'}
        >
          <option value="docx">DOCX {capabilities.fetched && !capabilities.docxConversion ? '(disabled)' : ''}</option>
          <option value="pdf" disabled={capabilities.fetched && !capabilities.pdfConversion}>PDF {capabilities.fetched && !capabilities.pdfConversion ? '(disabled)' : ''}</option>
        </select>
        <button
          onClick={handleExport}
          className="px-3 py-1 rounded bg-[#e0c87a] text-[#0b0f13] hover:bg-[#f5d889] disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-medium"
          disabled={!ready || exporting}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </button>
        {status && <div className="text-[11px] text-[#e0c87a]/70 max-w-xs truncate" title={status}>{status}</div>}
        {!status && capabilities.error && <div className="text-[11px] text-red-400 max-w-xs truncate" title={capabilities.error}>Capability error</div>}
        {!status && !capabilities.fetched && <div className="text-[11px] text-[#e0c87a]/50">Loading capabilities...</div>}
        <div className="opacity-70 text-[12px] hidden md:block">Service: {serviceUrl || '(inline api)'}</div>
      </div>
      <div className="flex-1 min-h-0">
        <DocumentEditorContainerComponent
          id="tw-doc-editor"
          ref={(c) => (ref.current = c)}
          serviceUrl={serviceUrl}
          height={'100%'}
          enableToolbar={true}
          enableLocalPaste={true}
          toolbarItems={['New','Open','Separator','Undo','Redo','Separator','Print','Export','Image','Table','Hyperlink','Bookmark','TableOfContents','Separator','Find','Separator','Comments','TrackChanges','Separator','Zoom']}
        />
      </div>
    </div>
  );
};

export default DocumentEditorHost;
