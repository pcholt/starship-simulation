import { produce } from 'immer';
import type { Command, CommandResult } from './commands.js';
import { ALL_MODULE_NAMES } from './domain/module.js';
import { createInitialWorldState, type WorldState } from './domain/world-state.js';
import { advancePosition } from './domain/navigation.js';
import { scanCelestialObject, scanCraft, distanceBetween, type ScanResult } from './domain/sciences.js';
import { allocateEnergy } from './domain/engineering.js';
import type { Vector3 } from './domain/vector.js';
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
	const rng = deps.rng ?? Math.random;
	const listeners = new Set<(event: EngineEvent) => void>();

	function scannableEntries(): { name: string; scan: (fromPosition: Vector3) => ScanResult }[] {
		return [
			...state.celestialObjects.map((object) => ({
				name: object.name,
				scan: (fromPosition: Vector3) => scanCelestialObject(object, fromPosition)
			})),
			...state.enemyCraft.map((craft) => ({ name: craft.name, scan: (fromPosition: Vector3) => scanCraft(craft, fromPosition) })),
			...state.federationCraft.map((craft) => ({
				name: craft.name,
				scan: (fromPosition: Vector3) => scanCraft(craft, fromPosition)
			}))
		];
	}

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
			case 'SetDirection': {
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.velocity.xyAngleDeg = command.xyAngleDeg;
					draft.enterpriseNavigation.velocity.xzAngleDeg = command.xzAngleDeg;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.velocity'] });
				return { ok: true };
			}
			case 'SetSpeed': {
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.velocity.warpSpeed = command.warpSpeed;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.velocity'] });
				return { ok: true };
			}
			case 'SetCourse': {
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.destination = command.destination;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.destination'] });
				return { ok: true };
			}
			case 'ScanObject': {
				const entry = scannableEntries().find((e) => e.name === command.name);
				if (!entry) return { ok: false, reason: `No object or craft named "${command.name}"` };
				const result = entry.scan(state.enterpriseNavigation.position);
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult'] });
				return { ok: true };
			}
			case 'ScanArea': {
				const entries = scannableEntries();
				if (entries.length === 0) return { ok: false, reason: 'Nothing detected in this area' };
				const nearest = entries
					.map((e) => ({ entry: e, distance: distanceBetween(e.scan(command.position).position, command.position) }))
					.sort((a, b) => a.distance - b.distance)[0]!.entry;
				const result = nearest.scan(state.enterpriseNavigation.position);
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult'] });
				return { ok: true };
			}
			case 'ScanRandom': {
				const entries = scannableEntries();
				if (entries.length === 0) return { ok: false, reason: 'Nothing detected in this area' };
				const entry = entries[Math.floor(rng() * entries.length)]!;
				const result = entry.scan(state.enterpriseNavigation.position);
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult'] });
				return { ok: true };
			}
			case 'SetEnergyAllocation': {
				if (!(command.deviceId in state.engineering.devices)) {
					return { ok: false, reason: `No device named "${command.deviceId}"` };
				}
				const nextEngineering = allocateEnergy(state.engineering, command.deviceId, command.amount);
				state = produce(state, (draft) => {
					draft.engineering = nextEngineering;
				});
				emit({ type: 'StateChanged', paths: ['engineering.devices'] });
				return { ok: true };
			}
			case 'SetShuttlecraftMission': {
				const shuttle = state.engineering.shuttlecraft.find((s) => s.id === command.shuttlecraftId);
				if (!shuttle) return { ok: false, reason: `No shuttlecraft numbered ${command.shuttlecraftId}` };
				state = produce(state, (draft) => {
					const draftShuttle = draft.engineering.shuttlecraft.find((s) => s.id === command.shuttlecraftId)!;
					draftShuttle.mission = command.mission;
					draftShuttle.destination = command.destination ?? null;
				});
				emit({ type: 'StateChanged', paths: ['engineering.shuttlecraft'] });
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
				if (draft.modules.navigation === 'running') {
					draft.enterpriseNavigation.position = advancePosition(draft.enterpriseNavigation, deltaMs);
				}
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
