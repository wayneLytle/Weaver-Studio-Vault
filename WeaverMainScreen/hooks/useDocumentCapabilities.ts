import { useEffect, useState, useCallback } from 'react';

export interface DocumentCapabilities {
  status: 'enabled' | 'disabled' | 'partial' | 'unknown';
  docxConversion: boolean;
  pdfConversion: boolean;
  diagnostic?: string;
  fetched: boolean;
  error?: string;
}

const initialState: DocumentCapabilities = {
  status: 'unknown',
  docxConversion: false,
  pdfConversion: false,
  fetched: false
};

export function useDocumentCapabilities(apiBase?: string) {
  const [caps, setCaps] = useState<DocumentCapabilities>(initialState);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => setRefreshIndex(i => i + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const resp = await fetch(`${apiBase || '/api/documenteditor'}/Capabilities`, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (cancelled) return;
        setCaps({
          status: (json.status || 'unknown'),
            docxConversion: !!json.docxConversion,
            pdfConversion: !!json.pdfConversion,
            diagnostic: json.diagnostic,
            fetched: true
        });
      } catch (e:any) {
        if (cancelled) return;
        setCaps(prev => ({ ...prev, fetched: true, error: e.message }));
      }
    }
    run();
    return () => { cancelled = true; };
  }, [apiBase, refreshIndex]);

  return { capabilities: caps, refresh };
}

export default useDocumentCapabilities;