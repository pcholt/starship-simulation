import type { Command } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

function parseNumbers(tokens: string[], count: number): number[] | null {
	if (tokens.length !== count) return null;
	const numbers = tokens.map(Number);
	return numbers.some((n) => Number.isNaN(n)) ? null : numbers;
}

/**
 * Parses the Navigation station's terse command syntax (per the book's
 * Figure 3.8, adapted to a typed `Command`):
 *   S D <xyAngleDeg> <xzAngleDeg>   — Set Direction
 *   S V <warpSpeed>                 — Set Velocity (speed only)
 *   S C C <x> <y> <z>               — Set Course to Coordinates
 */
export function parseNavigationCommand(input: string): ParseResult {
	const tokens = input.trim().toUpperCase().split(/\s+/);
	const [a, b, ...rest] = tokens;

	if (a === 'S' && b === 'D') {
		const numbers = parseNumbers(rest, 2);
		if (!numbers) return { ok: false, reason: 'Usage: S D <xy angle> <xz angle>' };
		const [xyAngleDeg, xzAngleDeg] = numbers as [number, number];
		return { ok: true, command: { module: 'navigation', type: 'SetDirection', xyAngleDeg, xzAngleDeg } };
	}

	if (a === 'S' && b === 'V') {
		const numbers = parseNumbers(rest, 1);
		if (!numbers) return { ok: false, reason: 'Usage: S V <warp speed>' };
		const [warpSpeed] = numbers as [number];
		return { ok: true, command: { module: 'navigation', type: 'SetSpeed', warpSpeed } };
	}

	if (a === 'S' && b === 'C' && rest[0] === 'C') {
		const numbers = parseNumbers(rest.slice(1), 3);
		if (!numbers) return { ok: false, reason: 'Usage: S C C <x> <y> <z>' };
		const [x, y, z] = numbers as [number, number, number];
		return { ok: true, command: { module: 'navigation', type: 'SetCourse', destination: { kind: 'coordinates', x, y, z } } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
