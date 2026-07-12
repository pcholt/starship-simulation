import { describe, expect, it } from 'vitest';
import { launchTorpedo, advanceTorpedo, advanceTorpedoes, resolveExplosionDamage } from '../../src/domain/torpedo.js';
import { TORPEDO_HIT_RADIUS, TORPEDO_SPLASH_RADIUS } from '../../src/domain/combat.js';

describe('launchTorpedo', () => {
	it('inherits the firing ship position and heading, and its speed plus 2', () => {
		const torpedo = launchTorpedo(
			{ xyAngleDeg: 30, xzAngleDeg: 10, warpSpeed: 5 },
			{ x: 1, y: 2, z: 3 },
			{ fleet: 'enemyCraft', id: 7 },
			1000,
			1
		);
		expect(torpedo.position).toEqual({ x: 1, y: 2, z: 3 });
		expect(torpedo.velocity).toEqual({ xyAngleDeg: 30, xzAngleDeg: 10, warpSpeed: 7 });
		expect(torpedo.targetFleet).toBe('enemyCraft');
		expect(torpedo.targetId).toBe(7);
		expect(torpedo.fuel).toBe(10);
		expect(torpedo.launchedAtMs).toBe(1000);
		expect(torpedo.hasMissed).toBe(false);
		expect(torpedo.id).toBe(1);
	});
});

describe('advanceTorpedo — speed ramp', () => {
	function torpedoHeadingAtTarget(launchWarpSpeed: number) {
		// Heading (0, 0) points along +x; place the target far along +x too, so bearing == heading
		// and no turning happens — isolates the ramp math from the homing math.
		return launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: launchWarpSpeed },
			{ x: 0, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
	}

	it('ramps linearly from launch speed toward warp 18 over 2 seconds', () => {
		const torpedo = torpedoHeadingAtTarget(5); // launch speed 7
		const { torpedo: afterOneSecond } = advanceTorpedo(torpedo, { x: 10000, y: 0, z: 0 }, 0, 1000, 1000, () => 0);
		expect(afterOneSecond!.velocity.warpSpeed).toBeCloseTo(12.5); // halfway from 7 to 18
	});

	it('holds at warp 18 once the 2-second ramp completes', () => {
		const torpedo = torpedoHeadingAtTarget(5);
		const { torpedo: afterThreeSeconds } = advanceTorpedo(torpedo, { x: 10000, y: 0, z: 0 }, 0, 3000, 3000, () => 0);
		expect(afterThreeSeconds!.velocity.warpSpeed).toBe(18);
	});
});

