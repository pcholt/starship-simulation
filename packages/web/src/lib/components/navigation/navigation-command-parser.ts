import type { Command } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

/** Mirrors the book's Figure 3.8 "Navigation Commands" table, for display in the station's command reference. */
export const NAVIGATION_COMMANDS = [
	{ description: 'Set Direction', syntax: 'SD <xy angle> <xz angle>' },
	{ description: 'Set Velocity', syntax: 'SV <warp speed>' },
	{ description: 'Set Course to Coordinates', syntax: 'SCC <x> <y> <z>' }
];

function parseNumbers(tokens: string[], count: number): number[] | null {
	if (tokens.length !== count) return null;
	const numbers = tokens.map(Number);
	return numbers.some((n) => Number.isNaN(n)) ? null : numbers;
}

/**
 * Parses the Navigation station's terse command syntax (per the book's
 * Figure 3.8, adapted to a typed `Command`, with the command code as a
 * single token rather than space-separated letters):
 *   SD <xyAngleDeg> <xzAngleDeg>   — Set Direction
 *   SV <warpSpeed>                 — Set Velocity (speed only)
 *   SCC <x> <y> <z>                — Set Course to Coordinates
 */
export function parseNavigationCommand(input: string): ParseResult {
	const [code, ...rest] = input.trim().toUpperCase().split(/\s+/);

	if (code === 'SD') {
		const numbers = parseNumbers(rest, 2);
		if (!numbers) return { ok: false, reason: 'Usage: SD <xy angle> <xz angle>' };
		const [xyAngleDeg, xzAngleDeg] = numbers as [number, number];
		return { ok: true, command: { module: 'navigation', type: 'SetDirection', xyAngleDeg, xzAngleDeg } };
	}

	if (code === 'SV') {
		const numbers = parseNumbers(rest, 1);
		if (!numbers) return { ok: false, reason: 'Usage: SV <warp speed>' };
		const [warpSpeed] = numbers as [number];
		return { ok: true, command: { module: 'navigation', type: 'SetSpeed', warpSpeed } };
	}

	if (code === 'SCC') {
		const numbers = parseNumbers(rest, 3);
		if (!numbers) return { ok: false, reason: 'Usage: SCC <x> <y> <z>' };
		const [x, y, z] = numbers as [number, number, number];
		return { ok: true, command: { module: 'navigation', type: 'SetCourse', destination: { kind: 'coordinates', x, y, z } } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
