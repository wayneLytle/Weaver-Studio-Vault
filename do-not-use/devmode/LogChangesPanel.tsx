// Archival copy of LogChangesPanel (moved to do-not-use)
import React, { useEffect, useState } from 'react';
import { useDev } from './store';

export default function LogChangesPanel() {
	const dev = useDev();
	const [open, setOpen] = useState(false);
	const [sinceExport, setSinceExport] = useState(0);
	useEffect(() => {
		const h = () => setOpen((o) => !o);
		window.addEventListener('dev:log:toggle', h);
		return () => window.removeEventListener('dev:log:toggle', h);
	}, []);

	useEffect(() => {
		if (open) setSinceExport(dev.state.events.length);
	}, [open]);

	const [patches, setPatches] = useState<Array<{ name: string; path: string }>>([]);
	const [selectedPatch, setSelectedPatch] = useState<string | null>(null);
	const [preview, setPreview] = useState<{ original: string | null; modified: string | null } | null>(null);

	async function refreshPatches() {
		try {
			const res = await fetch('http://localhost:3001/dev/patches');
			if (!res.ok) return;
			const list = await res.json();
			setPatches(list);
		} catch (e) {}
	}

	useEffect(() => { refreshPatches(); }, []);

	if (!dev.state.enabled) return null as any;
	if (!open) return null as any;

	const manifest = dev.exportManifest();

	return (
		<div data-dev-ui="true" role="dialog" aria-label="Dev Log" style={{ position: 'fixed', top: 12, left: 80, zIndex: 9999, background: '#0b0b0d', color: '#E0C87A', border: '1px solid #333', padding: 12, width: 720, maxHeight: '80vh', overflow: 'auto' }}>
			<h2>Dev Mode Log</h2>
			<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
				<button onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(manifest, null, 2)); } catch (e) {} }}>Copy to Clipboard</button>
				<button onClick={() => { try { const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'weaver-dev-manifest.json'; a.click(); } catch (e) {} }}>Download JSON</button>
			</div>
			<section>
				<h3>Manifest (snapshot)</h3>
				<pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(manifest, null, 2)}</pre>
			</section>
		</div>
	);
}
