import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';
import { celestialObjectLocation } from '../../src/domain/location.js';

describe('navigation commands', () => {
	it('SetDirection sets the intended heading immediately, without changing the actual heading yet', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 5 });
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 45, xzAngleDeg: 10 });
		const nav = engine.getState().enterpriseNavigation;
		expect(nav.intendedDirection).toEqual({ xyAngleDeg: 45, xzAngleDeg: 10 });
		expect(nav.velocity).toEqual({ xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 5 });
	});

	it('SetSpeed updates warp speed without changing heading angles', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 45, xzAngleDeg: 10 });
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 5 });
		expect(engine.getState().enterpriseNavigation.intendedDirection).toEqual({ xyAngleDeg: 45, xzAngleDeg: 10 });
		expect(engine.getState().enterpriseNavigation.velocity.warpSpeed).toBe(5);
	});

	it('SetCourse records the destination location, whether given as an object or raw coordinates', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: celestialObjectLocation(3) });
		expect(engine.getState().enterpriseNavigation.destination).toEqual(celestialObjectLocation(3));

		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: { kind: 'coordinates', x: 1, y: 2, z: 3 } });
		expect(engine.getState().enterpriseNavigation.destination).toEqual({ kind: 'coordinates', x: 1, y: 2, z: 3 });
	});

	it('SetCourse to coordinates also turns the ship to face that point', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: { kind: 'coordinates', x: 0, y: 10, z: 0 } });
		expect(engine.getState().enterpriseNavigation.intendedDirection.xyAngleDeg).toBeCloseTo(90);
	});

	it('SetCourse to a celestial object turns the ship to face its current position', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 10, y: 0, z: 0 },
			radius: 1,
			mass: 1
		});
		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: celestialObjectLocation(1) });
		expect(engine.getState().enterpriseNavigation.intendedDirection.xyAngleDeg).toBeCloseTo(0);
	});

	it('advances the actual heading toward the intended heading over successive ticks, without snapping instantly', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		engine.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 2 });
		engine.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 90, xzAngleDeg: 0 });

		engine.tick(1000);
		// Below warp 5, turn rate is 15 deg/sec.
		expect(engine.getState().enterpriseNavigation.velocity.xyAngleDeg).toBeCloseTo(15);

		engine.tick(1000);
		expect(engine.getState().enterpriseNavigation.velocity.xyAngleDeg).toBeCloseTo(30);
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
