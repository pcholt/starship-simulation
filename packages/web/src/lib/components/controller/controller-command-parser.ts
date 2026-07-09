import type { Command, ModuleTarget } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

const LETTER_TO_TARGET: Record<string, ModuleTarget> = {
	A: 'all',
	E: 'engineering',
	C: 'communications',
	N: 'navigation',
	S: 'sciences',
	M: 'medical',
	H: 'helm'
};

/** Mirrors the book's Figure 3.2 "Simulation Controller Commands" table. */
export const CONTROLLER_COMMANDS = [
	{ description: 'Initialize All/Engineering/Communications/Navigation/Sciences/Medical/Helm module', syntax: 'IA / IE / IC / IN / IS / IM / IH' },
	{ description: 'Execute All/Engineering/Communications/Navigation/Sciences/Medical/Helm module', syntax: 'EA / EE / EC / EN / ES / EM / EH' },
	{ description: 'Halt All/Engineering/Communications/Navigation/Sciences/Medical/Helm module', syntax: 'HA / HE / HC / HN / HS / HM / HH' },
	{ description: 'Create Enemy craft', syntax: 'CE <name>, <mission>, <x>, <y>, <z>' },
	{ description: 'Create Federation craft', syntax: 'CF <name>, <mission>, <x>, <y>, <z>' },
	{ description: 'Create Celestial object', syntax: 'CC <name>, <x>, <y>, <z>, <radius>, <mass>' },
	{ description: 'Run the scenario', syntax: 'R' },
	{ description: 'Halt the scenario', syntax: 'H' }
];

function parseCommaFields(text: string, count: number): string[] | null {
	const fields = text.split(',').map((f) => f.trim());
	return fields.length === count && fields.every((f) => f.length > 0) ? fields : null;
}

function parseNumber(text: string): number | null {
	const n = Number(text);
	return Number.isNaN(n) ? null : n;
}

/**
 * Parses the Simulation Controller's terse command syntax (book Figure 3.2,
 * with the command code as a single token rather than space-separated
 * letters). Lifecycle codes are two letters: an action (I/E/H) followed by a
 * module letter (A/E/C/N/S/M/H) — e.g. `EN` = Execute Navigation. `R` and `H`
 * alone (no second letter) control the scenario, not a module, and never
 * collide with the two-letter module codes since they're compared as whole
 * tokens (`H` !== `HA`).
 */
export function parseControllerCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const firstSpace = trimmed.search(/\s/);
	const code = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toUpperCase();
	const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();

	if (code === 'R') return { ok: true, command: { module: 'controller', type: 'RunScenario' } };
	if (code === 'H') return { ok: true, command: { module: 'controller', type: 'HaltScenario' } };
	if (code === 'I') return { ok: false, reason: 'Load a scenario using the Scenario panel below' };

	if (code.length === 2 && ['I', 'E', 'H'].includes(code[0]!)) {
		const target = LETTER_TO_TARGET[code[1]!];
		if (!target) return { ok: false, reason: `Unrecognized command: ${input}` };
		const type = code[0] === 'I' ? 'Initialize' : code[0] === 'E' ? 'Execute' : 'Halt';
		return { ok: true, command: { module: 'controller', type, target } };
	}

	if (code === 'CE') {
		const fields = parseCommaFields(rest, 5);
		if (!fields) return { ok: false, reason: 'Usage: CE <name>, <mission>, <x>, <y>, <z>' };
		const [name, mission, xText, yText, zText] = fields;
		const x = parseNumber(xText!);
		const y = parseNumber(yText!);
		const z = parseNumber(zText!);
		if (x === null || y === null || z === null) return { ok: false, reason: 'Usage: CE <name>, <mission>, <x>, <y>, <z>' };
		return {
			ok: true,
			command: { module: 'controller', type: 'CreateEnemyCraft', name: name!, mission: mission!, position: { x, y, z } }
		};
	}

	if (code === 'CF') {
		const fields = parseCommaFields(rest, 5);
		if (!fields) return { ok: false, reason: 'Usage: CF <name>, <mission>, <x>, <y>, <z>' };
		const [name, mission, xText, yText, zText] = fields;
		const x = parseNumber(xText!);
		const y = parseNumber(yText!);
		const z = parseNumber(zText!);
		if (x === null || y === null || z === null) return { ok: false, reason: 'Usage: CF <name>, <mission>, <x>, <y>, <z>' };
		return {
			ok: true,
			command: { module: 'controller', type: 'CreateFederationCraft', name: name!, mission: mission!, position: { x, y, z } }
		};
	}

	if (code === 'CC') {
		const fields = parseCommaFields(rest, 6);
		if (!fields) return { ok: false, reason: 'Usage: CC <name>, <x>, <y>, <z>, <radius>, <mass>' };
		const [name, xText, yText, zText, radiusText, massText] = fields;
		const x = parseNumber(xText!);
		const y = parseNumber(yText!);
		const z = parseNumber(zText!);
		const radius = parseNumber(radiusText!);
		const mass = parseNumber(massText!);
		if (x === null || y === null || z === null || radius === null || mass === null) {
			return { ok: false, reason: 'Usage: CC <name>, <x>, <y>, <z>, <radius>, <mass>' };
		}
		return {
			ok: true,
			command: { module: 'controller', type: 'CreateCelestialObject', name: name!, position: { x, y, z }, radius, mass }
		};
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
