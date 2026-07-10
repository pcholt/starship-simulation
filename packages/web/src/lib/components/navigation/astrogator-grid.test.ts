import { describe, expect, it } from 'vitest';
import { gridLineValues, niceGridStep } from './astrogator-grid.js';

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
