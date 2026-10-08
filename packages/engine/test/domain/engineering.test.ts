import { describe, expect, it } from 'vitest';
import type { DeviceGroupId } from '../../src/domain/device-groups.js';
import { minimumOperationalEnergy, nominalMaximumEnergy, overdriveEnergyLimit } from '../../src/domain/device-groups.js';
import { createEngineeringState, allocateEnergy, allocateMinimumEnergyToGroup, allocateEnergyToDevices, totalWarpDriveEnergy, advanceEnergyLevels, setGroupLocked, DEVICE_IDS } from '../../src/domain/engineering.js';

describe('createEngineeringState', () => {
	it('creates one device entry per catalogued device id', () => {
		const state = createEngineeringState();
		expect(Object.keys(state.devices).sort()).toEqual([...DEVICE_IDS].sort());
	});

	it('starts with the whole energy pool shared out across the devices', () => {
		const state = createEngineeringState();
		const total = Object.values(state.devices).reduce((sum, d) => sum + d.energyAssigned, 0);
		expect(total).toBeCloseTo(state.totalEnergy);
	});

	it('starts no device above its nominal maximum', () => {
		const state = createEngineeringState();
		expect(state.devices['oxygenDistribution']!.energyAssigned).toBeCloseTo(20);
		expect(state.devices['navigationComputer']!.energyAssigned).toBeCloseTo(200);
		expect(state.devices['torpedoTube-1']!.energyAssigned).toBeCloseTo(100);
	});

	it('starts every device at or above its minimum operational energy', () => {
		const state = createEngineeringState();
		for (const id of DEVICE_IDS) expect(state.devices[id]!.energyAssigned).toBeGreaterThanOrEqual(minimumOperationalEnergy(id));
	});

	it('starts with requests equal to the energy each device is receiving', () => {
		const state = createEngineeringState();
		for (const id of DEVICE_IDS) expect(state.devices[id]!.energyRequested).toBe(state.devices[id]!.energyAssigned);
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
		expect(next.devices['phaser-fore']!.energyRequested).toBe(50);
	});

	it('keeps the total energy assigned across all devices constant (zero-sum)', () => {
		const state = createEngineeringState();
		const next = allocateEnergy(state, 'phaser-fore', 50);
		const total = Object.values(next.devices).reduce((sum, d) => sum + d.energyRequested, 0);
		expect(total).toBeCloseTo(state.totalEnergy);
	});

	it('clamps the requested amount to the device overdrive limit', () => {
		const state = createEngineeringState();
		const next = allocateEnergy(state, 'phaser-fore', state.totalEnergy);
		expect(next.devices['phaser-fore']!.energyRequested).toBeCloseTo(1100);
	});

	it('allows a request between the nominal maximum and the overdrive limit', () => {
		const next = allocateEnergy(createEngineeringState(), 'phaser-fore', 1050);
		expect(next.devices['phaser-fore']!.energyRequested).toBeCloseTo(1050);
	});

	it('never rebalances another device above its nominal maximum', () => {
		const next = allocateEnergy(createEngineeringState(), 'phaser-fore', 0);
		for (const id of DEVICE_IDS) expect(next.devices[id]!.energyRequested).toBeLessThanOrEqual(nominalMaximumEnergy(id) + 1e-9);
	});

	it('keeps an overdrive request that was made explicitly when another device is changed', () => {
		const overdriven = allocateEnergy(createEngineeringState(), 'warpEngine-1', 1100);

		const next = allocateEnergy(overdriven, 'phaser-fore', 0);

		expect(next.devices['warpEngine-1']!.energyRequested).toBeCloseTo(1100);
	});

	it('does not raise an overdriven device further when rebalancing frees up energy', () => {
		const overdriven = allocateEnergy(createEngineeringState(), 'warpEngine-1', 1100);

		const next = allocateEnergy(overdriven, 'phaser-fore', 0);

		expect(next.devices['warpEngine-1']!.energyRequested).toBeLessThanOrEqual(1100 + 1e-9);
	});

	it('leaves energy unassigned when the unlocked devices cannot absorb it', () => {
		const everyGroupButLifeSupportLocked = ['weapons', 'shields', 'propulsion', 'computers'].reduce(
			(state, group) => setGroupLocked(state, group as DeviceGroupId, true),
			createEngineeringState()
		);

		const next = allocateEnergy(everyGroupButLifeSupportLocked, 'tractorBeam', 0);

		const totalRequested = Object.values(next.devices).reduce((sum, d) => sum + d.energyRequested, 0);
		expect(totalRequested).toBeLessThan(next.totalEnergy);
	});

	it('keeps the other devices in the same proportion to each other when making room', () => {
		const base = createEngineeringState();
		const lopsided = allocateEnergy(allocateEnergy(base, 'shield-aft', 800), 'shield-port', 400);
		const before = lopsided.devices;

		const next = allocateEnergy(lopsided, 'phaser-fore', 100);

		const ratioBefore = before['shield-aft']!.energyRequested / before['shield-port']!.energyRequested;
		const ratioAfter = next.devices['shield-aft']!.energyRequested / next.devices['shield-port']!.energyRequested;
		expect(ratioAfter).toBeCloseTo(ratioBefore);
	});

	it('restores the other devices to their earlier relative positions after a device is lowered again', () => {
		const base = createEngineeringState();
		const lopsided = allocateEnergy(base, 'phaser-aft', 1000);

		const raised = allocateEnergy(lopsided, 'phaser-fore', 2000);
		const lowered = allocateEnergy(raised, 'phaser-fore', lopsided.devices['phaser-fore']!.energyRequested);

		expect(lowered.devices['phaser-aft']!.energyRequested).toBeCloseTo(lopsided.devices['phaser-aft']!.energyRequested);
	});

	it('shares the remaining energy equally when every other device has none', () => {
		const base = createEngineeringState();
		const othersAtZero = allocateEnergyToDevices(
			base,
			Object.fromEntries(DEVICE_IDS.map((id) => [id, id === 'phaser-fore' ? 1000 : 0]))
		);

		const next = allocateEnergy(othersAtZero, 'phaser-fore', 800);

		expect(next.devices['shield-fore']!.energyRequested).toBeCloseTo(next.devices['shield-aft']!.energyRequested);
		expect(next.devices['shield-fore']!.energyRequested).toBeGreaterThan(0);
	});
});

