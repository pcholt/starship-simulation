import { describe, expect, it } from 'vitest';
import {
	CARGO_LABELS,
	CARGO_TYPES,
	createEnterpriseCargo,
	sortedByCargoType,
	withCargoQuantity,
	withEnterpriseCargoQuantity
} from '../../src/domain/cargo.js';

describe('CARGO_TYPES', () => {
	it('has the book cargo types, with bombs called weapons', () => {
		expect(CARGO_TYPES).toEqual(['food', 'water', 'oxygen', 'energy', 'weapons']);
	});

	it('has a label for each type', () => {
		expect(CARGO_TYPES.map((type) => CARGO_LABELS[type])).toEqual(['Food', 'Water', 'Oxygen', 'Energy', 'Weapons']);
	});
});

describe('createEnterpriseCargo', () => {
	it('stocks one line for each cargo type', () => {
		expect(createEnterpriseCargo().map((item) => item.type)).toEqual(['food', 'water', 'oxygen', 'energy', 'weapons']);
	});

	it('stores food in the food processing plant', () => {
		const food = createEnterpriseCargo().find((item) => item.type === 'food')!;

		expect(food.location).toEqual({ kind: 'shipStation', station: 'foodProcessing' });
	});

	it('stores water, oxygen, energy and weapons in their own places', () => {
		const locations = Object.fromEntries(createEnterpriseCargo().map((item) => [item.type, item.location]));

		expect(locations).toEqual({
			food: { kind: 'shipStation', station: 'foodProcessing' },
			water: { kind: 'shipStation', station: 'waterDistRecycling' },
			oxygen: { kind: 'shipStation', station: 'oxygenDistRecycling' },
			energy: { kind: 'shipStation', station: 'energySupply' },
			weapons: { kind: 'shipStation', station: 'security' }
		});
	});

	it('starts with some of every supply', () => {
		expect(createEnterpriseCargo().every((item) => item.quantity > 0)).toBe(true);
	});
});

describe('withCargoQuantity', () => {
	it('adds a line for a type that was not there', () => {
		expect(withCargoQuantity([], 'food', 40)).toEqual([{ type: 'food', quantity: 40 }]);
	});

	it('replaces the quantity of a type that was already there', () => {
		expect(withCargoQuantity([{ type: 'food', quantity: 40 }], 'food', 15)).toEqual([{ type: 'food', quantity: 15 }]);
	});

	it('leaves other types alone', () => {
		const result = withCargoQuantity([{ type: 'water', quantity: 9 }], 'food', 15);

		expect(result).toContainEqual({ type: 'water', quantity: 9 });
	});

	it('drops the line when the quantity is zero', () => {
		expect(withCargoQuantity([{ type: 'food', quantity: 40 }], 'food', 0)).toEqual([]);
	});

	it('does not change the manifest it was given', () => {
		const original = [{ type: 'food' as const, quantity: 40 }];

		withCargoQuantity(original, 'food', 1);

		expect(original).toEqual([{ type: 'food', quantity: 40 }]);
	});
});

describe('withEnterpriseCargoQuantity', () => {
	it('changes the quantity of one type and keeps where it is stored', () => {
		const result = withEnterpriseCargoQuantity(createEnterpriseCargo(), 'water', 5);

		const water = result.find((item) => item.type === 'water')!;
		expect(water.quantity).toBe(5);
		expect(water.location).toEqual({ kind: 'shipStation', station: 'waterDistRecycling' });
	});

	it('keeps the line even when the stock reaches zero', () => {
		const result = withEnterpriseCargoQuantity(createEnterpriseCargo(), 'water', 0);

		expect(result.find((item) => item.type === 'water')!.quantity).toBe(0);
	});
});

describe('sortedByCargoType', () => {
	it('orders lines the way the cargo types are listed', () => {
		const sorted = sortedByCargoType([
			{ type: 'weapons', quantity: 1 },
			{ type: 'food', quantity: 2 }
		]);

		expect(sorted.map((item) => item.type)).toEqual(['food', 'weapons']);
	});
});
