import type { BankLocation } from '@starship/engine';
import { pointerFromAngle } from './compass-math.js';

/**
 * Angular offset from the ship's heading for each shield/phaser bank, using
 * the same world-heading convention as the compass dial. Positive rotates
 * toward the ship's port (left) side, matching the standard "counterclockwise
 * is positive" convention `pointerFromAngle` already uses for the compass.
 */
export const BANK_ANGLE_OFFSET_DEG: Record<BankLocation, number> = {
	fore: 0,
	port: 90,
	aft: 180,
	starboard: -90
};

const SEGMENTS = 12;

/**
 * Points (relative to the sector's own center, in the same screen-space
 * convention as `pointerFromAngle`) for a filled pie-wedge polygon spanning
 * `spanDeg` centered on `centerAngleDeg`. The first point is the wedge's
 * apex (0,0); the rest trace the outer arc, letting the caller render it as
 * a plain `<polygon>` without needing SVG arc-sweep math.
 */
export function sectorPolygonPoints(centerAngleDeg: number, spanDeg: number, radius: number): { x: number; y: number }[] {
	const start = centerAngleDeg - spanDeg / 2;
	const step = spanDeg / SEGMENTS;
	const points = [{ x: 0, y: 0 }];
	for (let i = 0; i <= SEGMENTS; i++) {
		points.push(pointerFromAngle(start + step * i, radius));
	}
	return points;
}
