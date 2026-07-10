import type { Command, ShuttlecraftMission } from '@starship/engine';

export type ParseResult = { ok: true; command: Command } | { ok: false; reason: string };

export const VALID_MISSIONS: ShuttlecraftMission[] = [
	'none',
	'deliverCargo',
	'seekSensorData',
	'transportPersonnel',
	'seekEnterprise'
];

/** Mirrors the book's Figure 3.13 "Engineering Commands" table. */
export const ENGINEERING_COMMANDS = [
	{ description: 'set Energy supply to Device', syntax: 'ED <device id> <amount>' },
	{ description: 'Set Shuttlecraft mission', syntax: `SS <shuttlecraft id> <${VALID_MISSIONS.join('|')}>` }
];

/**
 * Parses the Engineering station's terse command syntax (book Figure 3.13,
 * adapted to a typed `Command`, with the command code as a single token
 * rather than space-separated letters):
 *   ED <device id> <amount>          — set Energy supply to Device
 *   SS <shuttlecraft id> <mission>   — Set Shuttlecraft mission
 */
export function parseEngineeringCommand(input: string): ParseResult {
	const [code, ...rest] = input.trim().split(/\s+/);

	if (code?.toUpperCase() === 'ED') {
		const [deviceId, amountText] = rest;
		const amount = Number(amountText);
		if (!deviceId || amountText === undefined || Number.isNaN(amount)) {
			return { ok: false, reason: 'Usage: ED <device id> <amount>' };
		}
		return { ok: true, command: { module: 'engineering', type: 'SetEnergyAllocation', deviceId, amount } };
	}

	if (code?.toUpperCase() === 'SS') {
		const [idText, missionText] = rest;
		const shuttlecraftId = Number(idText);
		if (!idText || Number.isNaN(shuttlecraftId)) {
			return { ok: false, reason: 'Usage: SS <shuttlecraft id> <mission>' };
		}
		const mission = VALID_MISSIONS.find((m) => m.toLowerCase() === missionText?.toLowerCase());
		if (!mission) {
			return { ok: false, reason: `Unknown mission "${missionText}". Valid: ${VALID_MISSIONS.join(', ')}` };
		}
		return { ok: true, command: { module: 'engineering', type: 'SetShuttlecraftMission', shuttlecraftId, mission } };
	}

	return { ok: false, reason: `Unrecognized command: ${input}` };
}
