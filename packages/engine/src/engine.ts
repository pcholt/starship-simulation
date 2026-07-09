import { produce } from 'immer';
import type { Command, CommandResult } from './commands.js';
import { ALL_MODULE_NAMES } from './domain/module.js';
import { createInitialWorldState, type WorldState } from './domain/world-state.js';
import type { EngineEvent, Unsubscribe } from './events.js';
import { createScenarioRuntimeState, dueSteps, type ScenarioScript } from './scenario/scenario.js';

export interface EngineDeps {
	/** Injectable clock; unused by the synchronous engine today but reserved for time-stamped alerts/logging. */
	now?: () => number;
	/** Injectable PRNG, for deterministic tests once modules with randomness (scans, malfunctions) land. */
	rng?: () => number;
	initialState?: WorldState;
}

export interface Engine {
	dispatch(command: Command): CommandResult;
	getState(): Readonly<WorldState>;
	subscribe(listener: (event: EngineEvent) => void): Unsubscribe;
	/** Advances the simulated clock by `deltaMs` and executes any scenario steps that are now due. */
	tick(deltaMs: number): void;
	loadScenario(script: ScenarioScript): void;
	destroy(): void;
}

export function createEngine(deps: EngineDeps = {}): Engine {
	// Routed through `produce` so immer's auto-freeze applies even to the untouched initial
	// state, keeping `getState()` snapshots honestly readonly at runtime, not just by type.
	let state: WorldState = produce(deps.initialState ?? createInitialWorldState(), () => {});
	let nextCraftId = 1;
	const listeners = new Set<(event: EngineEvent) => void>();

	function emit(event: EngineEvent): void {
		for (const listener of listeners) listener(event);
	}

	function applyCommand(command: Command): CommandResult {
		switch (command.type) {
			case 'Initialize':
			case 'Execute':
			case 'Halt': {
				const runState = command.type === 'Execute' ? 'running' : 'halted';
				const targets = command.target === 'all' ? ALL_MODULE_NAMES : [command.target];
				state = produce(state, (draft) => {
					for (const name of targets) draft.modules[name] = runState;
				});
				emit({ type: 'StateChanged', paths: targets.map((name) => `modules.${name}`) });
				return { ok: true };
			}
			case 'CreateEnemyCraft': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.enemyCraft.push({ id, name: command.name, mission: command.mission, position: command.position });
				});
				emit({ type: 'StateChanged', paths: ['enemyCraft'] });
				return { ok: true };
			}
			case 'CreateFederationCraft': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.federationCraft.push({ id, name: command.name, mission: command.mission, position: command.position });
				});
				emit({ type: 'StateChanged', paths: ['federationCraft'] });
				return { ok: true };
			}
			case 'CreateCelestialObject': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.celestialObjects.push({
						id,
						name: command.name,
						position: command.position,
						radius: command.radius,
						mass: command.mass
					});
				});
				emit({ type: 'StateChanged', paths: ['celestialObjects'] });
				return { ok: true };
			}
			case 'RunScenario': {
				if (!state.scenario) return { ok: false, reason: 'No scenario loaded' };
				state = produce(state, (draft) => {
					draft.scenario!.runState = 'running';
				});
				emit({ type: 'StateChanged', paths: ['scenario.runState'] });
				return { ok: true };
			}
			case 'HaltScenario': {
				if (!state.scenario) return { ok: false, reason: 'No scenario loaded' };
				state = produce(state, (draft) => {
					draft.scenario!.runState = 'halted';
				});
				emit({ type: 'StateChanged', paths: ['scenario.runState'] });
				return { ok: true };
			}
		}
	}

	return {
		dispatch(command) {
			return applyCommand(command);
		},
		getState() {
			return state;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		tick(deltaMs) {
			state = produce(state, (draft) => {
				draft.simulatedTimeMs += deltaMs;
			});
			if (!state.scenario) return;
			const steps = dueSteps(state.scenario, state.simulatedTimeMs);
			if (steps.length === 0) return;
			state = produce(state, (draft) => {
				draft.scenario!.nextStepIndex += steps.length;
			});
			for (const step of steps) {
				applyCommand(step.command);
				emit({ type: 'ScenarioStepExecuted', atMs: step.atMs, command: step.command });
			}
		},
		loadScenario(script) {
			state = produce(state, (draft) => {
				draft.scenario = createScenarioRuntimeState(script);
			});
			emit({ type: 'StateChanged', paths: ['scenario'] });
		},
		destroy() {
			listeners.clear();
		}
	};
}
