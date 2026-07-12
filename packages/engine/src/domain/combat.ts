import type { BankLocation } from './engineering.js';
import type { Vector3 } from './vector.js';

/**
 * Which of the four directional banks (matching the book's phaser/shield
 * pairing — there is no top/bottom bank) a target falls into, based on the
 * dominant axis of displacement from the Enterprise in the x/y plane. A
 * simplification of the book's heading-relative fore/aft/port/starboard
 * check, expressed in world coordinates rather than requiring a full
 * local-frame transform.
 */
export function bankLocationForRelativePosition(from: Vector3, to: Vector3): BankLocation {
	const dx = to.x - from.x;
	const dy = to.y - from.y;

	if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'fore' : 'aft';
	return dy >= 0 ? 'port' : 'starboard';
}

const PHASER_BASE_DAMAGE = 100;
/** Distance (universe units) at which phaser damage falls to roughly half strength. */
export const PHASER_RANGE_HALF_LIFE = 300;

/** Phaser damage falls off with distance and is reduced by the target's shield functional status (0-100). */
export function computePhaserDamage(distance: number, targetShieldFunctional: number): number {
	const rangeFactor = PHASER_RANGE_HALF_LIFE / (PHASER_RANGE_HALF_LIFE + distance);
	const shieldFactor = 1 - targetShieldFunctional / 100;
	return Math.max(0, PHASER_BASE_DAMAGE * rangeFactor * shieldFactor);
}

const TORPEDO_BASE_DAMAGE = 30;

/** Torpedo damage doesn't fall off with distance (unlike phasers) — flight/hit resolution happens separately, in torpedo.ts, before this is called. Only the target's shields mitigate damage. */
export function computeTorpedoDamage(targetShieldFunctional: number): number {
	const shieldFactor = 1 - targetShieldFunctional / 100;
	return Math.max(0, TORPEDO_BASE_DAMAGE * shieldFactor);
}

/** Proximity-fuze radius (universe units) — a torpedo attempts to resolve a hit once within this distance of its target. */
export const TORPEDO_HIT_RADIUS = 2;

/** Radius (universe units) around a torpedo explosion within which other craft take splash damage. */
export const TORPEDO_SPLASH_RADIUS = 3;

const TARGET_FAST_THRESHOLD = 5;

/** Whether a torpedo within proximity-fuze range of its target actually connects: a certain hit against a target at warp 5 or slower, a 50/50 coin flip otherwise. */
export function resolveTorpedoHit(targetSpeed: number, rng: () => number): boolean {
	return targetSpeed <= TARGET_FAST_THRESHOLD || rng() >= 0.5;
}
