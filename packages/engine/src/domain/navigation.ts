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

/** The heading the ship is steering toward — `velocity`'s angles turn toward this over time rather than snapping to it. */
export interface IntendedDirection {
	xyAngleDeg: number;
	xzAngleDeg: number;
}

export interface NavigationState {
	position: Vector3;
	velocity: Velocity;
	intendedDirection: IntendedDirection;
	/** The warp speed the helm has asked for — `velocity.warpSpeed` ramps toward this rather than jumping to it. */
	intendedWarpSpeed: number;
	destination: Location | null;
}

export function createNavigationState(): NavigationState {
	return {
		position: { x: 0, y: 0, z: 0 },
		velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 },
		intendedDirection: { xyAngleDeg: 0, xzAngleDeg: 0 },
		intendedWarpSpeed: 0,
		destination: null
	};
}

export const MAXIMUM_WARP_DECELERATION_PER_SECOND = 2;

const MINIMUM_WARP_DRIVE_ENERGY_FOR_WARP = 200;
const WARP_AT_MINIMUM_WARP_DRIVE_ENERGY = 5;
const WARP_DRIVE_ENERGY_FOR_TOP_WARP = 2000;
const TOP_WARP_SPEED = 20;

/**
 * The fastest warp the drives can sustain on `totalWarpDriveEnergy` (the EU of every warp engine added
 * together): none below 200 EU, warp 5 at 200 EU, rising linearly to warp 20 at 2000 EU and no further.
 */
export function maximumWarpSpeed(totalWarpDriveEnergy: number): number {
	if (totalWarpDriveEnergy < MINIMUM_WARP_DRIVE_ENERGY_FOR_WARP) return 0;
	const fractionOfRange =
		(totalWarpDriveEnergy - MINIMUM_WARP_DRIVE_ENERGY_FOR_WARP) /
		(WARP_DRIVE_ENERGY_FOR_TOP_WARP - MINIMUM_WARP_DRIVE_ENERGY_FOR_WARP);
	return Math.min(TOP_WARP_SPEED, WARP_AT_MINIMUM_WARP_DRIVE_ENERGY + fractionOfRange * (TOP_WARP_SPEED - WARP_AT_MINIMUM_WARP_DRIVE_ENERGY));
}

/** Warp levels per second the ship can speed up by, which slows as the warp factor climbs: 1/s up to warp 2, 1 per 2s to 5, 1 per 4s to 10, then 1 per 5s. */
const WARP_ACCELERATION_TIERS: ReadonlyArray<{ upToWarp: number; perSecond: number }> = [
	{ upToWarp: 2, perSecond: 1 },
	{ upToWarp: 5, perSecond: 1 / 2 },
	{ upToWarp: 10, perSecond: 1 / 4 },
	{ upToWarp: Infinity, perSecond: 1 / 5 }
];

/** Moves the actual warp speed toward the intended one, no faster than the acceleration or deceleration limits allow. */
export function advanceWarpSpeed(current: number, intended: number, deltaMs: number): number {
	const seconds = deltaMs / 1000;
	if (intended <= current) return Math.max(intended, current - MAXIMUM_WARP_DECELERATION_PER_SECOND * seconds);

	let warp = current;
	let remainingSeconds = seconds;
	while (warp < intended && remainingSeconds > 0) {
		const tier = WARP_ACCELERATION_TIERS.find(({ upToWarp }) => warp < upToWarp)!;
		const warpAvailableInTier = Math.min(intended, tier.upToWarp) - warp;
		const secondsToFinishTier = warpAvailableInTier / tier.perSecond;
		if (secondsToFinishTier > remainingSeconds) return warp + tier.perSecond * remainingSeconds;
		warp += warpAvailableInTier;
		remainingSeconds -= secondsToFinishTier;
	}
	return Math.min(warp, intended);
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

function normalizeDeg(deg: number): number {
	return ((deg % 360) + 360) % 360;
}

/** Degrees per second the ship can turn its heading at, based on current warp speed — turning is faster at lower speeds. */
export function turnRateDegPerSecond(warpSpeed: number): number {
	if (warpSpeed < 5) return 15;
	if (warpSpeed < 10) return 10;
	return 5;
}

/** Rotates `current` toward `target` by at most `maxDeltaDeg`, taking whichever direction around the circle is shorter. */
export function rotateToward(current: number, target: number, maxDeltaDeg: number): number {
	const diff = (((target - current) % 360) + 540) % 360 - 180; // signed shortest difference, in (-180, 180]
	if (Math.abs(diff) <= maxDeltaDeg) return normalizeDeg(target);
	return normalizeDeg(current + Math.sign(diff) * maxDeltaDeg);
}

/**
 * Turns the ship's actual heading (`velocity`'s angles) toward `intendedDirection` by however far the
 * turn rate for the current speed allows in `deltaMs` — the physical maneuver isn't instantaneous, per
 * the book's implication that changing course takes time proportional to speed.
 */
export function advanceHeading(state: NavigationState, deltaMs: number): Velocity {
	const maxDeltaDeg = turnRateDegPerSecond(state.velocity.warpSpeed) * (deltaMs / 1000);
	return {
		...state.velocity,
		xyAngleDeg: rotateToward(state.velocity.xyAngleDeg, state.intendedDirection.xyAngleDeg, maxDeltaDeg),
		xzAngleDeg: rotateToward(state.velocity.xzAngleDeg, state.intendedDirection.xzAngleDeg, maxDeltaDeg)
	};
}

/** The x/y and x/z angles (in this state's own convention) pointing from `from` toward `to`. */
export function bearingTo(from: Vector3, to: Vector3): IntendedDirection {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const dz = to.z - from.z;
	const horizontalDistance = Math.sqrt(dx * dx + dy * dy);
	return {
		xyAngleDeg: normalizeDeg((Math.atan2(dy, dx) * 180) / Math.PI),
		xzAngleDeg: normalizeDeg((Math.atan2(dz, horizontalDistance) * 180) / Math.PI)
	};
}
