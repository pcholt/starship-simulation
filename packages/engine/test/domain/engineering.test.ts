import { describe, expect, it } from 'vitest';
import { createEngineeringState, allocateEnergy, DEVICE_IDS } from '../../src/domain/engineering.js';

describe('createEngineeringState', () => {
	it('creates one device entry per catalogued device id', () => {
		const state = createEngineeringState();
		expect(Object.keys(state.devices).sort()).toEqual([...DEVICE_IDS].sort());
	});

	it('splits total energy equally across all devices to start', () => {
		const state = createEngineeringState();
		const shares = Object.values(state.devices).map((d) => d.energyAssigned);
		const expectedShare = state.totalEnergy / DEVICE_IDS.length;
		for (const share of shares) expect(share).toBeCloseTo(expectedShare);
	});

	it('creates six shuttlecraft, all with no mission assigned', () => {
		const state = createEngineeringState();
		expect(state.shuttlecraft).toHaveLength(6);
		for (const shuttle of state.shuttlecraft) expect(shuttle.mission).toBe('none');
	});
});

describe('allocateEnergy', () => {
	it('assigns the requested amount to the target device', () => {
		const state = createEngineeringState();
		const next = allocateEnergy(state, 'phaser-fore', 50);
		expect(next.devices['phaser-fore']!.energyAssigned).toBe(50);
	});

	it('keeps the total energy assigned across all devices constant (zero-sum)', () => {
		const state = createEngineeringState();
		const next = allocateEnergy(state, 'phaser-fore', 50);
		const total = Object.values(next.devices).reduce((sum, d) => sum + d.energyAssigned, 0);
		expect(total).toBeCloseTo(state.totalEnergy);
	});

	it('reduces every other device equally to make room', () => {
		const state = createEngineeringState();
		const next = allocateEnergy(state, 'phaser-fore', state.totalEnergy);
		const others = Object.entries(next.devices).filter(([id]) => id !== 'phaser-fore');
		for (const [, device] of others) expect(device.energyAssigned).toBeCloseTo(0);
	});

	it('clamps the requested amount to the total energy pool', () => {
		const state = createEngineeringState();
		const next = allocateEnergy(state, 'phaser-fore', state.totalEnergy * 10);
		expect(next.devices['phaser-fore']!.energyAssigned).toBeCloseTo(state.totalEnergy);
	});
});
