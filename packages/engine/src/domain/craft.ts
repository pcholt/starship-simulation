import type { Vector3 } from './vector.js';

/** A non-Enterprise spacecraft (enemy or Federation). Shared shape per the book's parallel data arrays. */
export interface Craft {
	id: number;
	name: string;
	mission: string;
	position: Vector3;
}
