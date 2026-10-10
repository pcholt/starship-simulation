import type { Vector3 } from './vector.js';
import type { Fleet } from './craft.js';
import type { Velocity } from './navigation.js';
import { headingVector, bearingTo, rotateToward, turnRateDegPerSecond } from './navigation.js';
import { distanceBetween } from './sciences.js';
import { TORPEDO_HIT_RADIUS, TORPEDO_SPLASH_RADIUS, resolveTorpedoHit } from './combat.js';

/**
 * A torpedo in flight. See torpedo-flight-model.md for the numbers this implements. Homes in on
 * its target every tick rather than flying a fixed heading, at twice a ship's turn rate.
 */
export interface Torpedo {
	id: number;
	targetFleet: Fleet;
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
const POST_MISS_AHEAD_DEG = 5;
const POST_MISS_BEHIND_DEG = 90;

const INITIAL_FUEL = 10;

/** Longest straight-line path a torpedo can travel before its fuel runs out — burn is always `FUEL_BURN_PER_WARP_PER_SEC` per unit of distance travelled, regardless of speed, so this is a hard cap independent of the speed profile. FireTorpedo uses this to reject shots it could never reach. */
export const TORPEDO_MAX_RANGE = INITIAL_FUEL / FUEL_BURN_PER_WARP_PER_SEC;

/**
 * Longest single physics step `advanceTorpedo` will take internally before splitting a larger
 * `deltaMs` into smaller sub-steps — matches the server's fixed tick interval, the granularity
 * the rest of the simulation already trusts. Without this, a single large `deltaMs` (e.g. a
 * browser tab backgrounded for several seconds, which throttles its tick timer) could move a fast
 * torpedo far enough in one step to skip clean over `TORPEDO_HIT_RADIUS` without ever registering
 * a hit/miss against its target.
 */
const MAX_STEP_MS = 200;

/** Creates a torpedo in flight, inheriting the firing ship's position/heading and launching at its warp speed + 2 (see torpedo-flight-model.md). */
export function launchTorpedo(
	firingVelocity: Velocity,
	firingPosition: Vector3,
	target: { fleet: Fleet; id: number },
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
		fuel: INITIAL_FUEL,
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

/** Does the actual physics/hit-resolution work for one step of at most `MAX_STEP_MS`. See `advanceTorpedo` for the public, sub-stepping entry point. */
function stepTorpedo(
	torpedo: Torpedo,
	targetPosition: Vector3,
	targetSpeed: number,
	deltaMs: number,
	nowMs: number,
	rng: () => number,
	targetIsNimble: boolean
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
		// Copy rather than reference `targetPosition` directly — it may be an Immer draft that's
		// revoked by the time the caller reads this explosion, once its `produce()` call returns.
		if (resolveTorpedoHit(targetSpeed, rng, targetIsNimble)) return { torpedo: null, explosion: { position: { ...targetPosition }, hitTarget: true } };
	}

	if (fuel <= 0) return { torpedo: null, explosion: { position, hitTarget: false } };

	const hasMissed = torpedo.hasMissed || inProximity;
	return {
		torpedo: { ...torpedo, position, velocity: { xyAngleDeg, xzAngleDeg, warpSpeed: speed }, fuel, hasMissed },
		explosion: null
	};
}

/**
 * Advances a torpedo by one tick: turns its heading toward the target, picks a speed (ramp,
 * steady warp 18, or the post-miss angle rule), advances its position, burns fuel, and resolves a
 * hit/miss/fuel-out explosion. `nowMs` is the simulated clock's value *after* this tick's delta.
 *
 * Internally splits `deltaMs` into `MAX_STEP_MS`-sized sub-steps so a single large delta (e.g. a
 * backgrounded browser tab's throttled timer) can't move the torpedo far enough in one step to
 * tunnel past `TORPEDO_HIT_RADIUS` without ever checking for a hit.
 */
export function advanceTorpedo(
	torpedo: Torpedo,
	targetPosition: Vector3,
	targetSpeed: number,
	deltaMs: number,
	nowMs: number,
	rng: () => number,
	targetIsNimble = false
): TorpedoAdvanceResult {
	if (deltaMs <= MAX_STEP_MS) return stepTorpedo(torpedo, targetPosition, targetSpeed, deltaMs, nowMs, rng, targetIsNimble);

	const steps = Math.ceil(deltaMs / MAX_STEP_MS);
	const stepMs = deltaMs / steps;
	const tickStartMs = nowMs - deltaMs;

	let current = torpedo;
	for (let i = 1; i <= steps; i++) {
		const stepNowMs = tickStartMs + stepMs * i;
		const result = stepTorpedo(current, targetPosition, targetSpeed, stepMs, stepNowMs, rng, targetIsNimble);
		if (!result.torpedo) return result;
		current = result.torpedo;
	}
	return { torpedo: current, explosion: null };
}

/** A torpedo's explosion: where it happened, and whether it was a direct hit on its target or a miss/fuel-out. */
export interface TorpedoExplosion {
	position: Vector3;
	hitTarget: boolean;
	targetFleet: Fleet;
	targetId: number;
}

/** Looks up a torpedo's target by fleet and id, returning its current position/speed, or `undefined` if it no longer exists (destroyed by something else mid-flight). */
export type TorpedoTargetLookup = (fleet: Fleet, id: number) => { position: Vector3; speed: number; isNimble?: boolean } | undefined;

/**
 * Advances every torpedo in `torpedoes` by one tick, resolving each against its own target via
 * `findTarget` — kept as a callback (rather than requiring a `WorldState`) so this stays pure and
 * testable without an `Engine`. Returns the survivors and any explosions to resolve (damage +
 * event recording are the caller's job, since only it has access to craft/state mutation).
 */
export function advanceTorpedoes(
	torpedoes: Torpedo[],
	findTarget: TorpedoTargetLookup,
	deltaMs: number,
	nowMs: number,
	rng: () => number
): { torpedoes: Torpedo[]; explosions: TorpedoExplosion[] } {
	const survivors: Torpedo[] = [];
	const explosions: TorpedoExplosion[] = [];
	for (const torpedo of torpedoes) {
		const target = findTarget(torpedo.targetFleet, torpedo.targetId);
		if (!target) {
			// The target was destroyed by something else mid-flight — nothing left to home in on.
			explosions.push({ position: { ...torpedo.position }, hitTarget: false, targetFleet: torpedo.targetFleet, targetId: torpedo.targetId });
			continue;
		}
		const result = advanceTorpedo(torpedo, target.position, target.speed, deltaMs, nowMs, rng, target.isNimble ?? false);
		if (result.torpedo) {
			survivors.push(result.torpedo);
		} else if (result.explosion) {
			explosions.push({ ...result.explosion, targetFleet: torpedo.targetFleet, targetId: torpedo.targetId });
		}
	}
	return { torpedoes: survivors, explosions };
}

/** One craft's assigned damage from resolving an explosion. */
export interface DamageAssignment {
	fleet: Fleet;
	craftId: number;
	amount: number;
}

/**
 * Assigns direct-hit and splash damage from a single torpedo explosion. The original target only
 * gets the (higher) direct-hit amount, and only when it was actually hit — a miss or fuel-out
 * explosion doesn't exempt the target from splash like any other nearby craft would get.
 */
export function resolveExplosionDamage(
	explosion: TorpedoExplosion,
	nearbyCraft: { fleet: Fleet; id: number; position: Vector3 }[],
	directHitDamage: number
): DamageAssignment[] {
	const splashDamage = directHitDamage / 2;
	const assignments: DamageAssignment[] = [];
	for (const craft of nearbyCraft) {
		const isDirectHitTarget = explosion.hitTarget && craft.fleet === explosion.targetFleet && craft.id === explosion.targetId;
		if (isDirectHitTarget) {
			assignments.push({ fleet: craft.fleet, craftId: craft.id, amount: directHitDamage });
		} else if (distanceBetween(craft.position, explosion.position) <= TORPEDO_SPLASH_RADIUS) {
			assignments.push({ fleet: craft.fleet, craftId: craft.id, amount: splashDamage });
		}
	}
	return assignments;
}
