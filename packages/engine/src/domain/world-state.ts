import type { CelestialObject } from './celestial-object.js';
import type { Craft } from './craft.js';
import { ALL_MODULE_NAMES, type ModuleName, type ModuleRunState } from './module.js';
import { createNavigationState, type NavigationState } from './navigation.js';
import { createLifeSupportState, type LifeSupportState, type ScanResult } from './sciences.js';
import { createEngineeringState, type EngineeringState } from './engineering.js';
import { createMedicalState, type MedicalState } from './medical.js';
import { createCommunicationsState, type CommunicationsState } from './communications.js';
import type { ScenarioRuntimeState } from '../scenario/scenario.js';

/** The "common data area" from the book: the single shared state tree every module reads and writes. */
export interface WorldState {
	simulatedTimeMs: number;
	modules: Record<ModuleName, ModuleRunState>;
	enterpriseNavigation: NavigationState;
	lifeSupport: LifeSupportState;
	lastScanResult: ScanResult | null;
	engineering: EngineeringState;
	medical: MedicalState;
	communications: CommunicationsState;
	celestialObjects: CelestialObject[];
	enemyCraft: Craft[];
	federationCraft: Craft[];
	scenario: ScenarioRuntimeState | null;
}

export function createInitialWorldState(): WorldState {
	// Every station starts running, as on an active bridge — Halt models a station going offline
	// (damage, a Controller-scripted malfunction), not something the player must switch on to begin.
	const modules = Object.fromEntries(ALL_MODULE_NAMES.map((name) => [name, 'running'])) as Record<
		ModuleName,
		ModuleRunState
	>;
	return {
		simulatedTimeMs: 0,
		modules,
		enterpriseNavigation: createNavigationState(),
		lifeSupport: createLifeSupportState(),
		lastScanResult: null,
		engineering: createEngineeringState(),
		medical: createMedicalState(),
		communications: createCommunicationsState(),
		celestialObjects: [],
		enemyCraft: [],
		federationCraft: [],
		scenario: null
	};
}
