import type { Command } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

/**
 * Parses the Sciences station's terse command syntax (book Figure 3.11):
 *   S S O <object name>     — Scan Specified Object
 *   S A <x> <y> <z>         — Scan Area
 *   S R                     — Scan Randomly
 */
export function parseSciencesCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const upper = trimmed.toUpperCase();

	if (upper === 'S R') {
		return { ok: true, command: { module: 'sciences', type: 'ScanRandom' } };
	}

	if (upper.startsWith('S S O ')) {
		const name = trimmed.slice('S S O '.length).trim();
		if (!name) return { ok: false, reason: 'Usage: S S O <object name>' };
		return { ok: true, command: { module: 'sciences', type: 'ScanObject', name } };
	}

	if (upper.startsWith('S A ')) {
		const numbers = trimmed
			.slice('S A '.length)
			.trim()
			.split(/\s+/)
			.map(Number);
		if (numbers.length !== 3 || numbers.some((n) => Number.isNaN(n))) {
			return { ok: false, reason: 'Usage: S A <x> <y> <z>' };
		}
		const [x, y, z] = numbers as [number, number, number];
		return { ok: true, command: { module: 'sciences', type: 'ScanArea', position: { x, y, z } } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
