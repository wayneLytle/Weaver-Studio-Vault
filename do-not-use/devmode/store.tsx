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

// removed
export function DevProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function useDev() { return {} as any; }
