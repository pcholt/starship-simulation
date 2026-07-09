import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

function createEngineWithNearbyEnemy() {
	const engine = createEngine();
	engine.dispatch({
		module: 'controller',
		type: 'CreateEnemyCraft',
		name: 'Klingon Bird of Prey',
		mission: 'unconditionalAttack',
		position: { x: 50, y: 0, z: 0 }
	});
	return engine;
}

describe('helm commands', () => {
	it('FirePhasers at a named object damages its hull integrity when in sensor range', () => {
		const engine = createEngineWithNearbyEnemy();
		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Klingon Bird of Prey' } });
		expect(result).toEqual({ ok: true });
		const craft = engine.getState().enemyCraft[0]!;
		expect(craft.hullIntegrity).toBeLessThan(100);
	});

	it('FirePhasers fails with a reason when the named target does not exist', () => {
		const engine = createEngine();
		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Nobody' } });
		expect(result).toEqual({ ok: false, reason: 'No object or craft named "Nobody"' });
	});

	it('FirePhasers fails when the target is out of sensor range', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Far Away',
			mission: 'none',
			position: { x: 100000, y: 0, z: 0 }
		});
		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Far Away' } });
		expect(result).toEqual({ ok: false, reason: 'Target out of sensor range' });
	});

	it('FireTorpedo damages a named target regardless of range, as long as it is in sensor range', () => {
		const engine = createEngineWithNearbyEnemy();
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Klingon Bird of Prey' } });
		expect(engine.getState().enemyCraft[0]!.hullIntegrity).toBeLessThan(100);
	});

	it('destroys a craft whose hull integrity reaches zero', () => {
		const engine = createEngine({ initialState: undefined });
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Fragile',
			mission: 'none',
			position: { x: 1, y: 0, z: 0 }
		});
		for (let i = 0; i < 5; i++) {
			engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Fragile' } });
		}
		expect(engine.getState().enemyCraft.find((c) => c.name === 'Fragile')).toBeUndefined();
	});

	it('SetShieldLevel updates the corresponding shield device operational status', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'helm', type: 'SetShieldLevel', location: 'fore', level: 75 });
		expect(engine.getState().engineering.devices['shield-fore']!.operationalStatus).toBe(75);
	});

	it('clamps SetShieldLevel to the 0-100 range', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'helm', type: 'SetShieldLevel', location: 'aft', level: 150 });
		expect(engine.getState().engineering.devices['shield-aft']!.operationalStatus).toBe(100);
	});
});
