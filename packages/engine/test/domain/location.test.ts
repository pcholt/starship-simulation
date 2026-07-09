import { describe, expect, it } from 'vitest';
import { locationsEqual, shipStation, celestialObjectLocation, craftLocation } from '../../src/domain/location.js';

describe('locationsEqual', () => {
	it('treats two ship-station locations with the same station as equal', () => {
		expect(locationsEqual(shipStation('bridge'), shipStation('bridge'))).toBe(true);
	});

	it('treats two ship-station locations with different stations as unequal', () => {
		expect(locationsEqual(shipStation('bridge'), shipStation('sciencesLab'))).toBe(false);
	});

	it('treats celestial-object locations with the same id as equal', () => {
		expect(locationsEqual(celestialObjectLocation(3), celestialObjectLocation(3))).toBe(true);
	});

	it('treats celestial-object locations with different ids as unequal', () => {
		expect(locationsEqual(celestialObjectLocation(3), celestialObjectLocation(4))).toBe(false);
	});

	it('treats craft locations with the same class and id as equal', () => {
		expect(locationsEqual(craftLocation('enemy', 1), craftLocation('enemy', 1))).toBe(true);
	});

	it('treats craft locations with the same id but different class as unequal', () => {
		expect(locationsEqual(craftLocation('enemy', 1), craftLocation('federation', 1))).toBe(false);
	});

	it('treats locations of different kinds as unequal even with overlapping fields', () => {
		expect(locationsEqual(celestialObjectLocation(1), craftLocation('enemy', 1))).toBe(false);
	});
});
