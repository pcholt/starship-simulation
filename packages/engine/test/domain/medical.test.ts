import { describe, expect, it } from 'vitest';
import { createMedicalState, admitPatient, recoverPatient, ICU_CAPACITY } from '../../src/domain/medical.js';

describe('createMedicalState', () => {
	it('starts with all ICU slots empty', () => {
		const state = createMedicalState();
		expect(state.icu).toHaveLength(ICU_CAPACITY);
		expect(state.icu.every((slot) => slot === null)).toBe(true);
	});
});

describe('admitPatient', () => {
	it('assigns the patient to the first empty ICU slot', () => {
		const state = createMedicalState();
		const result = admitPatient(state, { personnelId: 1, name: 'Ensign Kim', health: 4 });
		if (!result.ok) throw new Error('expected admission to succeed');
		expect(result.state.icu[0]).toEqual({ personnelId: 1, name: 'Ensign Kim', health: 4 });
	});

	it('fails when the ICU is at capacity', () => {
		let state = createMedicalState();
		for (let i = 0; i < ICU_CAPACITY; i++) {
			const result = admitPatient(state, { personnelId: i, name: `Patient ${i}`, health: 5 });
			if (!result.ok) throw new Error('expected admission to succeed while capacity remains');
			state = result.state;
		}
		const result = admitPatient(state, { personnelId: 999, name: 'One Too Many', health: 5 });
		expect(result.ok).toBe(false);
	});
});

describe('recoverPatient', () => {
	it('improves health when the ICU is fully functional', () => {
		const patient = { personnelId: 1, name: 'Ensign Kim', health: 4 };
		const next = recoverPatient(patient, { icuFunctionalStatus: 100, deltaMs: 1000 });
		expect(next.health).toBeGreaterThan(4);
	});

	it('worsens health when the ICU is barely functional', () => {
		const patient = { personnelId: 1, name: 'Ensign Kim', health: 4 };
		const next = recoverPatient(patient, { icuFunctionalStatus: 0, deltaMs: 1000 });
		expect(next.health).toBeLessThan(4);
	});

	it('clamps health to the 0-10 range', () => {
		const nearlyDead = recoverPatient({ personnelId: 1, name: 'X', health: 0.1 }, { icuFunctionalStatus: 0, deltaMs: 100000 });
		expect(nearlyDead.health).toBe(0);
		const nearlyWell = recoverPatient({ personnelId: 1, name: 'X', health: 9.9 }, { icuFunctionalStatus: 100, deltaMs: 100000 });
		expect(nearlyWell.health).toBe(10);
	});
});
