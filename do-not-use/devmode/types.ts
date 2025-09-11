// Archival copy of devmode types (moved to do-not-use)
export type UUID = string;

export type Purpose = 'toggle'|'button'|'scrollbar'|'content'|'container'|'decorative'|'other';

export type ShapeKind = 'rectangle'|'circle'|'square'|'line'|'container';

export interface A11y {
	role?: string;
	name?: string;
	description?: string;
	tabIndex?: number;
}

export interface Layout {
	x: number;
	y: number;
	w: number;
	h: number;
	z?: number;
	anchor?: string;
	snap?: boolean;
}

export interface DevElement {
	id: UUID;
	type: 'shape'|'container'|'text'|'button'|'image'|'custom';
	purpose?: Purpose;
	a11y?: A11y;
	layout: Layout;
	style?: any;
	tags?: string[];
	shape?: { kind: ShapeKind; points?: any };
}

export interface DevEvent {
	id: UUID;
	ts: string;
	actor: string;
	op: string;
	targetId?: UUID;
	diff?: any;
}

export interface Manifest {
	version: string;
	pageId: string;
	timestamp: string;
	elements: DevElement[];
	events: DevEvent[];
	meta?: any;
}
