import { describe, expect, it } from 'vitest';
import type { CargoManifest, StoredCargoItem } from '@starship/engine';
import { buildEnterpriseCargoRows, buildHolderManifestViews, describeCommunicationsRange } from './cargo-manifest-view';

const stored: StoredCargoItem[] = [
	{ type: 'water', quantity: 600, location: { kind: 'shipStation', station: 'waterDistRecycling' } },
	{ type: 'food', quantity: 400, location: { kind: 'shipStation', station: 'foodProcessing' } }
];

describe('buildEnterpriseCargoRows', () => {
	it('labels each type and says where it is stored', () => {
		expect(buildEnterpriseCargoRows(stored)[0]).toEqual({ type: 'food', label: 'Food', quantity: 400, locationLabel: 'Food Processing' });
	});

	it('lists cargo in the usual type order', () => {
		expect(buildEnterpriseCargoRows(stored).map((row) => row.label)).toEqual(['Food', 'Water']);
	});

	it('is empty for an empty hold', () => {
		expect(buildEnterpriseCargoRows([])).toEqual([]);
	});
});

describe('buildHolderManifestViews', () => {
	const manifests: CargoManifest[] = [
		{ holderKind: 'starbase', holderId: 8, name: 'Starbase 12', distance: 123.6, cargo: [{ type: 'water', quantity: 5 }, { type: 'food', quantity: 9 }] },
		{ holderKind: 'planet', holderId: 9, name: 'Rigel VII', distance: 400, cargo: [] },
		{ holderKind: 'federationShip', holderId: 7, name: 'USS Excelsior', distance: 20, cargo: [] }
	];

	it('names the kind of holder', () => {
		expect(buildHolderManifestViews(manifests).map((view) => view.holderLabel)).toEqual(['Starbase', 'Planet', 'Federation ship']);
	});

	it('rounds the distance and gives its units', () => {
		expect(buildHolderManifestViews(manifests)[0]!.distanceLabel).toBe('124 units');
	});

	it('orders each holder cargo in the usual type order', () => {
		expect(buildHolderManifestViews(manifests)[0]!.lines.map((line) => line.label)).toEqual(['Food', 'Water']);
	});

	it('gives an empty hold no lines', () => {
		expect(buildHolderManifestViews(manifests)[1]!.lines).toEqual([]);
	});

	it('keys each holder by its kind and id so two holders never clash', () => {
		expect(buildHolderManifestViews(manifests).map((view) => view.key)).toEqual(['starbase-8', 'planet-9', 'federationShip-7']);
	});

	it('keeps the order it was given', () => {
		expect(buildHolderManifestViews(manifests).map((view) => view.name)).toEqual(['Starbase 12', 'Rigel VII', 'USS Excelsior']);
	});
});

describe('describeCommunicationsRange', () => {
	it('rounds to whole units', () => {
		expect(describeCommunicationsRange(499.6)).toBe('500 units');
	});

	it('says zero units when communications are down', () => {
		expect(describeCommunicationsRange(0)).toBe('0 units');
	});
});
