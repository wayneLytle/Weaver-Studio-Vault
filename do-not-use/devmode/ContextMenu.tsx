// Archival copy of ContextMenu (moved to do-not-use)
import React from 'react';
import { useDev } from './store';

export default function ContextMenu({ x, y }: { x: number; y: number }) {
	const dev = useDev();
	if (!dev.state.enabled) return null as any;
	return (
		<div style={{ position: 'fixed', left: x, top: y, background: '#111', color: '#E0C87A', padding: 8, borderRadius: 6, zIndex: 10000 }}>
			<button onClick={() => { dev.openInsert({ x, y }); }} style={{ display: 'block', color: '#E0C87A', background: 'transparent', border: 'none' }}>Insert Shape</button>
		</div>
	);
}