const sumOfLevels = (devices: Record<string, { energyAssigned: number }>) =>
	Object.values(devices).reduce((sum, device) => sum + device.energyAssigned, 0);

describe('allocateEnergy rebalancing across groups', () => {
	it('leaves the other devices in the same group as the changed device untouched', () => {
		const base = createEngineeringState();

		const next = allocateEnergy(base, 'phaser-fore', 900);

		for (const id of ['phaser-aft', 'phaser-port', 'phaser-starboard', 'torpedoTube-1']) {
			expect(next.devices[id]!.energyRequested).toBeCloseTo(base.devices[id]!.energyRequested);
		}
	});

	it('takes the energy for an increase from the unlocked devices in other groups', () => {
		const base = createEngineeringState();

		const next = allocateEnergy(base, 'phaser-fore', 900);

		expect(next.devices['shield-fore']!.energyRequested).toBeLessThan(base.devices['shield-fore']!.energyRequested);
	});

	it('takes nothing from a locked group when it raises a device', () => {
		const locked = setGroupLocked(createEngineeringState(), 'shields', true);

		const next = allocateEnergy(locked, 'phaser-fore', 900);

		expect(next.devices['shield-fore']!.energyRequested).toBeCloseTo(locked.devices['shield-fore']!.energyRequested);
		expect(next.devices['warpEngine-1']!.energyRequested).toBeLessThan(locked.devices['warpEngine-1']!.energyRequested);
	});

	it('caps an increase at the energy the other groups can give up', () => {
		const everyOtherGroupLocked = ['shields', 'propulsion', 'computers', 'lifeSupport'].reduce(
			(state, group) => setGroupLocked(state, group as DeviceGroupId, true),
			createEngineeringState()
		);
		const energyHeldElsewhere = Object.entries(everyOtherGroupLocked.devices)
			.filter(([id]) => !/^(phaser|torpedoTube)-/.test(id))
			.reduce((sum, [, device]) => sum + device.energyRequested, 0);
		const weaponsOtherThanFore = ['phaser-aft', 'phaser-port', 'phaser-starboard', 'torpedoTube-1', 'torpedoTube-2', 'torpedoTube-3', 'torpedoTube-4', 'torpedoTube-5', 'torpedoTube-6']
			.reduce((sum, id) => sum + everyOtherGroupLocked.devices[id]!.energyRequested, 0);

		const next = allocateEnergy(everyOtherGroupLocked, 'phaser-fore', 1100);

		const expectedCap = everyOtherGroupLocked.totalEnergy - energyHeldElsewhere - weaponsOtherThanFore;
		expect(next.devices['phaser-fore']!.energyRequested).toBeCloseTo(Math.min(1100, expectedCap));
	});

	it('gives energy released by lowering a device to other groups, not to the rest of its own group', () => {
		const base = createEngineeringState();

		const next = allocateEnergy(base, 'phaser-fore', 0);

		expect(next.devices['phaser-aft']!.energyRequested).toBeCloseTo(base.devices['phaser-aft']!.energyRequested);
		expect(next.devices['shield-fore']!.energyRequested).toBeGreaterThan(base.devices['shield-fore']!.energyRequested - 1e-9);
	});
});

