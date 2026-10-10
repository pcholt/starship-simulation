import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';
import type { Engine } from '../../src/engine.js';
import { TORPEDO_MAX_RANGE } from '../../src/domain/torpedo.js';

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

	it('FireTorpedo fails when the target is within sensor range but beyond the torpedo\'s fuel-limited reach', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Distant Cruiser',
			mission: 'unconditionalAttack',
			position: { x: TORPEDO_MAX_RANGE + 50, y: 0, z: 0 } // within the 1000-unit sensor range, but unreachable on a full tank
		});
		const result = engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Distant Cruiser' } });
		expect(result).toEqual({ ok: false, reason: 'Target out of torpedo range' });
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

	it('records every torpedo explosion resolved within a single tick, not just the last one', () => {
		// Regression: lastTorpedoExplosionEvent used to be a single overwritten slot, so the first
		// of several same-tick explosions was silently lost.
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Alpha', mission: 'none', position: { x: 0.1, y: 0, z: 0 } });
		engine.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'Beta', mission: 'none', position: { x: -0.1, y: 0, z: 0 } });
		engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: engine.getState().federationCraft[0]!.id, lifted: true });
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Alpha' } });
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Beta' } });
		engine.tick(1); // both torpedoes launched right next to their targets — resolve on the very first tick

		expect(engine.getState().torpedoExplosionEvents).toHaveLength(2);
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

	describe('weapons safety cover over Federation craft', () => {
		function engineWithFederationCraft() {
			const engine = createEngine();
			engine.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Excelsior', mission: 'patrol', position: { x: 40, y: 0, z: 0 } });
			const craftId = engine.getState().federationCraft[0]!.id;
			return { engine, craftId };
		}

		it('starts with every cover closed', () => {
			const { engine } = engineWithFederationCraft();

			expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([]);
		});

		it('records a lifted cover in the helm state', () => {
			const { engine, craftId } = engineWithFederationCraft();

			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });

			expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([craftId]);
		});

		it('records a closed cover by removing it from the lifted list', () => {
			const { engine, craftId } = engineWithFederationCraft();
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });

			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: false });

			expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([]);
		});

		it('rejects a cover command for a craft that is not a Federation craft', () => {
			const engine = createEngine();

			const result = engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: 99, lifted: true });

			expect(result.ok).toBe(false);
		});

		it('refuses to fire phasers at a Federation craft while its cover is closed', () => {
			const { engine } = engineWithFederationCraft();

			const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'USS Excelsior' } });

			expect(result).toEqual({ ok: false, reason: 'The weapons safety cover over USS Excelsior is closed' });
		});

		it('refuses to fire a torpedo at a Federation craft while its cover is closed', () => {
			const { engine } = engineWithFederationCraft();

			const result = engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'USS Excelsior' } });

			expect(result.ok).toBe(false);
			expect(engine.getState().torpedoes).toHaveLength(0);
		});

		it('refuses to fire at a Federation craft by coordinates while its cover is closed', () => {
			const { engine } = engineWithFederationCraft();

			const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position: { x: 40, y: 0, z: 0 } } });

			expect(result.ok).toBe(false);
		});

		it('does not damage a Federation craft whose cover is closed', () => {
			const { engine } = engineWithFederationCraft();
			engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'USS Excelsior' } });

			expect(engine.getState().federationCraft[0]!.hullIntegrity).toBe(100);
		});

		it('fires phasers at a Federation craft once its cover is lifted', () => {
			const { engine, craftId } = engineWithFederationCraft();
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });

			const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'USS Excelsior' } });

			expect(result.ok).toBe(true);
			expect(engine.getState().federationCraft[0]!.hullIntegrity).toBeLessThan(100);
		});

		it('closes the cover again after phasers are fired', () => {
			const { engine, craftId } = engineWithFederationCraft();
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });

			engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'USS Excelsior' } });

			expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([]);
		});

		it('closes the cover again after a torpedo is fired', () => {
			const { engine, craftId } = engineWithFederationCraft();
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });

			engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'USS Excelsior' } });

			expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([]);
		});

		it('leaves the cover lifted when a shot is refused because the target is out of sensor range', () => {
			const engine = createEngine();
			engine.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Distant', mission: 'patrol', position: { x: 100_000, y: 0, z: 0 } });
			const craftId = engine.getState().federationCraft[0]!.id;
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });

			const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'USS Distant' } });

			expect(result.ok).toBe(false);
			expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([craftId]);
		});

		it('never needs a cover to be lifted to fire at an enemy craft', () => {
			const engine = createEngine();
			engine.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'unconditionalAttack', position: { x: 40, y: 0, z: 0 } });

			const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Raider' } });

			expect(result.ok).toBe(true);
		});

		it('forgets a lifted cover when its craft is destroyed', () => {
			const { engine, craftId } = engineWithFederationCraft();
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });
			for (let shot = 0; shot < 30 && engine.getState().federationCraft.length > 0; shot++) {
				engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted: true });
				engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'USS Excelsior' } });
			}

			expect(engine.getState().helm.liftedWeaponCoverCraftIds).not.toContain(craftId);
		});
	});
});
