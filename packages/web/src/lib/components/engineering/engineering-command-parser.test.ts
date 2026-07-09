import { describe, expect, it } from 'vitest';
import { parseEngineeringCommand } from './engineering-command-parser.js';

describe('parseEngineeringCommand', () => {
	it('parses "ED <deviceId> <amount>" into a SetEnergyAllocation command', () => {
		expect(parseEngineeringCommand('ED phaser-fore 500')).toEqual({
			ok: true,
			command: { module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-fore', amount: 500 }
		});
	});

	it('parses "SS <shuttlecraftId> <mission>" into a SetShuttlecraftMission command', () => {
		expect(parseEngineeringCommand('SS 1 seekSensorData')).toEqual({
			ok: true,
			command: { module: 'engineering', type: 'SetShuttlecraftMission', shuttlecraftId: 1, mission: 'seekSensorData' }
		});
	});

	it('rejects an unrecognized shuttlecraft mission', () => {
		expect(parseEngineeringCommand('SS 1 doBarrelRolls').ok).toBe(false);
	});

	it('rejects a non-numeric energy amount', () => {
		expect(parseEngineeringCommand('ED phaser-fore lots').ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseEngineeringCommand('BOGUS').ok).toBe(false);
	});
});
