// Archival copy of DevOverlay (moved to do-not-use)
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDev } from './store';
import { DevElement } from './types';

function getBounds(el: HTMLElement) {
	const r = el.getBoundingClientRect();
	return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export default function DevOverlay() {
	// removed
	return null as any;
}
