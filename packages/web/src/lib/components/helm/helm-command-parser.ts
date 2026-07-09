import type { BankLocation, Command } from '@starship/engine';
import { BANK_LOCATIONS } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

/** Mirrors the book's Figure 3.16 "Helm Commands" table. */
export const HELM_COMMANDS = [
	{ description: 'Fire Phaser at named Object', syntax: 'FPO <object name>' },
	{ description: 'Fire Phaser at Coordinates', syntax: 'FPC <x> <y> <z>' },
	{ description: 'Fire photon Torpedo at named Object', syntax: 'FTO <object name>' },
	{ description: 'Fire photon Torpedo at Coordinates', syntax: 'FTC <x> <y> <z>' },
	{ description: 'Set Deflector shield level', syntax: `SD <${BANK_LOCATIONS.join('|')}> <level>` }
];

function parseCoordinates(tokens: string[]): { x: number; y: number; z: number } | null {
	if (tokens.length !== 3) return null;
	const numbers = tokens.map(Number);
	if (numbers.some((n) => Number.isNaN(n))) return null;
	const [x, y, z] = numbers as [number, number, number];
	return { x, y, z };
}

/**
 * Parses the Helm station's terse command syntax (book Figure 3.16, with the
 * command code as a single token rather than space-separated letters):
 *   FPO <object name>        — Fire Phaser at named Object
 *   FPC <x> <y> <z>          — Fire Phaser at Coordinates
 *   FTO <object name>        — Fire photon Torpedo at named Object
 *   FTC <x> <y> <z>          — Fire photon Torpedo at Coordinates
 *   SD <location> <level>    — Set Deflector shield level
 */
export function parseHelmCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const upper = trimmed.toUpperCase();

	if (upper.startsWith('FPO ')) {
		const name = trimmed.slice('FPO '.length).trim();
		if (!name) return { ok: false, reason: 'Usage: FPO <object name>' };
		return { ok: true, command: { module: 'helm', type: 'FirePhasers', target: { kind: 'object', name } } };
	}
	if (upper.startsWith('FPC ')) {
		const position = parseCoordinates(trimmed.slice('FPC '.length).trim().split(/\s+/));
		if (!position) return { ok: false, reason: 'Usage: FPC <x> <y> <z>' };
		return { ok: true, command: { module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position } } };
	}
	if (upper.startsWith('FTO ')) {
		const name = trimmed.slice('FTO '.length).trim();
		if (!name) return { ok: false, reason: 'Usage: FTO <object name>' };
		return { ok: true, command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name } } };
	}
	if (upper.startsWith('FTC ')) {
		const position = parseCoordinates(trimmed.slice('FTC '.length).trim().split(/\s+/));
		if (!position) return { ok: false, reason: 'Usage: FTC <x> <y> <z>' };
		return { ok: true, command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'coordinates', position } } };
	}
	if (upper.startsWith('SD ')) {
		const [locationText, levelText] = trimmed.slice('SD '.length).trim().split(/\s+/);
		const location = BANK_LOCATIONS.find((loc) => loc === locationText?.toLowerCase()) as BankLocation | undefined;
		const level = Number(levelText);
		if (!location || levelText === undefined || Number.isNaN(level)) {
			return { ok: false, reason: `Usage: SD <${BANK_LOCATIONS.join('|')}> <level>` };
		}
		return { ok: true, command: { module: 'helm', type: 'SetShieldLevel', location, level } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
