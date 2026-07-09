import type { ModuleName } from './domain/module.js';
import type { Vector3 } from './domain/vector.js';

export type ModuleTarget = ModuleName | 'all';

/**
 * Every command a player or a scenario step can dispatch. Text parsing of the
 * book's terse per-module syntax (e.g. `F P O <name>`) happens in the web
 * package, not here — the engine only ever accepts these typed commands.
 */
export type Command =
	| { module: 'controller'; type: 'Initialize'; target: ModuleTarget }
	| { module: 'controller'; type: 'Execute'; target: ModuleTarget }
	| { module: 'controller'; type: 'Halt'; target: ModuleTarget }
	| { module: 'controller'; type: 'CreateEnemyCraft'; name: string; mission: string; position: Vector3 }
	| { module: 'controller'; type: 'CreateFederationCraft'; name: string; mission: string; position: Vector3 }
	| {
			module: 'controller';
			type: 'CreateCelestialObject';
			name: string;
			position: Vector3;
			radius: number;
			mass: number;
	  }
	| { module: 'controller'; type: 'RunScenario' }
	| { module: 'controller'; type: 'HaltScenario' };

export type CommandResult = { ok: true } | { ok: false; reason: string };
