import { describe, expect, it } from 'vitest';
import { groupIdForDevice, minimumOperationalEnergy, nominalMaximumEnergy, overdriveEnergyLimit } from '../../src/domain/device-groups.js';

describe('minimumOperationalEnergy', () => {
	it.each([
		['warpEngine-1', 100],
		['impulseEngine-3', 10],
		['intensiveCareUnit', 10],
		['medicalResearchLab', 10],
		['oxygenDistribution', 10],
		['waterDistribution', 10],
		['tractorBeam', 100],
		['navigationComputer', 30],
		['medicalComputer', 30],
		['shield-starboard', 100],
		['phaser-fore', 0],
		['torpedoTube-2', 0]
	])('requires %s to receive %i units', (deviceId, expectedMinimum) => {
		expect(minimumOperationalEnergy(deviceId)).toBe(expectedMinimum);
	});
});

describe('groupIdForDevice', () => {
	it.each([
		['phaser-fore', 'weapons'],
		['torpedoTube-3', 'weapons'],
		['shield-aft', 'shields'],
		['warpEngine-1', 'propulsion'],
		['commsComputer', 'computers'],
		['tractorBeam', 'lifeSupport']
	])('puts %s in the %s group', (deviceId, expectedGroup) => {
		expect(groupIdForDevice(deviceId)).toBe(expectedGroup);
	});
});

describe('nominalMaximumEnergy', () => {
	it.each([
		['phaser-fore', 1000],
		['torpedoTube-4', 100],
		['warpEngine-2', 1000],
		['impulseEngine-1', 500],
		['intensiveCareUnit', 20],
		['medicalResearchLab', 20],
		['oxygenDistribution', 20],
		['waterDistribution', 20],
		['tractorBeam', 1000],
		['sciencesComputer', 200],
		['shield-port', 1000]
	])('lets %s run continuously at %i units', (deviceId, expectedMaximum) => {
		expect(nominalMaximumEnergy(deviceId)).toBe(expectedMaximum);
	});

	it('refuses a device it has no maximum for', () => {
		expect(() => nominalMaximumEnergy('flux-capacitor')).toThrow();
	});
});

describe('overdriveEnergyLimit', () => {
	it.each([
		['phaser-fore', 1100],
		['torpedoTube-1', 110],
		['impulseEngine-1', 550],
		['oxygenDistribution', 22],
		['navigationComputer', 220]
	])('lets %s overdrive up to %d units', (deviceId, expectedLimit) => {
		expect(overdriveEnergyLimit(deviceId)).toBe(expectedLimit);
	});
});
