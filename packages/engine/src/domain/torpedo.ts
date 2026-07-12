import type { Vector3 } from './vector.js';
import type { Velocity } from './navigation.js';
import { headingVector, bearingTo, rotateToward, turnRateDegPerSecond } from './navigation.js';
import { distanceBetween } from './sciences.js';
import { TORPEDO_HIT_RADIUS } from './combat.js';

/**
 * A torpedo in flight. See torpedo-flight-model.md for the numbers this implements. Homes in on
 * its target every tick rather than flying a fixed heading, at twice a ship's turn rate.
 */
export interface Torpedo {
	id: number;
	targetFleet: 'enemyCraft' | 'federationCraft';
	targetId: number;
	position: Vector3;
	velocity: Velocity;
	/** Speed at launch (the firing ship's warp speed + 2) — kept separate from `velocity.warpSpeed` so the 2-second ramp has a fixed start point to interpolate from. */
	launchSpeed: number;
	fuel: number;
	launchedAtMs: number;
	/** Set once a proximity hit-check has failed its coin flip — from then on speed follows the post-miss angle rule instead of the ramp/steady-18 default. */
	hasMissed: boolean;
}

const TORPEDO_TURN_RATE_MULTIPLIER = 2;
const RAMP_DURATION_SEC = 2;
const RAMP_TARGET_SPEED = 18;
const FUEL_BURN_PER_WARP_PER_SEC = 0.1;
const TARGET_FAST_THRESHOLD = 5;
const POST_MISS_AHEAD_DEG = 5;
const POST_MISS_BEHIND_DEG = 90;

export function launchTorpedo(
	firingVelocity: Velocity,
	firingPosition: Vector3,
	target: { fleet: 'enemyCraft' | 'federationCraft'; id: number },
	atMs: number,
	id: number
): Torpedo {
	const launchSpeed = firingVelocity.warpSpeed + 2;
	return {
		id,
		targetFleet: target.fleet,
		targetId: target.id,
		position: firingPosition,
		velocity: { xyAngleDeg: firingVelocity.xyAngleDeg, xzAngleDeg: firingVelocity.xzAngleDeg, warpSpeed: launchSpeed },
		launchSpeed,
		fuel: 10,
		launchedAtMs: atMs,
		hasMissed: false
	};
}

/** Angle (0-180 degrees) between a heading vector and the direction from `from` to `to`. */
function angleToward(headingXyDeg: number, headingXzDeg: number, from: Vector3, to: Vector3): number {
	const heading = headingVector(headingXyDeg, headingXzDeg);
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const dz = to.z - from.z;
	const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
	if (length === 0) return 0;
	const dot = (heading.x * dx + heading.y * dy + heading.z * dz) / length;
	return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
}

function postMissSpeed(angleToTargetDeg: number): number {
	if (angleToTargetDeg > POST_MISS_BEHIND_DEG) return 2;
	if (angleToTargetDeg <= POST_MISS_AHEAD_DEG) return RAMP_TARGET_SPEED;
	return 5;
}

export interface TorpedoAdvanceResult {
	/** The torpedo's next state, or `null` if it has been resolved this tick (hit or exploded). */
	torpedo: Torpedo | null;
	/** Set when the torpedo detonated this tick — either a direct hit or running out of fuel. */
	explosion: { position: Vector3; hitTarget: boolean } | null;
}

/**
 * Advances a torpedo by one tick: turns its heading toward the target, picks a speed (ramp,
 * steady warp 18, or the post-miss angle rule), advances its position, burns fuel, and resolves a
 * hit/miss/fuel-out explosion. `nowMs` is the simulated clock's value *after* this tick's delta.
 */
export function advanceTorpedo(
	torpedo: Torpedo,
	targetPosition: Vector3,
	targetSpeed: number,
	deltaMs: number,
	nowMs: number,
	rng: () => number
): TorpedoAdvanceResult {
	const bearing = bearingTo(torpedo.position, targetPosition);
	const maxDeltaDeg = turnRateDegPerSecond(torpedo.velocity.warpSpeed) * TORPEDO_TURN_RATE_MULTIPLIER * (deltaMs / 1000);
	const xyAngleDeg = rotateToward(torpedo.velocity.xyAngleDeg, bearing.xyAngleDeg, maxDeltaDeg);
	const xzAngleDeg = rotateToward(torpedo.velocity.xzAngleDeg, bearing.xzAngleDeg, maxDeltaDeg);

	const elapsedSec = (nowMs - torpedo.launchedAtMs) / 1000;
	let speed: number;
	if (torpedo.hasMissed) {
		const angleToTargetDeg = angleToward(xyAngleDeg, xzAngleDeg, torpedo.position, targetPosition);
		speed = postMissSpeed(angleToTargetDeg);
	} else if (elapsedSec >= RAMP_DURATION_SEC) {
		speed = RAMP_TARGET_SPEED;
	} else {
		speed = torpedo.launchSpeed + (RAMP_TARGET_SPEED - torpedo.launchSpeed) * (elapsedSec / RAMP_DURATION_SEC);
	}

	const distanceTraveled = speed * (deltaMs / 1000);
	const heading = headingVector(xyAngleDeg, xzAngleDeg);
	const position: Vector3 = {
		x: torpedo.position.x + heading.x * distanceTraveled,
		y: torpedo.position.y + heading.y * distanceTraveled,
		z: torpedo.position.z + heading.z * distanceTraveled
	};

	const fuel = torpedo.fuel - FUEL_BURN_PER_WARP_PER_SEC * speed * (deltaMs / 1000);
	const inProximity = distanceBetween(position, targetPosition) <= TORPEDO_HIT_RADIUS;

	if (inProximity) {
		const hits = targetSpeed > TARGET_FAST_THRESHOLD ? rng() >= 0.5 : true;
		// Copy rather than reference `targetPosition` directly — it may be an Immer draft that's
		// revoked by the time the caller reads this explosion, once its `produce()` call returns.
		if (hits) return { torpedo: null, explosion: { position: { ...targetPosition }, hitTarget: true } };
	}

	if (fuel <= 0) return { torpedo: null, explosion: { position, hitTarget: false } };

	const hasMissed = torpedo.hasMissed || inProximity;
	return {
		torpedo: { ...torpedo, position, velocity: { xyAngleDeg, xzAngleDeg, warpSpeed: speed }, fuel, hasMissed },
		explosion: null
	};
}
