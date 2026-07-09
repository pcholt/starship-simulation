import type { CelestialObject } from './celestial-object.js';
import type { Craft } from './craft.js';
import { ALL_MODULE_NAMES, type ModuleName, type ModuleRunState } from './module.js';
import type { ScenarioRuntimeState } from '../scenario/scenario.js';

/** The "common data area" from the book: the single shared state tree every module reads and writes. */
export interface WorldState {
	simulatedTimeMs: number;
	modules: Record<ModuleName, ModuleRunState>;
	celestialObjects: CelestialObject[];
	enemyCraft: Craft[];
	federationCraft: Craft[];
	scenario: ScenarioRuntimeState | null;
}

export function createInitialWorldState(): WorldState {
	const modules = Object.fromEntries(ALL_MODULE_NAMES.map((name) => [name, 'halted'])) as Record<
		ModuleName,
		ModuleRunState
	>;
	return {
		simulatedTimeMs: 0,
		modules,
		celestialObjects: [],
		enemyCraft: [],
		federationCraft: [],
		scenario: null
	};
}
