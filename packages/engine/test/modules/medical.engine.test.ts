import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

describe('medical commands', () => {
	it('AdmitPatient places the patient in the first empty ICU slot', () => {
		const engine = createEngine();
		const result = engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 1, name: 'Ensign Kim', health: 4 });
		expect(result).toEqual({ ok: true });
		expect(engine.getState().medical.icu[0]).toEqual({ personnelId: 1, name: 'Ensign Kim', health: 4 });
	});

	it('AdmitPatient fails once the ICU is full', () => {
		const engine = createEngine();
		for (let i = 0; i < 4; i++) {
			engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: i, name: `P${i}`, health: 5 });
		}
		const result = engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 99, name: 'One Too Many', health: 5 });
		expect(result.ok).toBe(false);
	});
});

describe('medical recovery during tick', () => {
	it('does not change patient health while the medical module is halted', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 1, name: 'Ensign Kim', health: 4 });
		engine.tick(5000);
		expect(engine.getState().medical.icu[0]!.health).toBe(4);
	});

	it('improves patient health over time once the medical module is running (full ICU function by default)', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'medical' });
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 1, name: 'Ensign Kim', health: 4 });
		engine.tick(5000);
		expect(engine.getState().medical.icu[0]!.health).toBeGreaterThan(4);
	});

	it('discharges a patient from the ICU once fully recovered', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Execute', target: 'medical' });
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 1, name: 'Ensign Kim', health: 9.9 });
		engine.tick(60000);
		expect(engine.getState().medical.icu[0]).toBeNull();
	});
});
