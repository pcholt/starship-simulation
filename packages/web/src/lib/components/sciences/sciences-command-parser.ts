import type { Command } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

/** Mirrors the book's Figure 3.11 "Sciences Commands" table. */
export const SCIENCES_COMMANDS = [
	{ description: 'Scan Specified Object', syntax: 'SSO <object name>' },
	{ description: 'Scan Area', syntax: 'SA <x> <y> <z>' },
	{ description: 'Scan Randomly', syntax: 'SR' }
];

/**
 * Parses the Sciences station's terse command syntax (book Figure 3.11, with
 * the command code as a single token rather than space-separated letters):
 *   SSO <object name>     — Scan Specified Object
 *   SA <x> <y> <z>        — Scan Area
 *   SR                    — Scan Randomly
 */
export function parseSciencesCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const upper = trimmed.toUpperCase();

	if (upper === 'SR') {
		return { ok: true, command: { module: 'sciences', type: 'ScanRandom' } };
	}

	if (upper.startsWith('SSO ')) {
		const name = trimmed.slice('SSO '.length).trim();
		if (!name) return { ok: false, reason: 'Usage: SSO <object name>' };
		return { ok: true, command: { module: 'sciences', type: 'ScanObject', name } };
	}

	if (upper.startsWith('SA ')) {
		const numbers = trimmed
			.slice('SA '.length)
			.trim()
			.split(/\s+/)
			.map(Number);
		if (numbers.length !== 3 || numbers.some((n) => Number.isNaN(n))) {
			return { ok: false, reason: 'Usage: SA <x> <y> <z>' };
		}
		const [x, y, z] = numbers as [number, number, number];
		return { ok: true, command: { module: 'sciences', type: 'ScanArea', position: { x, y, z } } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
