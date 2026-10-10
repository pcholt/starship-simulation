import {
	CARGO_LABELS,
	sortedByCargoType,
	type CargoItem,
	type CargoManifest,
	type ManifestHolderKind,
	type StoredCargoItem
} from '@starship/engine';
import { describeLocation } from '../crew/crew-roster-view.js';

export interface EnterpriseCargoRow {
	type: string;
	label: string;
	quantity: number;
	locationLabel: string;
}

export interface CargoLine {
	type: string;
	label: string;
	quantity: number;
}

export interface HolderManifestView {
	key: string;
	name: string;
	holderLabel: string;
	distanceLabel: string;
	lines: CargoLine[];
}

const HOLDER_LABELS: Record<ManifestHolderKind, string> = {
	federationShip: 'Federation ship',
	starbase: 'Starbase',
	planet: 'Planet'
};

export function buildEnterpriseCargoRows(cargo: readonly StoredCargoItem[]): EnterpriseCargoRow[] {
	return sortedByCargoType(cargo).map((item) => ({
		type: item.type,
		label: CARGO_LABELS[item.type],
		quantity: item.quantity,
		locationLabel: describeLocation(item.location)
	}));
}

function buildCargoLines(cargo: readonly CargoItem[]): CargoLine[] {
	return sortedByCargoType(cargo).map((item) => ({ type: item.type, label: CARGO_LABELS[item.type], quantity: item.quantity }));
}

export function buildHolderManifestViews(manifests: readonly CargoManifest[]): HolderManifestView[] {
	return manifests.map((manifest) => ({
		key: `${manifest.holderKind}-${manifest.holderId}`,
		name: manifest.name,
		holderLabel: HOLDER_LABELS[manifest.holderKind],
		distanceLabel: `${Math.round(manifest.distance)} units`,
		lines: buildCargoLines(manifest.cargo)
	}));
}

export function describeCommunicationsRange(range: number): string {
	return `${Math.round(range)} units`;
}