describe('allocateEnergy with locked groups', () => {
	it('leaves the requests of devices in a locked group unchanged', () => {
		const locked = setGroupLocked(createEngineeringState(), 'shields', true);

		const next = allocateEnergy(locked, 'phaser-fore', 1000);

		expect(next.devices['shield-fore']!.energyRequested).toBeCloseTo(locked.devices['shield-fore']!.energyRequested);
	});

	it('still keeps the total requested energy at the pool size when a group is locked', () => {
		const locked = setGroupLocked(createEngineeringState(), 'shields', true);

		const next = allocateEnergy(locked, 'phaser-fore', 1000);

		const totalRequested = Object.values(next.devices).reduce((sum, d) => sum + d.energyRequested, 0);
		expect(totalRequested).toBeCloseTo(locked.totalEnergy);
	});

	it('caps a request at the energy the locked groups leave free', () => {
		const heavy = allocateEnergyToDevices(createEngineeringState(), {
			'shield-fore': 1100,
			'shield-aft': 1100,
			'shield-port': 1100,
			'shield-starboard': 1100,
			'warpEngine-1': 1100,
			'warpEngine-2': 1100
		});
		const locked = setGroupLocked(setGroupLocked(heavy, 'shields', true), 'propulsion', true);
		const lockedEnergy = [...DEVICE_IDS.filter((id) => /^(shield|warpEngine|impulseEngine)/.test(id))].reduce(
			(sum, id) => sum + locked.devices[id]!.energyRequested,
			0
		);

		const next = allocateEnergy(locked, 'phaser-fore', 1100);

		expect(next.devices['phaser-fore']!.energyRequested).toBeCloseTo(Math.min(1100, locked.totalEnergy - lockedEnergy));
		expect(lockedEnergy).toBeGreaterThan(4900);
	});

	it('unlocking a group lets other changes adjust it again', () => {
		const relocked = setGroupLocked(setGroupLocked(createEngineeringState(), 'shields', true), 'shields', false);

		const next = allocateEnergy(relocked, 'phaser-fore', 1000);

		expect(next.devices['shield-fore']!.energyRequested).not.toBeCloseTo(relocked.devices['shield-fore']!.energyRequested);
	});
});

describe('setGroupLocked', () => {
	it('records a locked group once even if it is locked twice', () => {
		const locked = setGroupLocked(setGroupLocked(createEngineeringState(), 'weapons', true), 'weapons', true);

		expect(locked.lockedGroups).toEqual(['weapons']);
	});
});

