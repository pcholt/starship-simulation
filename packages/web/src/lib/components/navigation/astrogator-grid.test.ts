import { describe, expect, it } from 'vitest';
import { gridLineValues, niceGridStep, universeGridLineValues } from './astrogator-grid.js';

describe('niceGridStep', () => {
	it('rounds a raw step to a nice round number', () => {
		expect(niceGridStep(1000, 5)).toBe(200);
	});

	it('picks a nice step for an oddly-sized range', () => {
		expect(niceGridStep(437, 5)).toBe(100);
	});

	it('scales down for small ranges', () => {
		expect(niceGridStep(10, 5)).toBe(2);
	});
});

describe('gridLineValues', () => {
	it('returns evenly spaced positive world-coordinate offsets up to the range', () => {
		expect(gridLineValues(1000, 5)).toEqual([200, 400, 600, 800, 1000]);
	});

	it('never returns a step of zero for a tiny range', () => {
		expect(gridLineValues(0.001, 5)).not.toContain(0);
		gridLineValues(0.001, 5).forEach((v) => expect(v).toBeGreaterThan(0));
	});
});

describe('universeGridLineValues', () => {
	it('is anchored to absolute multiples of the step, not the center point, when centered at the origin', () => {
		expect(universeGridLineValues(0, 1000, 5)).toEqual([
			-1000, -800, -600, -400, -200, 0, 200, 400, 600, 800, 1000
		]);
	});

	it('stays anchored to absolute world coordinates when the center is offset from the origin', () => {
		// Step is 200 (niceGridStep(1000, 5)); lines fall on multiples of 200 regardless of
		// where the ship (center) sits, not on offsets *from* the ship.
		expect(universeGridLineValues(500, 1000, 5)).toEqual([
			-400, -200, 0, 200, 400, 600, 800, 1000, 1200, 1400
		]);
	});

	it('never returns a step of zero for a tiny range', () => {
		universeGridLineValues(0, 0.001, 5).forEach((v) => expect(Number.isFinite(v)).toBe(true));
	});
});
