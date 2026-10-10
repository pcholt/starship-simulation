import { BANK_LOCATIONS, type BankLocation } from './engineering.js';
import { advancePhaserCharge } from './phaser-charge.js';
import { nominalMaximumEnergy } from './device-groups.js';

export interface HelmState {
	/** Federation craft whose weapons safety cover is currently lifted; weapons may only be fired at them while it is. */
	liftedWeaponCoverCraftIds: number[];
	/** Each phaser bank's charge from 0 (empty) to 1 (full). Firing empties it; it refills according to the bank's power. */
	phaserCharge: Record<BankLocation, number>;
}

export function createHelmState(): HelmState {
	const fullyChargedBanks = Object.fromEntries(BANK_LOCATIONS.map((location) => [location, 1])) as Record<BankLocation, number>;
	return { liftedWeaponCoverCraftIds: [], phaserCharge: fullyChargedBanks };
}

export function isWeaponCoverLifted(state: HelmState, craftId: number): boolean {
	return state.liftedWeaponCoverCraftIds.includes(craftId);
}

export function setWeaponCoverLifted(state: HelmState, craftId: number, lifted: boolean): HelmState {
	const others = state.liftedWeaponCoverCraftIds.filter((id) => id !== craftId);
	return { ...state, liftedWeaponCoverCraftIds: lifted ? [...others, craftId] : others };
}

export function dischargePhaserBank(state: HelmState, bank: BankLocation): HelmState {
	return { ...state, phaserCharge: { ...state.phaserCharge, [bank]: 0 } };
}

export function advancePhaserCharges(
	state: HelmState,
	devices: Record<string, { energyAssigned: number }>,
	deltaMs: number
): HelmState {
	const phaserCharge = Object.fromEntries(
		BANK_LOCATIONS.map((bank) => {
			const deviceId = `phaser-${bank}`;
			const powerFraction = devices[deviceId]!.energyAssigned / nominalMaximumEnergy(deviceId);
			return [bank, advancePhaserCharge(state.phaserCharge[bank], powerFraction, deltaMs)];
		})
	) as Record<BankLocation, number>;
	return { ...state, phaserCharge };
}
