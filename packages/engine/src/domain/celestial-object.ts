import type { CargoItem } from './cargo.js';
import type { Vector3 } from './vector.js';

export interface CelestialObject {
	id: number;
	name: string;
	position: Vector3;
	radius: number;
	mass: number;
	/** What the world is holding; a civilization's stockpile of supplies. */
	cargo: CargoItem[];
}
