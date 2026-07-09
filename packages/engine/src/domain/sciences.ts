import type { CelestialObject } from './celestial-object.js';
import type { Craft } from './craft.js';
import type { Vector3 } from './vector.js';

export interface LifeSupportState {
	air: number;
	water: number;
	food: number;
}

export function createLifeSupportState(): LifeSupportState {
	return { air: 100, water: 100, food: 100 };
}

export function distanceBetween(a: Vector3, b: Vector3): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export type ScanQuality = 'full' | 'partial' | 'none';

/** Sensor range thresholds, in universe distance-units (1 unit = 100m per the book). */
const FULL_SCAN_RANGE = 100;
const PARTIAL_SCAN_RANGE = 1000;

export function scanQualityForDistance(distance: number): ScanQuality {
	if (distance <= FULL_SCAN_RANGE) return 'full';
	if (distance <= PARTIAL_SCAN_RANGE) return 'partial';
	return 'none';
}

export interface ScanResult {
	identity: string;
	distance: number;
	quality: ScanQuality;
	position: Vector3;
	radius?: number;
	mass?: number;
	mission?: string;
}

export function scanCelestialObject(object: CelestialObject, fromPosition: Vector3): ScanResult {
	const distance = distanceBetween(object.position, fromPosition);
	const quality = scanQualityForDistance(distance);
	return {
		identity: object.name,
		distance,
		quality,
		position: object.position,
		...(quality !== 'none' ? { radius: object.radius, mass: object.mass } : {})
	};
}

export function scanCraft(craft: Craft, fromPosition: Vector3): ScanResult {
	const distance = distanceBetween(craft.position, fromPosition);
	const quality = scanQualityForDistance(distance);
	return {
		identity: craft.name,
		distance,
		quality,
		position: craft.position,
		...(quality !== 'none' ? { mission: craft.mission } : {})
	};
}
