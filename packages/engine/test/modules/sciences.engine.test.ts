import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

describe('sciences commands', () => {
	it('ScanObject finds a celestial object by name and records a full-quality scan when close', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 10, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		const result = engine.dispatch({ module: 'sciences', type: 'ScanObject', name: 'Rigel VII' });
		expect(result).toEqual({ ok: true });
		expect(engine.getState().lastScanResult).toMatchObject({ identity: 'Rigel VII', quality: 'full', radius: 6000 });
	});

	it('ScanObject finds an enemy or federation craft by name', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 0, y: 0, z: 0 }
		});
		engine.dispatch({ module: 'sciences', type: 'ScanObject', name: 'Klingon Bird of Prey' });
		expect(engine.getState().lastScanResult).toMatchObject({ identity: 'Klingon Bird of Prey', mission: 'unconditionalAttack' });
	});

	it('ScanObject fails with a reason when no object or craft matches the name', () => {
		const engine = createEngine();
		const result = engine.dispatch({ module: 'sciences', type: 'ScanObject', name: 'Nonexistent' });
		expect(result).toEqual({ ok: false, reason: 'No object or craft named "Nonexistent"' });
		expect(engine.getState().lastScanResult).toBeNull();
	});

	it('ScanArea scans the nearest object to the given coordinates', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Near',
			position: { x: 5, y: 0, z: 0 },
			radius: 1,
			mass: 1
		});
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Far',
			position: { x: 500, y: 0, z: 0 },
			radius: 1,
			mass: 1
		});
		engine.dispatch({ module: 'sciences', type: 'ScanArea', position: { x: 0, y: 0, z: 0 } });
		expect(engine.getState().lastScanResult).toMatchObject({ identity: 'Near' });
	});

	it('ScanArea fails when the universe has no objects or craft at all', () => {
		const engine = createEngine();
		const result = engine.dispatch({ module: 'sciences', type: 'ScanArea', position: { x: 0, y: 0, z: 0 } });
		expect(result.ok).toBe(false);
	});

	it('ScanRandom picks a deterministic object when the engine is given a fixed rng', () => {
		const engine = createEngine({ rng: () => 0 });
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'First',
			position: { x: 1, y: 0, z: 0 },
			radius: 1,
			mass: 1
		});
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Second',
			position: { x: 2, y: 0, z: 0 },
			radius: 1,
			mass: 1
		});
		engine.dispatch({ module: 'sciences', type: 'ScanRandom' });
		expect(engine.getState().lastScanResult).toMatchObject({ identity: 'First' });
	});
});
