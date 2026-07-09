import type { BankLocation, Command } from '@starship/engine';
import { BANK_LOCATIONS } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

/** Mirrors the book's Figure 3.16 "Helm Commands" table. */
export const HELM_COMMANDS = [
	{ description: 'Fire Phaser at named Object', syntax: 'F P O <object name>' },
	{ description: 'Fire Phaser at Coordinates', syntax: 'F P C <x> <y> <z>' },
	{ description: 'Fire photon Torpedo at named Object', syntax: 'F T O <object name>' },
	{ description: 'Fire photon Torpedo at Coordinates', syntax: 'F T C <x> <y> <z>' },
	{ description: 'Set Deflector shield level', syntax: `S D <${BANK_LOCATIONS.join('|')}> <level>` }
];

function parseCoordinates(tokens: string[]): { x: number; y: number; z: number } | null {
	if (tokens.length !== 3) return null;
	const numbers = tokens.map(Number);
	if (numbers.some((n) => Number.isNaN(n))) return null;
	const [x, y, z] = numbers as [number, number, number];
	return { x, y, z };
}

/**
 * Parses the Helm station's terse command syntax (book Figure 3.16):
 *   F P O <object name>        — Fire Phaser at named Object
 *   F P C <x> <y> <z>          — Fire Phaser at Coordinates
 *   F T O <object name>        — Fire photon Torpedo at named Object
 *   F T C <x> <y> <z>          — Fire photon Torpedo at Coordinates
 *   S D <location> <level>     — Set Deflector shield level
 */
export function parseHelmCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const upper = trimmed.toUpperCase();

	if (upper.startsWith('F P O ')) {
		const name = trimmed.slice('F P O '.length).trim();
		if (!name) return { ok: false, reason: 'Usage: F P O <object name>' };
		return { ok: true, command: { module: 'helm', type: 'FirePhasers', target: { kind: 'object', name } } };
	}
	if (upper.startsWith('F P C ')) {
		const position = parseCoordinates(trimmed.slice('F P C '.length).trim().split(/\s+/));
		if (!position) return { ok: false, reason: 'Usage: F P C <x> <y> <z>' };
		return { ok: true, command: { module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position } } };
	}
	if (upper.startsWith('F T O ')) {
		const name = trimmed.slice('F T O '.length).trim();
		if (!name) return { ok: false, reason: 'Usage: F T O <object name>' };
		return { ok: true, command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name } } };
	}
	if (upper.startsWith('F T C ')) {
		const position = parseCoordinates(trimmed.slice('F T C '.length).trim().split(/\s+/));
		if (!position) return { ok: false, reason: 'Usage: F T C <x> <y> <z>' };
		return { ok: true, command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'coordinates', position } } };
	}
	if (upper.startsWith('S D ')) {
		const [locationText, levelText] = trimmed.slice('S D '.length).trim().split(/\s+/);
		const location = BANK_LOCATIONS.find((loc) => loc === locationText?.toLowerCase()) as BankLocation | undefined;
		const level = Number(levelText);
		if (!location || levelText === undefined || Number.isNaN(level)) {
			return { ok: false, reason: `Usage: S D <${BANK_LOCATIONS.join('|')}> <level>` };
		}
		return { ok: true, command: { module: 'helm', type: 'SetShieldLevel', location, level } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
