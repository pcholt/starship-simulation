import { describe, expect, it } from 'vitest';
import { manifestsInRange } from '../../src/domain/cargo-manifests.js';
import type { CelestialObject } from '../../src/domain/celestial-object.js';
import type { Craft } from '../../src/domain/craft.js';

const origin = { x: 0, y: 0, z: 0 };

function craft(overrides: Partial<Craft> & Pick<Craft, 'id' | 'name' | 'position'>): Craft {
	return { mission: 'patrol', hullIntegrity: 100, speed: 0, cargo: [], ...overrides };
}

function planet(overrides: Partial<CelestialObject> & Pick<CelestialObject, 'id' | 'name' | 'position'>): CelestialObject {
	return { radius: 6000, mass: 1, cargo: [], ...overrides };
}

describe('manifestsInRange', () => {
	it('is empty when nothing is out there', () => {
		expect(manifestsInRange({ federationCraft: [], celestialObjects: [] }, origin, 1000)).toEqual([]);
	});

	it('lists a Federation ship in range with its cargo', () => {
		const ship = craft({ id: 7, name: 'USS Excelsior', position: { x: 300, y: 400, z: 0 }, cargo: [{ type: 'food', quantity: 40 }] });

		const manifests = manifestsInRange({ federationCraft: [ship], celestialObjects: [] }, origin, 1000);

		expect(manifests).toEqual([
			{ holderKind: 'federationShip', holderId: 7, name: 'USS Excelsior', distance: 500, cargo: [{ type: 'food', quantity: 40 }] }
		]);
	});

	it('calls a Federation craft of kind starbase a starbase', () => {
		const base = craft({ id: 8, name: 'Starbase 12', position: { x: 10, y: 0, z: 0 }, kind: 'starbase' });

		const manifests = manifestsInRange({ federationCraft: [base], celestialObjects: [] }, origin, 1000);

		expect(manifests[0]!.holderKind).toBe('starbase');
	});

	it('lists a planet in range', () => {
		const world = planet({ id: 9, name: 'Rigel VII', position: { x: 0, y: 200, z: 0 }, cargo: [{ type: 'water', quantity: 5 }] });

		const manifests = manifestsInRange({ federationCraft: [], celestialObjects: [world] }, origin, 1000);

		expect(manifests[0]).toMatchObject({ holderKind: 'planet', name: 'Rigel VII', distance: 200 });
	});

	it('leaves out anything beyond the range', () => {
		const far = craft({ id: 7, name: 'USS Far', position: { x: 1500, y: 0, z: 0 } });
		const near = craft({ id: 8, name: 'USS Near', position: { x: 100, y: 0, z: 0 } });

		const manifests = manifestsInRange({ federationCraft: [far, near], celestialObjects: [] }, origin, 1000);

		expect(manifests.map((manifest) => manifest.name)).toEqual(['USS Near']);
	});

	it('includes something exactly at the edge of the range', () => {
		const edge = craft({ id: 7, name: 'USS Edge', position: { x: 1000, y: 0, z: 0 } });

		expect(manifestsInRange({ federationCraft: [edge], celestialObjects: [] }, origin, 1000)).toHaveLength(1);
	});

	it('lists ships, starbases and planets together, nearest first', () => {
		const ship = craft({ id: 7, name: 'Ship', position: { x: 300, y: 0, z: 0 } });
		const world = planet({ id: 9, name: 'World', position: { x: 100, y: 0, z: 0 } });
		const base = craft({ id: 8, name: 'Base', position: { x: 200, y: 0, z: 0 }, kind: 'starbase' });

		const manifests = manifestsInRange({ federationCraft: [ship, base], celestialObjects: [world] }, origin, 1000);

		expect(manifests.map((manifest) => manifest.name)).toEqual(['World', 'Base', 'Ship']);
	});

	it('measures distance from the Enterprise, not from the origin', () => {
		const ship = craft({ id: 7, name: 'USS Excelsior', position: { x: 2000, y: 0, z: 0 } });

		const manifests = manifestsInRange({ federationCraft: [ship], celestialObjects: [] }, { x: 1900, y: 0, z: 0 }, 1000);

		expect(manifests[0]!.distance).toBe(100);
	});

	it('shrinks to nothing when the range is zero', () => {
		const ship = craft({ id: 7, name: 'USS Excelsior', position: { x: 5, y: 0, z: 0 } });

		expect(manifestsInRange({ federationCraft: [ship], celestialObjects: [] }, origin, 0)).toEqual([]);
	});
});
