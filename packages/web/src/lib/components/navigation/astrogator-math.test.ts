import { describe, expect, it } from 'vitest';
import { plotPointToWorld } from './astrogator-math.js';

const VIEW_SIZE = 100;
const PLOT_RADIUS_PCT = 45;

describe('plotPointToWorld', () => {
	it('maps the exact center of the plot to the Enterprise position', () => {
		const center = { x: 10, y: 20, z: 30 };
		const world = plotPointToWorld({ x: 50, y: 50 }, center, 1000, VIEW_SIZE, PLOT_RADIUS_PCT);
		expect(world).toEqual(center);
	});

	it('maps a point to the right of center to +x in world space', () => {
		const center = { x: 0, y: 0, z: 0 };
		const world = plotPointToWorld({ x: 50 + PLOT_RADIUS_PCT, y: 50 }, center, 1000, VIEW_SIZE, PLOT_RADIUS_PCT);
		expect(world.x).toBeCloseTo(1000);
		expect(world.y).toBeCloseTo(0);
	});

	it('maps a point above center (smaller svg y) to +y in world space, matching the plot\'s inverted y-axis', () => {
		const center = { x: 0, y: 0, z: 0 };
		const world = plotPointToWorld({ x: 50, y: 50 - PLOT_RADIUS_PCT }, center, 1000, VIEW_SIZE, PLOT_RADIUS_PCT);
		expect(world.y).toBeCloseTo(1000);
	});

	it('preserves the center z (the plot is a flat x/y projection)', () => {
		const center = { x: 0, y: 0, z: 77 };
		const world = plotPointToWorld({ x: 60, y: 40 }, center, 1000, VIEW_SIZE, PLOT_RADIUS_PCT);
		expect(world.z).toBe(77);
	});

	it('scales with the current zoom range, not a fixed radius', () => {
		const center = { x: 0, y: 0, z: 0 };
		const worldZoomedIn = plotPointToWorld({ x: 50 + PLOT_RADIUS_PCT, y: 50 }, center, 200, VIEW_SIZE, PLOT_RADIUS_PCT);
		expect(worldZoomedIn.x).toBeCloseTo(200);
	});
});
