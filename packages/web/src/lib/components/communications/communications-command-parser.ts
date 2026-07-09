import type { Command, ShipStation } from '@starship/engine';
import { SHIP_STATIONS } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

function parseDestination(text: string): ShipStation | null {
	const station = SHIP_STATIONS.find((s) => s.toLowerCase() === text.trim().toLowerCase());
	return station ?? null;
}

/** Mirrors the book's Figure 3.4 "Communications Commands" table. */
export const COMMUNICATIONS_COMMANDS = [
	{ description: 'Display next Message', syntax: 'DM' },
	{ description: 'Send Distress message', syntax: 'SD' },
	{ description: 'Request Personnel movement', syntax: 'RP <personnel name>, <ship station>' },
	{ description: 'Request Cargo movement', syntax: 'RC <cargo type>, <ship station>' },
	{ description: 'Request Aid', syntax: 'RA <federation craft name>' },
	{ description: 'Send Peace Offer to enemy craft', syntax: 'SPO <craft name>' },
	{ description: 'Accept Peace Offer from enemy craft', syntax: 'APO <craft name>' },
	{ description: 'Reject Peace Offer from enemy craft', syntax: 'RPO <craft name>' }
];

/**
 * Parses the Communications station's terse command syntax (book Figure 3.4,
 * with the command code as a single token rather than space-separated
 * letters — e.g. `RPO` rather than `R P O`):
 *   DM                              — Display next Message
 *   SD                              — Send Distress message
 *   RP <personnel name>, <station>  — Request Personnel movement
 *   RC <cargo type>, <station>      — Request Cargo movement
 *   RA <federation craft name>      — Request Aid
 *   SPO <craft name>                — Send Peace Offer to enemy craft
 *   APO <craft name>                — Accept Peace Offer from enemy craft
 *   RPO <craft name>                — Reject Peace Offer from enemy craft
 *
 * The command code is matched as one exact token, so `RP` and `RPO` never collide.
 */
export function parseCommunicationsCommand(input: string): ParseResult {
	const trimmed = input.trim();
	const firstSpace = trimmed.search(/\s/);
	const code = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toUpperCase();
	const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();

	if (code === 'DM') return { ok: true, command: { module: 'communications', type: 'DisplayNextMessage' } };
	if (code === 'SD') return { ok: true, command: { module: 'communications', type: 'SendDistressMessage' } };

	if (code === 'RPO') {
		if (!rest) return { ok: false, reason: 'Usage: RPO <craft name>' };
		return { ok: true, command: { module: 'communications', type: 'RejectPeaceOffer', craftName: rest } };
	}
	if (code === 'SPO') {
		if (!rest) return { ok: false, reason: 'Usage: SPO <craft name>' };
		return { ok: true, command: { module: 'communications', type: 'SendPeaceOffer', craftName: rest } };
	}
	if (code === 'APO') {
		if (!rest) return { ok: false, reason: 'Usage: APO <craft name>' };
		return { ok: true, command: { module: 'communications', type: 'AcceptPeaceOffer', craftName: rest } };
	}
	if (code === 'RP') {
		const [personnelName, stationText] = rest.split(',');
		const station = stationText ? parseDestination(stationText) : null;
		if (!personnelName?.trim() || !station) {
			return { ok: false, reason: `Usage: RP <personnel name>, <${SHIP_STATIONS.join('|')}>` };
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
	if (code === 'RC') {
		const [cargoType, stationText] = rest.split(',');
		const station = stationText ? parseDestination(stationText) : null;
		if (!cargoType?.trim() || !station) {
			return { ok: false, reason: `Usage: RC <cargo type>, <${SHIP_STATIONS.join('|')}>` };
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
	if (code === 'RA') {
		if (!rest) return { ok: false, reason: 'Usage: RA <federation craft name>' };
		return { ok: true, command: { module: 'communications', type: 'RequestAid', federationCraftName: rest } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
