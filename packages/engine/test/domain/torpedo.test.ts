import { describe, expect, it } from 'vitest';
import { launchTorpedo, advanceTorpedo } from '../../src/domain/torpedo.js';
import { TORPEDO_HIT_RADIUS } from '../../src/domain/combat.js';

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
		// warpSpeed 7 -> turnRateDegPerSecond is 10 (between 5 and 10) -> torpedo turns at 20 deg/sec.
		const torpedo = launchTorpedo(
			{ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 5 },
			{ x: 0, y: 0, z: 0 },
			{ fleet: 'enemyCraft', id: 1 },
			0,
			1
		);
		// Target along +y: bearing xyAngleDeg = 90, far enough away that a 1s tick can't reach it.
		const { torpedo: after } = advanceTorpedo(torpedo, { x: 0, y: 10000, z: 0 }, 0, 1000, 1000, () => 0);
		expect(after!.velocity.xyAngleDeg).toBeCloseTo(20);
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
