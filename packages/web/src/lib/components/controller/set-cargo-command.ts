import { CARGO_TYPES, type CargoHolder, type CargoType, type Command, type Craft, type CelestialObject } from '@starship/engine';

export interface CargoHolderOption {
	key: string;
	label: string;
	holder: CargoHolder;
}

export interface SetCargoForm {
	holderKey: string;
	cargoType: CargoType;
	quantity: number | null;
}

export type SetCargoResult = { ok: true; command: Command } | { ok: false; reason: string };

export const ENTERPRISE_HOLDER_KEY = 'enterprise';

export function createEmptySetCargoForm(): SetCargoForm {
	return { holderKey: ENTERPRISE_HOLDER_KEY, cargoType: CARGO_TYPES[0]!, quantity: 0 };
}

export function listCargoHolders(federationCraft: readonly Craft[], celestialObjects: readonly CelestialObject[]): CargoHolderOption[] {
	return [
		{ key: ENTERPRISE_HOLDER_KEY, label: 'Enterprise', holder: { kind: 'enterprise' } },
		...federationCraft.map((craft) => ({
			key: `federationCraft:${craft.id}`,
			label: `${craft.name} (${craft.kind === 'starbase' ? 'starbase' : 'ship'})`,
			holder: { kind: 'federationCraft' as const, id: craft.id }
		})),
		...celestialObjects.map((object) => ({
			key: `celestialObject:${object.id}`,
			label: `${object.name} (planet)`,
			holder: { kind: 'celestialObject' as const, id: object.id }
		}))
	];
}

export function buildSetCargoCommand(form: SetCargoForm, holders: readonly CargoHolderOption[]): SetCargoResult {
	const option = holders.find((candidate) => candidate.key === form.holderKey);
	if (!option) return { ok: false, reason: 'Choose who is holding the cargo' };
	if (form.quantity === null || form.quantity < 0) return { ok: false, reason: 'Enter a cargo quantity of zero or more' };
	return { ok: true, command: { module: 'controller', type: 'SetCargo', holder: option.holder, cargoType: form.cargoType, quantity: form.quantity } };
}
