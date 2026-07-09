import type { Location } from './location.js';
import type { Vector3 } from './vector.js';

/**
 * Course is expressed as two angles from a local coordinate system centered
 * on the Enterprise, per the book: the x/y angle sweeps from +x toward +y,
 * the x/z angle sweeps from the x/y plane toward +z. Straight ahead is
 * (0, 0). Speed is in universe distance-units per second.
 */
export interface Velocity {
	xyAngleDeg: number;
	xzAngleDeg: number;
	warpSpeed: number;
}

export interface NavigationState {
	position: Vector3;
	velocity: Velocity;
	destination: Location | null;
}

export function createNavigationState(): NavigationState {
	return {
		position: { x: 0, y: 0, z: 0 },
		velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 },
		destination: null
	};
}

export function headingVector(xyAngleDeg: number, xzAngleDeg: number): Vector3 {
	const xy = (xyAngleDeg * Math.PI) / 180;
	const xz = (xzAngleDeg * Math.PI) / 180;
	// x/z angle tilts the heading out of the x/y plane toward +z; x/y angle then
	// sweeps the remaining x/y-plane component from +x toward +y.
	return {
		x: Math.cos(xz) * Math.cos(xy),
		y: Math.cos(xz) * Math.sin(xy),
		z: Math.sin(xz)
	};
}

export function advancePosition(state: NavigationState, deltaMs: number): Vector3 {
	const { warpSpeed, xyAngleDeg, xzAngleDeg } = state.velocity;
	if (warpSpeed === 0) return state.position;
	const heading = headingVector(xyAngleDeg, xzAngleDeg);
	const distance = warpSpeed * (deltaMs / 1000);
	return {
		x: state.position.x + heading.x * distance,
		y: state.position.y + heading.y * distance,
		z: state.position.z + heading.z * distance
	};
}
