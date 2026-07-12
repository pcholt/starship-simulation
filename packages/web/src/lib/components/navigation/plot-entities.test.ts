import { describe, expect, it } from 'vitest';
import { toPlotEntities } from './plot-entities.js';

function state(overrides: Partial<Parameters<typeof toPlotEntities>[0]> = {}) {
	return {
		celestialObjects: [],
		enemyCraft: [],
		federationCraft: [],
		torpedoes: [],
		...overrides
	};
}

describe('toPlotEntities', () => {
	it('is empty when the universe has no objects or craft', () => {
		expect(toPlotEntities(state())).toEqual([]);
	});

	it('maps celestial objects to celestialObject-kind plot entities', () => {
		const entities = toPlotEntities(
			state({ celestialObjects: [{ id: 1, name: 'Rigel VII', position: { x: 1, y: 2, z: 3 }, radius: 6000, mass: 1 }] })
		);
		expect(entities).toEqual([{ id: 1, name: 'Rigel VII', kind: 'celestialObject', position: { x: 1, y: 2, z: 3 } }]);
	});

	it('maps enemy craft to enemyCraft-kind plot entities', () => {
		const entities = toPlotEntities(
			state({
				enemyCraft: [
					{ id: 2, name: 'Klingon Bird of Prey', mission: 'unconditionalAttack', position: { x: 4, y: 5, z: 6 }, hullIntegrity: 100, speed: 0 }
				]
			})
		);
		expect(entities).toEqual([{ id: 2, name: 'Klingon Bird of Prey', kind: 'enemyCraft', position: { x: 4, y: 5, z: 6 } }]);
	});

	it('maps federation craft to federationCraft-kind plot entities', () => {
		const entities = toPlotEntities(
			state({
				federationCraft: [{ id: 3, name: 'USS Excelsior', mission: 'patrol', position: { x: 7, y: 8, z: 9 }, hullIntegrity: 100, speed: 0 }]
			})
		);
		expect(entities).toEqual([{ id: 3, name: 'USS Excelsior', kind: 'federationCraft', position: { x: 7, y: 8, z: 9 } }]);
	});

	it('maps in-flight torpedoes to torpedo-kind plot entities', () => {
		const entities = toPlotEntities(
			state({
				torpedoes: [
					{
						id: 9,
						targetFleet: 'enemyCraft',
						targetId: 2,
						position: { x: 1, y: 1, z: 0 },
						velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 18 },
						launchSpeed: 7,
						fuel: 5,
						launchedAtMs: 0,
						hasMissed: false
					}
				]
			})
		);
		expect(entities).toEqual([{ id: 9, name: 'Torpedo', kind: 'torpedo', position: { x: 1, y: 1, z: 0 } }]);
	});

	it('combines all kinds together', () => {
		const entities = toPlotEntities(
			state({
				celestialObjects: [{ id: 1, name: 'Rigel VII', position: { x: 0, y: 0, z: 0 }, radius: 1, mass: 1 }],
				enemyCraft: [
					{ id: 2, name: 'Klingon Bird of Prey', mission: 'unconditionalAttack', position: { x: 0, y: 0, z: 0 }, hullIntegrity: 100, speed: 0 }
				],
				federationCraft: [{ id: 3, name: 'USS Excelsior', mission: 'patrol', position: { x: 0, y: 0, z: 0 }, hullIntegrity: 100, speed: 0 }],
				torpedoes: [
					{
						id: 9,
						targetFleet: 'enemyCraft',
						targetId: 2,
						position: { x: 0, y: 0, z: 0 },
						velocity: { xyAngleDeg: 0, xzAngleDeg: 0, warpSpeed: 18 },
						launchSpeed: 7,
						fuel: 5,
						launchedAtMs: 0,
						hasMissed: false
					}
				]
			})
		);
		expect(entities.map((e) => e.kind)).toEqual(['celestialObject', 'enemyCraft', 'federationCraft', 'torpedo']);
	});
});
