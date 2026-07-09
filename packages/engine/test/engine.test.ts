import { describe, expect, it, vi } from 'vitest';
import { createEngine } from '../src/engine.js';
import type { EngineEvent } from '../src/events.js';

describe('createEngine', () => {
	it('starts from a fresh initial world state by default', () => {
		const engine = createEngine();
		expect(engine.getState().simulatedTimeMs).toBe(0);
		expect(engine.getState().modules.navigation).toBe('running');
	});

	it('accepts a seeded initial state', () => {
		const engine = createEngine({ initialState: { ...createEngine().getState(), simulatedTimeMs: 42 } });
		expect(engine.getState().simulatedTimeMs).toBe(42);
	});
});

describe('engine.dispatch — module lifecycle', () => {
	it('sets a single module back to running on Execute after it was halted', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Halt', target: 'navigation' });
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		expect(engine.getState().modules.navigation).toBe('running');
		expect(engine.getState().modules.helm).toBe('running');
	});

	it('sets a single module to halted on Halt', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		engine.dispatch({ module: 'controller', type: 'Halt', target: 'navigation' });
		expect(engine.getState().modules.navigation).toBe('halted');
	});

	it('Execute "all" sets every module to running', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'all' });
		expect(Object.values(engine.getState().modules)).toEqual(Array(6).fill('running'));
	});

	it('Halt "all" sets every module back to halted', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'all' });
		engine.dispatch({ module: 'controller', type: 'Halt', target: 'all' });
		expect(Object.values(engine.getState().modules)).toEqual(Array(6).fill('halted'));
	});

	it('Initialize resets a module to halted even if it was running', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		engine.dispatch({ module: 'controller', type: 'Initialize', target: 'navigation' });
		expect(engine.getState().modules.navigation).toBe('halted');
	});
});

describe('engine.dispatch — creating craft and celestial objects', () => {
	it('adds an enemy craft with the given name, mission, and position', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 1, y: 2, z: 3 }
		});
		expect(engine.getState().enemyCraft).toEqual([
			{
				id: 1,
				name: 'Klingon Bird of Prey',
				mission: 'unconditionalAttack',
				position: { x: 1, y: 2, z: 3 },
				hullIntegrity: 100
			}
		]);
	});

	it('adds a federation craft', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateFederationCraft',
			name: 'USS Excelsior',
			mission: 'exploration',
			position: { x: 0, y: 0, z: 0 }
		});
		expect(engine.getState().federationCraft).toHaveLength(1);
	});

	it('adds a celestial object', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 10, y: 10, z: 10 },
			radius: 6000,
			mass: 5.9e24
		});
		expect(engine.getState().celestialObjects).toHaveLength(1);
	});

	it('assigns increasing ids to successively created enemy craft', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'A',
			mission: 'm',
			position: { x: 0, y: 0, z: 0 }
		});
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'B',
			mission: 'm',
			position: { x: 0, y: 0, z: 0 }
		});
		expect(engine.getState().enemyCraft.map((c) => c.id)).toEqual([1, 2]);
	});
});

describe('engine.subscribe', () => {
	it('notifies listeners with a StateChanged event on dispatch', () => {
		const engine = createEngine();
		const listener = vi.fn<(event: EngineEvent) => void>();
		engine.subscribe(listener);
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'StateChanged' }));
	});

	it('stops notifying after unsubscribe', () => {
		const engine = createEngine();
		const listener = vi.fn<(event: EngineEvent) => void>();
		const unsubscribe = engine.subscribe(listener);
		unsubscribe();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		expect(listener).not.toHaveBeenCalled();
	});
});

describe('engine.getState immutability', () => {
	it('throws if code attempts to mutate a returned snapshot directly, rather than allowing a silent divergence', () => {
		const engine = createEngine();
		const snapshot = engine.getState();
		expect(() => {
			// @ts-expect-error -- deliberately attempting a runtime mutation of a readonly snapshot
			snapshot.simulatedTimeMs = 999;
		}).toThrow(/read only property/);
	});
});

describe('engine.tick + scenario', () => {
	it('does not execute scenario steps before their scheduled time', () => {
		const engine = createEngine();
		engine.loadScenario({
			steps: [
				{
					atMs: 1000,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'Nova',
						position: { x: 0, y: 0, z: 0 },
						radius: 1,
						mass: 1
					}
				}
			]
		});
		engine.dispatch({ module: 'controller', type: 'RunScenario' });
		engine.tick(500);
		expect(engine.getState().celestialObjects).toHaveLength(0);
	});

	it('executes a scenario step once simulated time reaches it, via the same dispatch pipeline', () => {
		const engine = createEngine();
		const listener = vi.fn<(event: EngineEvent) => void>();
		engine.subscribe(listener);
		engine.loadScenario({
			steps: [
				{
					atMs: 1000,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'Nova',
						position: { x: 0, y: 0, z: 0 },
						radius: 1,
						mass: 1
					}
				}
			]
		});
		engine.dispatch({ module: 'controller', type: 'RunScenario' });
		engine.tick(600);
		engine.tick(600);
		expect(engine.getState().celestialObjects).toHaveLength(1);
		expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'ScenarioStepExecuted', atMs: 1000 }));
	});

	it('does not execute scenario steps while halted, even as simulated time advances', () => {
		const engine = createEngine();
		engine.loadScenario({
			steps: [
				{
					atMs: 100,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'Nova',
						position: { x: 0, y: 0, z: 0 },
						radius: 1,
						mass: 1
					}
				}
			]
		});
		// Never dispatched RunScenario.
		engine.tick(1000);
		expect(engine.getState().celestialObjects).toHaveLength(0);
	});

	it('HaltScenario stops further step execution even as simulated time keeps advancing', () => {
		const engine = createEngine();
		engine.loadScenario({
			steps: [
				{
					atMs: 100,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'First',
						position: { x: 0, y: 0, z: 0 },
						radius: 1,
						mass: 1
					}
				},
				{
					atMs: 200,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'Second',
						position: { x: 0, y: 0, z: 0 },
						radius: 1,
						mass: 1
					}
				}
			]
		});
		engine.dispatch({ module: 'controller', type: 'RunScenario' });
		engine.tick(150);
		engine.dispatch({ module: 'controller', type: 'HaltScenario' });
		engine.tick(150);
		expect(engine.getState().celestialObjects).toHaveLength(1);
		expect(engine.getState().celestialObjects[0]!.name).toBe('First');
	});
});
