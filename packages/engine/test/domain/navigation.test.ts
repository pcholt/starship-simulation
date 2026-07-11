import { describe, expect, it } from 'vitest';
import {
	createNavigationState,
	headingVector,
	advancePosition,
	turnRateDegPerSecond,
	rotateToward,
	advanceHeading,
	bearingTo
} from '../../src/domain/navigation.js';

describe('createNavigationState', () => {
	it('starts at the origin, stationary, with no destination, facing straight ahead', () => {
		expect(createNavigationState()).toEqual({
			position: { x: 0, y: 0, z: 0 },
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 },
			intendedDirection: { xyAngleDeg: 0, xzAngleDeg: 0 },
			destination: null
		});
	});
});

describe('headingVector', () => {
	it('points along +x when both angles are 0 (straight ahead, per the book)', () => {
		const heading = headingVector(0, 0);
		expect(heading.x).toBeCloseTo(1);
		expect(heading.y).toBeCloseTo(0);
		expect(heading.z).toBeCloseTo(0);
	});

	it('points along +y when the x/y angle is 90 degrees', () => {
		const heading = headingVector(90, 0);
		expect(heading.x).toBeCloseTo(0, 5);
		expect(heading.y).toBeCloseTo(1, 5);
		expect(heading.z).toBeCloseTo(0, 5);
	});

	it('points along +z when the x/z angle is 90 degrees', () => {
		const heading = headingVector(0, 90);
		expect(heading.x).toBeCloseTo(0, 5);
		expect(heading.z).toBeCloseTo(1, 5);
	});

	it('always returns a unit vector', () => {
		const heading = headingVector(37, 52);
		const length = Math.sqrt(heading.x ** 2 + heading.y ** 2 + heading.z ** 2);
		expect(length).toBeCloseTo(1);
	});
});

describe('advancePosition', () => {
	it('does not move the ship when warp speed is 0', () => {
		const state = createNavigationState();
		expect(advancePosition(state, 1000)).toEqual(state.position);
	});

	it('moves the ship along its heading in proportion to speed and elapsed time', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 2 }
		};
		// 2 units/second for 1000ms = 2 units travelled along +x.
		const next = advancePosition(state, 1000);
		expect(next.x).toBeCloseTo(2);
		expect(next.y).toBeCloseTo(0);
		expect(next.z).toBeCloseTo(0);
	});

	it('moves proportionally for partial seconds', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 10 }
		};
		const next = advancePosition(state, 500);
		expect(next.x).toBeCloseTo(5);
	});

	it('moves from a non-origin starting position', () => {
		const state = {
			...createNavigationState(),
			position: { x: 100, y: 0, z: 0 },
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 1 }
		};
		const next = advancePosition(state, 1000);
		expect(next.x).toBeCloseTo(101);
	});
});

describe('turnRateDegPerSecond', () => {
	it('turns fastest below warp 5', () => {
		expect(turnRateDegPerSecond(0)).toBe(15);
		expect(turnRateDegPerSecond(4.9)).toBe(15);
	});

	it('turns at a middle rate from warp 5 up to (not including) 10', () => {
		expect(turnRateDegPerSecond(5)).toBe(10);
		expect(turnRateDegPerSecond(9.9)).toBe(10);
	});

	it('turns slowest at warp 10 or faster', () => {
		expect(turnRateDegPerSecond(10)).toBe(5);
		expect(turnRateDegPerSecond(20)).toBe(5);
	});
});

describe('rotateToward', () => {
	it('reaches the target exactly when within the allowed step', () => {
		expect(rotateToward(10, 20, 15)).toBe(20);
	});

	it('moves by exactly the allowed step when the target is further away', () => {
		expect(rotateToward(0, 90, 15)).toBe(15);
	});

	it('takes the shorter path across the 0/360 wraparound', () => {
		// 350 -> 10 is only 20 degrees going forward (350->360->10), not 340 degrees backward.
		expect(rotateToward(350, 10, 15)).toBeCloseTo(5);
	});

	it('rotates backward (decreasing) when that is the shorter path', () => {
		expect(rotateToward(10, 350, 15)).toBeCloseTo(355);
	});

	it('does not overshoot past the target', () => {
		expect(rotateToward(0, 5, 15)).toBe(5);
	});
});

describe('advanceHeading', () => {
	it('does not change velocity when already facing the intended direction', () => {
		const state = { ...createNavigationState(), velocity: { xyAngleDeg: 45, xzAngleDeg: 0, warpSpeed: 3 } };
		const nextIntended = { ...state, intendedDirection: { xyAngleDeg: 45, xzAngleDeg: 0 } };
		expect(advanceHeading(nextIntended, 1000)).toEqual(nextIntended.velocity);
	});

	it('turns toward the intended direction at the rate for the current speed, below warp 5', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 2 },
			intendedDirection: { xyAngleDeg: 90, xzAngleDeg: 0 }
		};
		// 15 deg/sec at warp 2, for 1 second -> 15 degrees turned.
		const next = advanceHeading(state, 1000);
		expect(next.xyAngleDeg).toBeCloseTo(15);
		expect(next.warpSpeed).toBe(2);
	});

	it('turns more slowly at warp 5-10', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 7 },
			intendedDirection: { xyAngleDeg: 90, xzAngleDeg: 0 }
		};
		const next = advanceHeading(state, 1000);
		expect(next.xyAngleDeg).toBeCloseTo(10);
	});

	it('turns slowest at warp 10+', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 12 },
			intendedDirection: { xyAngleDeg: 90, xzAngleDeg: 0 }
		};
		const next = advanceHeading(state, 1000);
		expect(next.xyAngleDeg).toBeCloseTo(5);
	});

	it('does not overshoot the intended direction when the step is larger than the remaining turn', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 2 },
			intendedDirection: { xyAngleDeg: 10, xzAngleDeg: 0 }
		};
		const next = advanceHeading(state, 1000);
		expect(next.xyAngleDeg).toBeCloseTo(10);
	});

	it('advances the x/z angle independently and proportionally to elapsed time', () => {
		const state = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 2 },
			intendedDirection: { xyAngleDeg: 0, xzAngleDeg: 90 }
		};
		const next = advanceHeading(state, 500);
		expect(next.xzAngleDeg).toBeCloseTo(7.5);
	});
});

describe('bearingTo', () => {
	it('points along +x (0 degrees) toward a target straight ahead', () => {
		const bearing = bearingTo({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 });
		expect(bearing.xyAngleDeg).toBeCloseTo(0);
		expect(bearing.xzAngleDeg).toBeCloseTo(0);
	});

	it('points at 90 degrees x/y toward a target along +y', () => {
		const bearing = bearingTo({ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 });
		expect(bearing.xyAngleDeg).toBeCloseTo(90);
	});

	it('tilts the x/z angle toward a target above the x/y plane', () => {
		const bearing = bearingTo({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 10 });
		expect(bearing.xzAngleDeg).toBeCloseTo(45);
	});

	it('computes bearing relative to a non-origin starting position', () => {
		const bearing = bearingTo({ x: 100, y: 100, z: 0 }, { x: 100, y: 110, z: 0 });
		expect(bearing.xyAngleDeg).toBeCloseTo(90);
	});
});
