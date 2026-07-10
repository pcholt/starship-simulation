import { describe, expect, it } from 'vitest';
import { angleFromPointer, pointerFromAngle } from './compass-math.js';

describe('angleFromPointer', () => {
	it('is 0 degrees pointing right (+x)', () => {
		expect(angleFromPointer(10, 0)).toBeCloseTo(0);
	});

	it('is 90 degrees pointing up on screen (-y), matching the plot\'s "+y is up" convention', () => {
		expect(angleFromPointer(0, -10)).toBeCloseTo(90);
	});

	it('is 180 degrees pointing left', () => {
		expect(angleFromPointer(-10, 0)).toBeCloseTo(180);
	});

	it('is 270 degrees pointing down on screen (+y)', () => {
		expect(angleFromPointer(0, 10)).toBeCloseTo(270);
	});

	it('never returns a negative angle', () => {
		expect(angleFromPointer(-1, 1)).toBeGreaterThanOrEqual(0);
	});
});

describe('pointerFromAngle', () => {
	it('is the inverse of angleFromPointer', () => {
		for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
			const point = pointerFromAngle(angle, 10);
			expect(angleFromPointer(point.x, point.y)).toBeCloseTo(angle, 5);
		}
	});

	it('places 0 degrees at (radius, 0)', () => {
		const point = pointerFromAngle(0, 10);
		expect(point.x).toBeCloseTo(10);
		expect(point.y).toBeCloseTo(0);
	});
});
