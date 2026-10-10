import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

describe('engineering commands', () => {
	it('SetEnergyAllocation assigns energy to a device, zero-sum across the rest', () => {
		const engine = createEngine();
		const totalEnergy = engine.getState().engineering.totalEnergy;
		engine.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-fore', amount: 100 });
		const devices = engine.getState().engineering.devices;
		expect(devices['phaser-fore']!.energyRequested).toBe(100);
		const total = Object.values(devices).reduce((sum, d) => sum + d.energyRequested, 0);
		expect(total).toBeCloseTo(totalEnergy);
	});

	it('SetEnergyAllocation does not change the energy a device is receiving until time passes', () => {
		const engine = createEngine();
		const before = engine.getState().engineering.devices['phaser-fore']!.energyAssigned;
		engine.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-fore', amount: 2000 });

		expect(engine.getState().engineering.devices['phaser-fore']!.energyAssigned).toBe(before);
	});

	it('ticking moves the energy a device is receiving toward its request at the group rate', () => {
		const engine = createEngine();
		const before = engine.getState().engineering.devices['phaser-fore']!.energyAssigned;
		engine.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-fore', amount: 2000 });

		engine.tick(1000);

		expect(engine.getState().engineering.devices['phaser-fore']!.energyAssigned).toBeCloseTo(before + 300);
	});

	it('SetEnergyGroupLocked locks a group so later allocations leave it alone', () => {
		const engine = createEngine();
		const shieldBefore = engine.getState().engineering.devices['shield-fore']!.energyRequested;
		engine.dispatch({ module: 'engineering', type: 'SetEnergyGroupLocked', group: 'shields', locked: true });

		engine.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-fore', amount: 2000 });

		expect(engine.getState().engineering.devices['shield-fore']!.energyRequested).toBeCloseTo(shieldBefore);
	});

	it('SetShuttlecraftMission assigns a mission and destination to a shuttlecraft', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'engineering',
			type: 'SetShuttlecraftMission',
			shuttlecraftId: 1,
			mission: 'seekSensorData',
			destination: { kind: 'celestialObject', id: 1 }
		});
		const shuttle = engine.getState().shuttlecraft.find((s) => s.id === 1);
		expect(shuttle).toMatchObject({ mission: 'seekSensorData', destination: { kind: 'celestialObject', id: 1 } });
	});

	it('SetShuttlecraftMission fails with a reason for an unknown shuttlecraft id', () => {
		const engine = createEngine();
		const result = engine.dispatch({
			module: 'engineering',
			type: 'SetShuttlecraftMission',
			shuttlecraftId: 999,
			mission: 'seekEnterprise'
		});
		expect(result).toEqual({ ok: false, reason: 'No shuttlecraft numbered 999' });
	});
});
