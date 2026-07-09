import type { Command, ShipStation } from '@starship/engine';
import { SHIP_STATIONS } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

function parseDestination(text: string): ShipStation | null {
	const station = SHIP_STATIONS.find((s) => s.toLowerCase() === text.trim().toLowerCase());
	return station ?? null;
}

/** Mirrors the book's Figure 3.4 "Communications Commands" table. */
export const COMMUNICATIONS_COMMANDS = [
	{ description: 'Display next Message', syntax: 'D M' },
	{ description: 'Send Distress message', syntax: 'S D' },
	{ description: 'Request Personnel movement', syntax: 'R P <personnel name>, <ship station>' },
	{ description: 'Request Cargo movement', syntax: 'R C <cargo type>, <ship station>' },
	{ description: 'Request Aid', syntax: 'R A <federation craft name>' },
	{ description: 'Send Peace Offer to enemy craft', syntax: 'S P O <craft name>' },
	{ description: 'Accept Peace Offer from enemy craft', syntax: 'A P O <craft name>' },
	{ description: 'Reject Peace Offer from enemy craft', syntax: 'R P O <craft name>' }
];

/**
 * Parses the Communications station's terse command syntax (book Figure 3.4):
 *   D M                              — Display next Message
 *   S D                              — Send Distress message
 *   R P <personnel name>, <station>  — Request Personnel movement
 *   R C <cargo type>, <station>      — Request Cargo movement
 *   R A <federation craft name>      — Request Aid
 *   S P O <craft name>               — Send Peace Offer to enemy craft
 *   A P O <craft name>               — Accept Peace Offer from enemy craft
 *   R P O <craft name>               — Reject Peace Offer from enemy craft
 *
 * Checked in order from most to least specific, since several commands share a leading token.
 */
export function parseCommunicationsCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const upper = trimmed.toUpperCase();

	if (upper === 'D M') return { ok: true, command: { module: 'communications', type: 'DisplayNextMessage' } };
	if (upper === 'S D') return { ok: true, command: { module: 'communications', type: 'SendDistressMessage' } };

	if (upper.startsWith('R P O ')) {
		const craftName = trimmed.slice('R P O '.length).trim();
		if (!craftName) return { ok: false, reason: 'Usage: R P O <craft name>' };
		return { ok: true, command: { module: 'communications', type: 'RejectPeaceOffer', craftName } };
	}
	if (upper.startsWith('S P O ')) {
		const craftName = trimmed.slice('S P O '.length).trim();
		if (!craftName) return { ok: false, reason: 'Usage: S P O <craft name>' };
		return { ok: true, command: { module: 'communications', type: 'SendPeaceOffer', craftName } };
	}
	if (upper.startsWith('A P O ')) {
		const craftName = trimmed.slice('A P O '.length).trim();
		if (!craftName) return { ok: false, reason: 'Usage: A P O <craft name>' };
		return { ok: true, command: { module: 'communications', type: 'AcceptPeaceOffer', craftName } };
	}
	if (upper.startsWith('R P ')) {
		const [personnelName, stationText] = trimmed.slice('R P '.length).split(',');
		const station = stationText ? parseDestination(stationText) : null;
		if (!personnelName?.trim() || !station) {
			return { ok: false, reason: `Usage: R P <personnel name>, <${SHIP_STATIONS.join('|')}>` };
		}
		return {
			ok: true,
			command: {
				module: 'communications',
				type: 'RequestPersonnelMovement',
				personnelName: personnelName.trim(),
				destination: { kind: 'shipStation', station }
			}
		};
	}
	if (upper.startsWith('R C ')) {
		const [cargoType, stationText] = trimmed.slice('R C '.length).split(',');
		const station = stationText ? parseDestination(stationText) : null;
		if (!cargoType?.trim() || !station) {
			return { ok: false, reason: `Usage: R C <cargo type>, <${SHIP_STATIONS.join('|')}>` };
		}
		return {
			ok: true,
			command: {
				module: 'communications',
				type: 'RequestCargoMovement',
				cargoType: cargoType.trim(),
				destination: { kind: 'shipStation', station }
			}
		};
	}
	if (upper.startsWith('R A ')) {
		const federationCraftName = trimmed.slice('R A '.length).trim();
		if (!federationCraftName) return { ok: false, reason: 'Usage: R A <federation craft name>' };
		return { ok: true, command: { module: 'communications', type: 'RequestAid', federationCraftName } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
