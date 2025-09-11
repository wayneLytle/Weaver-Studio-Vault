// Archival copy of DevToolbar (moved to do-not-use)
import React from 'react';
import { useDev } from './store';

export default function DevToolbar() {
	const dev = useDev();

	if (!dev.state.enabled) return null as any;

	return (
		<div style={{ position: 'fixed', top: 12, right: 12, zIndex: 10000, display: 'flex', gap: 8, background: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 6, color: '#fff' }}>
			<button onClick={() => dev.undo()} aria-label="Undo">Undo (Ctrl/Cmd+Z)</button>
			<button onClick={() => dev.redo()} aria-label="Redo">Redo (Ctrl/Cmd+Y)</button>
			<button onClick={() => { if (dev.state.selection.length > 1) { /* placeholder for group transform UI */ } }} aria-label="Group">Group ({dev.state.selection.length})</button>
			<button onClick={() => dev.select([])}>Clear Selection</button>
		</div>
	);
}
