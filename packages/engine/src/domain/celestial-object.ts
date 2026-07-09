import type { Vector3 } from './vector.js';

export interface CelestialObject {
	id: number;
	name: string;
	position: Vector3;
	radius: number;
	mass: number;
}
