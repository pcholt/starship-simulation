import { describe, expect, it } from 'vitest';
import { createLifeSupportState, distanceBetween, scanQualityForDistance, scanCelestialObject } from '../../src/domain/sciences.js';

describe('createLifeSupportState', () => {
	it('starts with full air, water, and food', () => {
		expect(createLifeSupportState()).toEqual({ air: 100, water: 100, food: 100 });
	});
});

describe('distanceBetween', () => {
	it('computes straight-line distance between two points', () => {
		expect(distanceBetween({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBeCloseTo(5);
	});

	it('is zero for coincident points', () => {
		expect(distanceBetween({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 })).toBe(0);
	});
});

describe('scanQualityForDistance', () => {
	it('is "full" within close range', () => {
		expect(scanQualityForDistance(50)).toBe('full');
	});

	it('is "partial" at medium range', () => {
		expect(scanQualityForDistance(500)).toBe('partial');
	});

	it('is "none" beyond sensor range', () => {
		expect(scanQualityForDistance(50000)).toBe('none');
	});
});

describe('scanCelestialObject', () => {
	it('returns full identity and physical data when close', () => {
		const object = { id: 1, name: 'Rigel VII', position: { x: 10, y: 0, z: 0 }, radius: 6000, mass: 5.9e24 };
		const result = scanCelestialObject(object, { x: 0, y: 0, z: 0 });
		expect(result.quality).toBe('full');
		expect(result.identity).toBe('Rigel VII');
		expect(result.radius).toBe(6000);
		expect(result.mass).toBe(5.9e24);
	});

	it('omits physical data when the object is out of sensor range', () => {
		const object = { id: 1, name: 'Rigel VII', position: { x: 100000, y: 0, z: 0 }, radius: 6000, mass: 5.9e24 };
		const result = scanCelestialObject(object, { x: 0, y: 0, z: 0 });
		expect(result.quality).toBe('none');
		expect(result.radius).toBeUndefined();
		expect(result.mass).toBeUndefined();
	});
});
