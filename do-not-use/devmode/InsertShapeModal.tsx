// Archival copy of InsertShapeModal (moved to do-not-use)
import React, { useState } from 'react';
import { useDev } from './store';
// Simple uuid generator using crypto.randomUUID (browser support required)
const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export default function InsertShapeModal() {
	const dev = useDev();
	const open = dev.state.ui?.insertOpen;
	const pos = dev.state.ui?.insertPosition || { x: 100, y: 100 };
	const [kind, setKind] = useState('rectangle');
	const [ariaLabel, setAriaLabel] = useState('');
	const [role, setRole] = useState('');
	const [text, setText] = useState('');
	const [className, setClassName] = useState('');
	const [styleSnippet, setStyleSnippet] = useState('');

	// Insert UI is now integrated into the left-anchored DevOverlay panel.
	// Keep this component inert to avoid duplicate floating insert dialogs.
	return null as any;
}
