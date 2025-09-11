// Archival copy of devmode store (moved to do-not-use)
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DevElement, DevEvent, Manifest } from './types';

const STORAGE_KEY = 'weaver-devmode-session-v1';

export interface DevState {
	enabled: boolean;
	elements: DevElement[];
	selection: string[];
	events: DevEvent[];
	config: { grid: number; snap: boolean };
	ui?: { insertOpen?: boolean; insertPosition?: { x: number; y: number } | null };
	history: DevElement[][];
	future: DevElement[][];
}

const initialState: DevState = {
	enabled: false,
	elements: [],
	selection: [],
	events: [],
	config: { grid: 8, snap: true },
	ui: { insertOpen: false, insertPosition: null },
	history: [],
	future: [],
};

type Action = any;

function reducer(state: DevState, action: Action): DevState {
	return state as any;
}

const DevContext = createContext<any>(null);

export function DevProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initialState);
	const api = { state, toggle: () => {}, setEnabled: (v: boolean) => {}, addElement: (e: DevElement) => {}, updateElement: (id: string, patch: Partial<DevElement>) => {}, deleteElement: (id: string) => {}, select: (ids: string[]) => {}, logEvent: (ev: DevEvent) => {}, setConfig: (cfg: any) => {}, openInsert: (pos: { x: number; y: number }) => {}, closeInsert: () => {}, undo: () => {}, redo: () => {}, exportManifest: (): Manifest => ({ version: '1.0.0', pageId: 'home', timestamp: new Date().toISOString(), elements: state.elements, events: state.events, meta: { grid: state.config.grid, enabled: state.enabled, selection: state.selection } }), clearSession: () => {} };
	try { (window as any).__weaver_dev = api; } catch (e) {}
	return <DevContext.Provider value={api}>{children}</DevContext.Provider>;
}

export function useDev() {
	return useContext(DevContext);
}
