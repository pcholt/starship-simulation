import { describe, expect, it } from 'vitest';
import { createDeviceStatus, repairDevice, damageDevice } from '../../src/domain/device.js';

describe('createDeviceStatus', () => {
	it('defaults to fully functional, fully operational, perfectly reliable, and no energy assigned', () => {
		expect(createDeviceStatus()).toEqual({
			functionalStatus: 100,
			operationalStatus: 100,
			reliabilityFactor: 100,
			energyAssigned: 0
		});
	});

	it('accepts overrides for specific fields', () => {
		expect(createDeviceStatus({ functionalStatus: 40 })).toMatchObject({ functionalStatus: 40 });
	});
});

describe('damageDevice', () => {
	it('reduces functional status by the given amount', () => {
		const device = createDeviceStatus();
		expect(damageDevice(device, 30).functionalStatus).toBe(70);
	});

	it('does not reduce functional status below 0', () => {
		const device = createDeviceStatus({ functionalStatus: 10 });
		expect(damageDevice(device, 30).functionalStatus).toBe(0);
	});
});

describe('repairDevice', () => {
	it('increases functional status in proportion to energy assigned and reliability', () => {
		const device = createDeviceStatus({ functionalStatus: 50, energyAssigned: 10, reliabilityFactor: 100 });
		const repaired = repairDevice(device, { repairRatePerEnergyUnit: 1 });
		expect(repaired.functionalStatus).toBeGreaterThan(50);
	});

	it('does not increase functional status above 100', () => {
		const device = createDeviceStatus({ functionalStatus: 95, energyAssigned: 100, reliabilityFactor: 100 });
		const repaired = repairDevice(device, { repairRatePerEnergyUnit: 1 });
		expect(repaired.functionalStatus).toBe(100);
	});

	it('repairs more slowly when reliability is lower', () => {
		const reliable = repairDevice(createDeviceStatus({ functionalStatus: 50, energyAssigned: 10, reliabilityFactor: 100 }), {
			repairRatePerEnergyUnit: 1
		});
		const unreliable = repairDevice(createDeviceStatus({ functionalStatus: 50, energyAssigned: 10, reliabilityFactor: 20 }), {
			repairRatePerEnergyUnit: 1
		});
		expect(unreliable.functionalStatus).toBeLessThan(reliable.functionalStatus);
	});
});
