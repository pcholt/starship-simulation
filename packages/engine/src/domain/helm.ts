export interface HelmState {
	/** Federation craft whose weapons safety cover is currently lifted; weapons may only be fired at them while it is. */
	liftedWeaponCoverCraftIds: number[];
}

export function createHelmState(): HelmState {
	return { liftedWeaponCoverCraftIds: [] };
}

export function isWeaponCoverLifted(state: HelmState, craftId: number): boolean {
	return state.liftedWeaponCoverCraftIds.includes(craftId);
}

export function setWeaponCoverLifted(state: HelmState, craftId: number, lifted: boolean): HelmState {
	const others = state.liftedWeaponCoverCraftIds.filter((id) => id !== craftId);
	return { liftedWeaponCoverCraftIds: lifted ? [...others, craftId] : others };
}
