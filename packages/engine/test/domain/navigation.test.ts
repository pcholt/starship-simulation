import { describe, expect, it } from 'vitest';
import { createNavigationState, headingVector, advancePosition } from '../../src/domain/navigation.js';

describe('createNavigationState', () => {
	it('starts at the origin, stationary, with no destination', () => {
		expect(createNavigationState()).toEqual({
			position: { x: 0, y: 0, z: 0 },
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 0 },
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
