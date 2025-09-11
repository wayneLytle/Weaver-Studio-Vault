// Archival copy of DevToggle (moved to do-not-use)
// Original implementation preserved for reference.
// DevToggle moved to do-not-use. Kept for archival/testing purposes only.
// Archival copy of DevToggle (moved to do-not-use)
import React from 'react';
import { useDev } from './store';

export default function DevToggle() {
	const dev = useDev();

	return (
	<div data-dev-ui="true" style={{ position: 'fixed', top: 12, left: 12, zIndex: 10005, pointerEvents: 'auto' }}>
			<button
				aria-pressed={dev.state.enabled}
				aria-label="Toggle Dev Mode"
				onClick={() => dev.toggle()}
				onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dev.toggle(); }}
				style={{ background: '#FDE047', color: '#000', border: '2px solid #000', padding: '8px 12px', borderRadius: 6, fontWeight: 700 }}
			>
				Dev
			</button>

			<div style={{ marginTop: 8 }}>
				<button
					aria-label="Open Log Changes"
					onClick={() => { const win = window as any; win.__dev_log_open = !win.__dev_log_open; window.dispatchEvent(new Event('dev:log:toggle')); }}
					style={{ background: '#000', color: '#FDE047', border: '2px solid #FDE047', padding: '6px 10px', borderRadius: 6 }}
				>
					Log Changes
				</button>
			</div>
		</div>
	);
}
