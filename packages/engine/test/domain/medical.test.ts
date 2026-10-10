import { describe, expect, it } from 'vitest';
import { createMedicalState, admitPatient, recoveredHealth, ICU_CAPACITY } from '../../src/domain/medical.js';

describe('createMedicalState', () => {
	it('starts with all ICU slots empty', () => {
		const state = createMedicalState();
		expect(state.icu).toHaveLength(ICU_CAPACITY);
		expect(state.icu.every((slot) => slot === null)).toBe(true);
	});
});

describe('admitPatient', () => {
	it('assigns the patient to the first empty ICU slot', () => {
		const result = admitPatient(createMedicalState(), { personnelId: 1 });
		if (!result.ok) throw new Error('expected admission to succeed');
		expect(result.state.icu[0]).toEqual({ personnelId: 1 });
	});

	it('fails when the ICU is at capacity', () => {
		let state = createMedicalState();
		for (let i = 0; i < ICU_CAPACITY; i++) {
			const result = admitPatient(state, { personnelId: i });
			if (!result.ok) throw new Error('expected admission to succeed while capacity remains');
			state = result.state;
		}
		const result = admitPatient(state, { personnelId: 999 });
		expect(result.ok).toBe(false);
	});
});

describe('recoveredHealth', () => {
	it('improves health when the ICU is fully functional', () => {
		expect(recoveredHealth(4, { icuFunctionalStatus: 100, deltaMs: 1000 })).toBeGreaterThan(4);
	});

	it('worsens health when the ICU is barely functional', () => {
		expect(recoveredHealth(4, { icuFunctionalStatus: 0, deltaMs: 1000 })).toBeLessThan(4);
	});

	it('holds health steady at 50% functional status', () => {
		expect(recoveredHealth(4, { icuFunctionalStatus: 50, deltaMs: 1000 })).toBe(4);
	});

	it('clamps health to the 0-10 range', () => {
		expect(recoveredHealth(0.1, { icuFunctionalStatus: 0, deltaMs: 100000 })).toBe(0);
		expect(recoveredHealth(9.9, { icuFunctionalStatus: 100, deltaMs: 100000 })).toBe(10);
	});
});
