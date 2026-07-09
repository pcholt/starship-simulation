import { describe, expect, it } from 'vitest';
import { parseEngineeringCommand } from './engineering-command-parser.js';

describe('parseEngineeringCommand', () => {
	it('parses "E D <deviceId> <amount>" into a SetEnergyAllocation command', () => {
		expect(parseEngineeringCommand('E D phaser-1 500')).toEqual({
			ok: true,
			command: { module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-1', amount: 500 }
		});
	});

	it('parses "S S <shuttlecraftId> <mission>" into a SetShuttlecraftMission command', () => {
		expect(parseEngineeringCommand('S S 1 seekSensorData')).toEqual({
			ok: true,
			command: { module: 'engineering', type: 'SetShuttlecraftMission', shuttlecraftId: 1, mission: 'seekSensorData' }
		});
	});

	it('rejects an unrecognized shuttlecraft mission', () => {
		expect(parseEngineeringCommand('S S 1 doBarrelRolls').ok).toBe(false);
	});

	it('rejects a non-numeric energy amount', () => {
		expect(parseEngineeringCommand('E D phaser-1 lots').ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseEngineeringCommand('BOGUS').ok).toBe(false);
	});
});