describe('advanceEnergyLevels', () => {
	it('raises a device toward its request no faster than its group allows per second', () => {
		const requested = allocateEnergy(createEngineeringState(), 'phaser-fore', 3000);
		const start = requested.devices['phaser-fore']!.energyAssigned;

		const next = advanceEnergyLevels(requested, 1000);

		expect(next.devices['phaser-fore']!.energyAssigned).toBeCloseTo(start + 300);
	});

	it('lowers a device toward its request no faster than its group allows per second', () => {
		const requested = createEngineeringState();
		const lowered = { ...requested, devices: { ...requested.devices, tractorBeam: { ...requested.devices['tractorBeam']!, energyRequested: 0 } } };
		const start = lowered.devices['tractorBeam']!.energyAssigned;

		const next = advanceEnergyLevels(lowered, 1000);

		expect(next.devices['tractorBeam']!.energyAssigned).toBeCloseTo(start - 100);
	});

	it('does not overshoot the request', () => {
		const requested = allocateEnergy(createEngineeringState(), 'phaser-fore', 250);

		const next = advanceEnergyLevels(requested, 60_000);

		expect(next.devices['phaser-fore']!.energyAssigned).toBeCloseTo(250);
	});

	it('never lets the energy in use exceed the pool while reductions lag behind increases', () => {
		const requested = allocateEnergy(createEngineeringState(), 'warpEngine-1', 3000);

		const next = advanceEnergyLevels(requested, 1000);

		expect(sumOfLevels(next.devices)).toBeLessThanOrEqual(requested.totalEnergy + 1e-6);
	});

	it('reports energy that is not being drawn as radiated', () => {
		const initial = createEngineeringState();
		const shieldReleased = {
			...initial,
			devices: { ...initial.devices, 'shield-fore': { ...initial.devices['shield-fore']!, energyRequested: 0 } }
		};

		const next = advanceEnergyLevels(shieldReleased, 1000);

		expect(next.radiatedEnergy).toBeCloseTo(next.totalEnergy - sumOfLevels(next.devices));
		expect(next.radiatedEnergy).toBeGreaterThan(0);
	});

	it('settles at the full pool in use once every request has been reached', () => {
		const requested = allocateEnergy(createEngineeringState(), 'phaser-fore', 1000);

		const next = advanceEnergyLevels(requested, 120_000);

		expect(next.radiatedEnergy).toBeCloseTo(0);
	});
});

describe('allocateMinimumEnergyToGroup', () => {
	it('requests exactly 100 units for each shield', () => {
		const next = allocateMinimumEnergyToGroup(createEngineeringState(), 'shields');

		for (const id of ['shield-fore', 'shield-aft', 'shield-port', 'shield-starboard']) {
			expect(next.devices[id]!.energyRequested).toBeCloseTo(100);
		}
	});

	it('requests each device in a mixed group at its own minimum', () => {
		const next = allocateMinimumEnergyToGroup(createEngineeringState(), 'lifeSupport');

		expect(next.devices['tractorBeam']!.energyRequested).toBeCloseTo(100);
		expect(next.devices['oxygenDistribution']!.energyRequested).toBeCloseTo(10);
	});

	it('keeps the total requested energy at the pool size by giving the rest to other groups', () => {
		const next = allocateMinimumEnergyToGroup(createEngineeringState(), 'shields');

		const totalRequested = Object.values(next.devices).reduce((sum, d) => sum + d.energyRequested, 0);
		expect(totalRequested).toBeCloseTo(next.totalEnergy);
	});

	it('does not change the requests of other locked groups', () => {
		const locked = setGroupLocked(createEngineeringState(), 'weapons', true);

		const next = allocateMinimumEnergyToGroup(locked, 'shields');

		expect(next.devices['phaser-fore']!.energyRequested).toBeCloseTo(locked.devices['phaser-fore']!.energyRequested);
	});
});

describe('advanceEnergyLevels settling', () => {
	it('lands exactly on the requested energy after repeated small steps, with no floating-point shortfall', () => {
		let state = allocateEnergy(createEngineeringState(), 'shield-fore', 0);
		for (let step = 0; step < 400; step++) state = advanceEnergyLevels(state, 100);
		state = allocateMinimumEnergyToGroup(state, 'shields');

		for (let step = 0; step < 1200; step++) state = advanceEnergyLevels(state, 100);

		for (const id of ['shield-fore', 'shield-aft', 'shield-port', 'shield-starboard']) {
			expect(state.devices[id]!.energyAssigned).toBeGreaterThanOrEqual(100);
		}
	});
});

describe('totalWarpDriveEnergy', () => {
	it('adds together the energy both warp engines are receiving', () => {
		const state = createEngineeringState();

		expect(totalWarpDriveEnergy(state.devices)).toBeCloseTo(state.devices['warpEngine-1']!.energyAssigned + state.devices['warpEngine-2']!.energyAssigned);
	});

	it('ignores every device that is not a warp engine', () => {
		expect(totalWarpDriveEnergy({ 'warpEngine-1': { energyAssigned: 100 }, 'impulseEngine-1': { energyAssigned: 999 } })).toBe(100);
	});
});
