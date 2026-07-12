import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';
import type { Engine } from '../../src/engine.js';

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

/** Ticks the engine (in the server's real 200ms steps) until all in-flight torpedoes have resolved. */
function resolveTorpedoes(engine: Engine, maxTicks = 50) {
	for (let i = 0; i < maxTicks && engine.getState().torpedoes.length > 0; i++) {
		engine.tick(200);
	}
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

	it('FireTorpedo launches a torpedo rather than damaging the target instantly', () => {
		const engine = createEngineWithNearbyEnemy();
		const result = engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Klingon Bird of Prey' } });
		expect(result).toEqual({ ok: true });
		expect(engine.getState().torpedoes).toHaveLength(1);
		expect(engine.getState().enemyCraft[0]!.hullIntegrity).toBe(100);
	});

	it('FireTorpedo fails when the target is out of sensor range', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Far Away',
			mission: 'none',
			position: { x: 100000, y: 0, z: 0 }
		});
		const result = engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Far Away' } });
		expect(result).toEqual({ ok: false, reason: 'Target out of sensor range' });
		expect(engine.getState().torpedoes).toHaveLength(0);
	});

	it('a launched torpedo damages its target once it homes in and resolves, over successive ticks', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 5, y: 0, z: 0 }
		});
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Klingon Bird of Prey' } });
		resolveTorpedoes(engine);
		expect(engine.getState().torpedoes).toHaveLength(0);
		expect(engine.getState().enemyCraft[0]!.hullIntegrity).toBeLessThan(100);
	});

	it('destroys a craft whose hull integrity reaches zero across repeated torpedo hits', () => {
		const engine = createEngine({ initialState: undefined });
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Fragile',
			mission: 'none',
			position: { x: 1, y: 0, z: 0 }
		});
		for (let i = 0; i < 5 && engine.getState().enemyCraft.some((c) => c.name === 'Fragile'); i++) {
			engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Fragile' } });
			resolveTorpedoes(engine);
		}
		expect(engine.getState().enemyCraft.find((c) => c.name === 'Fragile')).toBeUndefined();
	});

	it('splash-damages a second craft near the torpedo impact for half the direct-hit damage', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Target',
			mission: 'none',
			position: { x: 5, y: 0, z: 0 }
		});
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Bystander',
			mission: 'none',
			position: { x: 5, y: 2, z: 0 } // within the 3-unit splash radius of the impact point
		});
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Target' } });
		resolveTorpedoes(engine);

		const target = engine.getState().enemyCraft.find((c) => c.name === 'Target')!;
		const bystander = engine.getState().enemyCraft.find((c) => c.name === 'Bystander')!;
		expect(target.hullIntegrity).toBe(70); // 100 - 30 direct hit
		expect(bystander.hullIntegrity).toBe(85); // 100 - 15 splash (half of 30)
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