describe('advanceTorpedo — homing turn', () => {
	it('turns heading toward the target bearing, at twice the ship turn rate, without reaching it in one tick', () => {
		// Launch already at the ramp's target speed (18), so speed — and therefore turn rate —
		// stays constant for the whole maneuver instead of interacting with the ramp.
		// warpSpeed 18 -> turnRateDegPerSecond is 5 (>=10) -> torpedo turns at 10 deg/sec.
		const torpedo = launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 16 },
			{ x: 0, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
		// Target along +y: bearing xyAngleDeg = 90, far enough away that a 1s tick can't reach it.
		const { torpedo: after } = advanceTorpedo(torpedo, { x: 0, y: 10000, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after!.velocity.xyAngleDeg).toBeCloseTo(10);
	});
});

describe('advanceTorpedo — post-miss speed rule', () => {
	function missedTorpedo(xyAngleDeg: number) {
		return {
			id: 1,
			targetFleet: 'enemyCraft' as const,
			targetId: 1,
			position: { x: 0, y: 0, z: 0 },
			velocity: { xyAngleDeg, xzAngleDeg: 0, warpSpeed: 7 },
			launchSpeed: 7,
			fuel: 10,
			launchedAtMs: 0,
			hasMissed: true
		};
	}

	it('decelerates to warp 2 when travelling away from the target', () => {
		// Current heading 0deg, target bearing 180deg (directly behind) -> turn caps at 20deg,
		// leaving a large remaining angle (>90) after turning.
		const torpedo = missedTorpedo(0);
		const { torpedo: after } = advanceTorpedo(torpedo, { x: -10000, y: 0, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after!.velocity.warpSpeed).toBe(2);
	});

	it('holds warp 18 when the target is within 5 degrees ahead', () => {
		// Bearing only 10deg away from current heading -> a 20deg/sec turn closes it fully this tick.
		const torpedo = missedTorpedo(0);
		const { torpedo: after } = advanceTorpedo(torpedo, { x: 10000, y: Math.tan((10 * Math.PI) / 180) * 10000, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after!.velocity.warpSpeed).toBe(18);
	});

	it('travels at warp 5 otherwise', () => {
		// Bearing 40deg away -> turn closes 20deg of it, leaving 20deg remaining (>5, <=90).
		const torpedo = missedTorpedo(0);
		const { torpedo: after } = advanceTorpedo(torpedo, { x: 10000, y: Math.tan((40 * Math.PI) / 180) * 10000, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after!.velocity.warpSpeed).toBe(5);
	});
});

describe('advanceTorpedo — hit resolution', () => {
	function closeTorpedo() {
		return launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 },
			{ x: 0.1, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
	}

	it('always hits a target moving at warp 5 or slower, once in proximity', () => {
		const torpedo = closeTorpedo();
		const { torpedo: after, explosion } = advanceTorpedo(torpedo, { x: 0, y: 0, z: 0 }, 5, 1, 1, () => 0);
		expect(after).toBeNull();
		expect(explosion).toEqual({ position: { x: 0, y: 0, z: 0 }, hitTarget: true });
	});

	it('misses a target moving faster than warp 5 when the coin flip goes against it', () => {
		const torpedo = closeTorpedo();
		const { torpedo: after, explosion } = advanceTorpedo(torpedo, { x: 0, y: 0, z: 0 }, 6, 1, 1, () => 0);
		expect(explosion).toBeNull();
		expect(after).not.toBeNull();
		expect(after!.hasMissed).toBe(true);
	});

	it('hits a target moving faster than warp 5 when the coin flip favors it', () => {
		const torpedo = closeTorpedo();
		const { torpedo: after, explosion } = advanceTorpedo(torpedo, { x: 0, y: 0, z: 0 }, 6, 1, 1, () => 0.99);
		expect(after).toBeNull();
		expect(explosion).toEqual({ position: { x: 0, y: 0, z: 0 }, hitTarget: true });
	});

	it('stays outside the proximity fuze radius when far from the target', () => {
		const torpedo = launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 },
			{ x: TORPEDO_HIT_RADIUS + 100, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
		const { torpedo: after, explosion } = advanceTorpedo(torpedo, { x: 0, y: 0, z: 0 }, 0, 1, 1, () => 0);
		expect(explosion).toBeNull();
		expect(after).not.toBeNull();
	});

	it('does not tunnel through a target when given a single large deltaMs (e.g. a backgrounded browser tab)', () => {
		// Launched 3 units short of the target, heading straight at it, at a speed that would cover
		// far more than 3 units in one un-chunked 5-second step (warp 18 * 5s = 90 units) — without
		// internal sub-stepping, the post-step position would land 87 units past the target and
		// never register as "in proximity" at all.
		const torpedo = launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 16 }, // launch speed 18, already at ramp target
			{ x: 0, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
		const { torpedo: after, explosion } = advanceTorpedo(torpedo, { x: 3, y: 0, z: 0 }, 0, 5000, 5000, () => 0);
		expect(after).toBeNull();
		expect(explosion).toEqual({ position: { x: 3, y: 0, z: 0 }, hitTarget: true });
	});
});

describe('advanceTorpedoes', () => {
	function target(fleet: 'enemyCraft' | 'federationCraft', id: number, position = { x: 0, y: 0, z: 0 }, speed = 0) {
		return { fleet, id, position, speed };
	}

	it('advances every torpedo and reports no explosions when none resolve', () => {
		const torpedo = launchTorpedo({ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 }, { x: 0, y: 0, z: 0 }, { fleet: 'enemyCraft', id: 1 }, 0, 1);
		const far = target('enemyCraft', 1, { x: 100000, y: 0, z: 0 });
		const { torpedoes, explosions } = advanceTorpedoes([torpedo], () => far, 1000, 1000, () => 0);
		expect(torpedoes).toHaveLength(1);
		expect(explosions).toHaveLength(0);
	});

	it('resolves a direct hit as an explosion and removes the torpedo from the survivors', () => {
		const torpedo = launchTorpedo({ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 }, { x: 0.1, y: 0, z: 0 }, { fleet: 'enemyCraft', id: 1 }, 0, 1);
		const near = target('enemyCraft', 1, { x: 0, y: 0, z: 0 }, 0);
		const { torpedoes, explosions } = advanceTorpedoes([torpedo], () => near, 1, 1, () => 0);
		expect(torpedoes).toHaveLength(0);
		expect(explosions).toEqual([{ position: { x: 0, y: 0, z: 0 }, hitTarget: true, targetFleet: 'enemyCraft', targetId: 1 }]);
	});

	it('explodes a torpedo in place, without a hit, when its target no longer exists', () => {
		const torpedo = launchTorpedo({ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 }, { x: 5, y: 0, z: 0 }, { fleet: 'enemyCraft', id: 1 }, 0, 1);
		const { torpedoes, explosions } = advanceTorpedoes([torpedo], () => undefined, 1000, 1000, () => 0);
		expect(torpedoes).toHaveLength(0);
		expect(explosions).toEqual([{ position: { x: 5, y: 0, z: 0 }, hitTarget: false, targetFleet: 'enemyCraft', targetId: 1 }]);
	});
});

describe('resolveExplosionDamage', () => {
	const explosionPoint = { x: 0, y: 0, z: 0 };

	it('assigns direct-hit damage to the target and splash damage to another nearby craft', () => {
		const explosion = { position: explosionPoint, hitTarget: true, targetFleet: 'enemyCraft' as const, targetId: 1 };
		const nearbyCraft = [
			{ fleet: 'enemyCraft' as const, id: 1, position: explosionPoint },
			{ fleet: 'federationCraft' as const, id: 2, position: { x: 2, y: 0, z: 0 } }
		];
		const assignments = resolveExplosionDamage(explosion, nearbyCraft, 30);
		expect(assignments).toContainEqual({ fleet: 'enemyCraft', craftId: 1, amount: 30 });
		expect(assignments).toContainEqual({ fleet: 'federationCraft', craftId: 2, amount: 15 });
	});

	it('does not double-count the direct-hit target as also receiving splash', () => {
		const explosion = { position: explosionPoint, hitTarget: true, targetFleet: 'enemyCraft' as const, targetId: 1 };
		const nearbyCraft = [{ fleet: 'enemyCraft' as const, id: 1, position: explosionPoint }];
		const assignments = resolveExplosionDamage(explosion, nearbyCraft, 30);
		expect(assignments).toEqual([{ fleet: 'enemyCraft', craftId: 1, amount: 30 }]);
	});

	it('splash-damages the original target too when the explosion was a miss/fuel-out, not a direct hit', () => {
		// Regression: a torpedo that missed or ran out of fuel right next to its own target used to
		// unconditionally exclude that target from splash, so it took zero damage from a blast it
		// was standing right next to.
		const explosion = { position: explosionPoint, hitTarget: false, targetFleet: 'enemyCraft' as const, targetId: 1 };
		const nearbyCraft = [{ fleet: 'enemyCraft' as const, id: 1, position: explosionPoint }];
		const assignments = resolveExplosionDamage(explosion, nearbyCraft, 30);
		expect(assignments).toEqual([{ fleet: 'enemyCraft', craftId: 1, amount: 15 }]);
	});

	it('ignores craft outside the splash radius', () => {
		const explosion = { position: explosionPoint, hitTarget: false, targetFleet: 'enemyCraft' as const, targetId: 1 };
		const nearbyCraft = [{ fleet: 'federationCraft' as const, id: 2, position: { x: TORPEDO_SPLASH_RADIUS + 1, y: 0, z: 0 } }];
		expect(resolveExplosionDamage(explosion, nearbyCraft, 30)).toEqual([]);
	});
});

describe('advanceTorpedo — fuel', () => {
	it('burns fuel proportional to warp speed and elapsed time', () => {
		const torpedo = launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 16 }, // launch speed 18, past the ramp already
			{ x: 0, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
		// Far target, aligned heading, so speed stays 18 and no hit-check triggers.
		const { torpedo: after } = advanceTorpedo(torpedo, { x: 100000, y: 0, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after!.fuel).toBeCloseTo(10 - 0.1 * 18 * 1);
	});

	it('explodes in place, without hitting, when fuel runs out', () => {
		const torpedo = {
			id: 1,
			targetFleet: 'enemyCraft' as const,
			targetId: 1,
			position: { x: 0, y: 0, z: 0 },
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 5 },
			launchSpeed: 5,
			fuel: 0.3,
			launchedAtMs: 0,
			hasMissed: true // otherwise-branch speed (warp 5) for a predictable burn
		};
		const { torpedo: after, explosion } = advanceTorpedo(torpedo, { x: 100000, y: 100000, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after).toBeNull();
		expect(explosion).not.toBeNull();
		expect(explosion!.hitTarget).toBe(false);
	});
});
