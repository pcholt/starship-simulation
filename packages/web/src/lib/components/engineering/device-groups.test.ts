import { describe, expect, it } from 'vitest';
import { deviceHealth, humanizeDeviceId, summarizeGroupEnergy } from './device-groups';

describe('humanizeDeviceId', () => {
	it.each([
		['phaser-fore', 'Phaser Fore'],
		['torpedoTube-3', 'Torpedo Tube 3'],
		['medicalResearchLab', 'Medical Research Lab']
	])('turns %s into %s', (deviceId, expectedLabel) => {
		expect(humanizeDeviceId(deviceId)).toBe(expectedLabel);
	});
});

describe('deviceHealth', () => {
	it('is ok when every reading is at least 90', () => {
		expect(deviceHealth({ functionalStatus: 100, operationalStatus: 95, reliabilityFactor: 90 })).toBe('ok');
	});

	it('is warning when the weakest reading is between 50 and 89', () => {
		expect(deviceHealth({ functionalStatus: 100, operationalStatus: 60, reliabilityFactor: 100 })).toBe('warning');
	});

	it('is critical when any reading is below 50', () => {
		expect(deviceHealth({ functionalStatus: 100, operationalStatus: 100, reliabilityFactor: 20 })).toBe('critical');
	});
});

describe('summarizeGroupEnergy', () => {
	const devices = [
		['phaser-fore', { energyAssigned: 100 }],
		['torpedoTube-1', { energyAssigned: 300 }],
		['shield-fore', { energyAssigned: 600 }]
	] as const;

	it('adds up the energy of the devices in each group', () => {
		const shares = summarizeGroupEnergy(devices, 1000);

		expect(shares.find((share) => share.group.id === 'weapons')!.energy).toBe(400);
	});

	it('expresses each group as a percentage of the total energy', () => {
		const shares = summarizeGroupEnergy(devices, 1000);

		expect(shares.find((share) => share.group.id === 'shields')!.percentOfTotal).toBe(60);
	});

	it('reports empty groups as zero', () => {
		const shares = summarizeGroupEnergy(devices, 1000);

		expect(shares.find((share) => share.group.id === 'propulsion')!.energy).toBe(0);
	});

	it('reports zero percent for every group when the total energy is zero', () => {
		const shares = summarizeGroupEnergy([], 0);

		expect(shares.every((share) => share.percentOfTotal === 0)).toBe(true);
	});
});
