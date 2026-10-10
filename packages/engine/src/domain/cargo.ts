import { shipStation, type Location } from './location.js';

export type CargoType = 'food' | 'water' | 'oxygen' | 'energy' | 'weapons';

export const CARGO_TYPES: readonly CargoType[] = ['food', 'water', 'oxygen', 'energy', 'weapons'];

export const CARGO_LABELS: Record<CargoType, string> = {
	food: 'Food',
	water: 'Water',
	oxygen: 'Oxygen',
	energy: 'Energy',
	weapons: 'Weapons'
};

export interface CargoItem {
	type: CargoType;
	quantity: number;
}

/** A line of the Enterprise's own manifest, which also records where aboard the cargo is stored. */
export interface StoredCargoItem extends CargoItem {
	location: Location;
}

const STORAGE_LOCATION_BY_CARGO_TYPE: Record<CargoType, Location> = {
	food: shipStation('foodProcessing'),
	water: shipStation('waterDistRecycling'),
	oxygen: shipStation('oxygenDistRecycling'),
	energy: shipStation('energySupply'),
	weapons: shipStation('security')
};

const STARTING_ENTERPRISE_CARGO: Record<CargoType, number> = {
	food: 400,
	water: 600,
	oxygen: 500,
	energy: 200,
	weapons: 20
};

export function createEnterpriseCargo(): StoredCargoItem[] {
	return CARGO_TYPES.map((type) => ({
		type,
		quantity: STARTING_ENTERPRISE_CARGO[type],
		location: STORAGE_LOCATION_BY_CARGO_TYPE[type]
	}));
}

/** Sets the quantity of one cargo type in a manifest, dropping the line when the quantity is zero. */
export function withCargoQuantity(manifest: readonly CargoItem[], type: CargoType, quantity: number): CargoItem[] {
	const others = manifest.filter((item) => item.type !== type);
	return quantity > 0 ? [...others, { type, quantity }] : others;
}

/** Sets the quantity of one cargo type in the Enterprise manifest, keeping the line even at zero so the ship's stores stay visible. */
export function withEnterpriseCargoQuantity(manifest: readonly StoredCargoItem[], type: CargoType, quantity: number): StoredCargoItem[] {
	return manifest.map((item) => (item.type === type ? { ...item, quantity } : item));
}

export function sortedByCargoType<T extends CargoItem>(manifest: readonly T[]): T[] {
	return [...manifest].sort((first, second) => CARGO_TYPES.indexOf(first.type) - CARGO_TYPES.indexOf(second.type));
}
