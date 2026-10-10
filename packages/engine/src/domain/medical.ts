export interface Patient {
	personnelId: number;
}

export const ICU_CAPACITY = 4;

export interface MedicalState {
	icu: (Patient | null)[];
}

export function createMedicalState(): MedicalState {
	return { icu: Array.from({ length: ICU_CAPACITY }, () => null) };
}

export type AdmitResult = { ok: true; state: MedicalState } | { ok: false; reason: string };

export function admitPatient(state: MedicalState, patient: Patient): AdmitResult {
	const slotIndex = state.icu.findIndex((slot) => slot === null);
	if (slotIndex === -1) return { ok: false, reason: 'Intensive Care Unit is at capacity' };
	const icu = [...state.icu];
	icu[slotIndex] = patient;
	return { ok: true, state: { ...state, icu } };
}

export function dischargePatient(state: MedicalState, personnelId: number): MedicalState {
	return { ...state, icu: state.icu.map((slot) => (slot?.personnelId === personnelId ? null : slot)) };
}

export interface RecoveryOptions {
	/** 0-100 functional status of the Intensive Care Unit device caring for this patient. */
	icuFunctionalStatus: number;
	deltaMs: number;
}

const HEALTH_CHANGE_PER_SECOND_AT_FULL_FUNCTION = 0.5;
const MINIMUM_HEALTH = 0;
const MAXIMUM_HEALTH = 10;

/**
 * Health (0-10, per the book's health-status scale) improves when the ICU is in good working order
 * and worsens when it isn't, per the book's description of recovery/decline being driven by device
 * status. 50% functional status is the break-even point.
 */
export function recoveredHealth(health: number, options: RecoveryOptions): number {
	const rate = (options.icuFunctionalStatus - 50) / 50;
	const change = rate * HEALTH_CHANGE_PER_SECOND_AT_FULL_FUNCTION * (options.deltaMs / 1000);
	return Math.min(MAXIMUM_HEALTH, Math.max(MINIMUM_HEALTH, health + change));
}
