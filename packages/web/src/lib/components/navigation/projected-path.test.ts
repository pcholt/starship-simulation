import { describe, expect, it } from 'vitest';
import { createNavigationState } from '@starship/engine';
import { projectedPath } from './projected-path.js';

describe('projectedPath', () => {
	it('is empty when the ship is stationary', () => {
		const nav = createNavigationState();
		expect(projectedPath(nav, 10, 1)).toEqual([]);
	});

	it('starts at the ship current position', () => {
		const nav = {
			...createNavigationState(),
			position: { x: 5, y: 5, z: 0 },
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 1 },
			intendedDirection: { xyAngleDeg: 0, xzAngleDeg: 0 }
		};
		const path = projectedPath(nav, 10, 1);
		expect(path[0]).toEqual({ x: 5, y: 5, z: 0 });
	});

	it('produces one point per step plus the starting point', () => {
		const nav = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 1 },
			intendedDirection: { xyAngleDeg: 0, xzAngleDeg: 0 }
		};
		const path = projectedPath(nav, 10, 1);
		expect(path).toHaveLength(11);
	});

	it('projects a straight line when already facing the intended direction', () => {
		const nav = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 2 },
			intendedDirection: { xyAngleDeg: 0, xzAngleDeg: 0 }
		};
		const path = projectedPath(nav, 4, 1);
		// 2 units/sec along +x, one point per second.
		expect(path[1]!.x).toBeCloseTo(2);
		expect(path[4]!.x).toBeCloseTo(8);
		expect(path[4]!.y).toBeCloseTo(0);
	});

	it('curves as the ship turns toward a different intended direction', () => {
		const nav = {
			...createNavigationState(),
			velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 2 },
			intendedDirection: { xyAngleDeg: 90, xzAngleDeg: 0 }
		};
		const path = projectedPath(nav, 10, 1);
		// Early on the ship is still mostly facing +x; later it has turned toward +y.
		const earlyStep = path[1]!;
		const laterStep = path[9]!;
		expect(earlyStep.x).toBeGreaterThan(0);
		expect(laterStep.y).toBeGreaterThan(earlyStep.y);
	});
});
