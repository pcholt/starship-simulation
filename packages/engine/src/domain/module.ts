/** The seven player-operated stations, minus the Simulation Controller (which isn't itself initialized/executed/halted). */
export type ModuleName = 'communications' | 'navigation' | 'sciences' | 'engineering' | 'medical' | 'helm';

export const ALL_MODULE_NAMES: readonly ModuleName[] = [
	'communications',
	'navigation',
	'sciences',
	'engineering',
	'medical',
	'helm'
];

export type ModuleRunState = 'halted' | 'running';
