import type { Command, ShuttlecraftMission } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

const VALID_MISSIONS: ShuttlecraftMission[] = [
	'none',
	'deliverCargo',
	'seekSensorData',
	'transportPersonnel',
	'seekEnterprise'
];

/** Mirrors the book's Figure 3.13 "Engineering Commands" table. */
export const ENGINEERING_COMMANDS = [
	{ description: 'set Energy supply to Device', syntax: 'E D <device id> <amount>' },
	{ description: 'Set Shuttlecraft mission', syntax: `S S <shuttlecraft id> <${VALID_MISSIONS.join('|')}>` }
];

/**
 * Parses the Engineering station's terse command syntax (book Figure 3.13,
 * adapted to a typed `Command`):
 *   E D <device id> <amount>          — set Energy supply to Device
 *   S S <shuttlecraft id> <mission>   — Set Shuttlecraft mission
 */
export function parseEngineeringCommand(input: string): ParseResult {
	const tokens = input.trim().split(/\s+/);
	const [a, b, ...rest] = tokens;

	if (a?.toUpperCase() === 'E' && b?.toUpperCase() === 'D') {
		const [deviceId, amountText] = rest;
		const amount = Number(amountText);
		if (!deviceId || amountText === undefined || Number.isNaN(amount)) {
			return { ok: false, reason: 'Usage: E D <device id> <amount>' };
		}
		return { ok: true, command: { module: 'engineering', type: 'SetEnergyAllocation', deviceId, amount } };
	}

	if (a?.toUpperCase() === 'S' && b?.toUpperCase() === 'S') {
		const [idText, missionText] = rest;
		const shuttlecraftId = Number(idText);
		if (!idText || Number.isNaN(shuttlecraftId)) {
			return { ok: false, reason: 'Usage: S S <shuttlecraft id> <mission>' };
		}
		const mission = VALID_MISSIONS.find((m) => m.toLowerCase() === missionText?.toLowerCase());
		if (!mission) {
			return { ok: false, reason: `Unknown mission "${missionText}". Valid: ${VALID_MISSIONS.join(', ')}` };
		}
		return { ok: true, command: { module: 'engineering', type: 'SetShuttlecraftMission', shuttlecraftId, mission } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
