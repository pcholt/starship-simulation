import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';
import { celestialObjectLocation } from '../../src/domain/location.js';

describe('navigation commands', () => {
	it('SetDirection updates the Enterprise heading angles without changing speed', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 5 });
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 45, xzAngleDeg: 10 });
		expect(engine.getState().enterpriseNavigation.velocity).toEqual({
			xyAngleDeg: 45,
			xzAngleDeg: 10,
			warpSpeed: 5
		});
	});

	it('SetSpeed updates warp speed without changing heading angles', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 45, xzAngleDeg: 10 });
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 5 });
		expect(engine.getState().enterpriseNavigation.velocity).toEqual({
			xyAngleDeg: 45,
			xzAngleDeg: 10,
			warpSpeed: 5
		});
	});

	it('SetCourse records the destination location, whether given as an object or raw coordinates', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: celestialObjectLocation(3) });
		expect(engine.getState().enterpriseNavigation.destination).toEqual(celestialObjectLocation(3));

		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: { kind: 'coordinates', x: 1, y: 2, z: 3 } });
		expect(engine.getState().enterpriseNavigation.destination).toEqual({ kind: 'coordinates', x: 1, y: 2, z: 3 });
	});
});

describe('navigation movement during tick', () => {
	it('does not move the ship while the navigation module is halted', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Halt', target: 'navigation' });
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 0, xzAngleDeg: 0 });
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 10 });
		engine.tick(1000);
		expect(engine.getState().enterpriseNavigation.position).toEqual({ x: 0, y: 0, z: 0 });
	});

	it('moves the ship along its heading once the navigation module is running', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 0, xzAngleDeg: 0 });
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 10 });
		engine.tick(1000);
		const position = engine.getState().enterpriseNavigation.position;
		expect(position.x).toBeCloseTo(10);
	});

	it('stops moving once the navigation module is halted again', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 0, xzAngleDeg: 0 });
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 10 });
		engine.tick(1000);
		engine.dispatch({ module: 'controller', type: 'Halt', target: 'navigation' });
		engine.tick(1000);
		const position = engine.getState().enterpriseNavigation.position;
		expect(position.x).toBeCloseTo(10);
	});
});
