import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

describe('engineering commands', () => {
	it('SetEnergyAllocation assigns energy to a device, zero-sum across the rest', () => {
		const engine = createEngine();
		const totalEnergy = engine.getState().engineering.totalEnergy;
		engine.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'phaser-fore', amount: 100 });
		const devices = engine.getState().engineering.devices;
		expect(devices['phaser-fore']!.energyAssigned).toBe(100);
		const total = Object.values(devices).reduce((sum, d) => sum + d.energyAssigned, 0);
		expect(total).toBeCloseTo(totalEnergy);
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
		const shuttle = engine.getState().engineering.shuttlecraft.find((s) => s.id === 1);
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
