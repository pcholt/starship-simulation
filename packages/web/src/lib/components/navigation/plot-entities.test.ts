import { describe, expect, it } from 'vitest';
import { toPlotEntities } from './plot-entities.js';

function state(overrides: Partial<Parameters<typeof toPlotEntities>[0]> = {}) {
	return {
		celestialObjects: [],
		enemyCraft: [],
		federationCraft: [],
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
				enemyCraft: [{ id: 2, name: 'Klingon Bird of Prey', mission: 'unconditionalAttack', position: { x: 4, y: 5, z: 6 }, hullIntegrity: 100 }]
			})
		);
		expect(entities).toEqual([{ id: 2, name: 'Klingon Bird of Prey', kind: 'enemyCraft', position: { x: 4, y: 5, z: 6 } }]);
	});

	it('maps federation craft to federationCraft-kind plot entities', () => {
		const entities = toPlotEntities(
			state({
				federationCraft: [{ id: 3, name: 'USS Excelsior', mission: 'patrol', position: { x: 7, y: 8, z: 9 }, hullIntegrity: 100 }]
			})
		);
		expect(entities).toEqual([{ id: 3, name: 'USS Excelsior', kind: 'federationCraft', position: { x: 7, y: 8, z: 9 } }]);
	});

	it('combines all three kinds together', () => {
		const entities = toPlotEntities(
			state({
				celestialObjects: [{ id: 1, name: 'Rigel VII', position: { x: 0, y: 0, z: 0 }, radius: 1, mass: 1 }],
				enemyCraft: [{ id: 2, name: 'Klingon Bird of Prey', mission: 'unconditionalAttack', position: { x: 0, y: 0, z: 0 }, hullIntegrity: 100 }],
				federationCraft: [{ id: 3, name: 'USS Excelsior', mission: 'patrol', position: { x: 0, y: 0, z: 0 }, hullIntegrity: 100 }]
			})
		);
		expect(entities.map((e) => e.kind)).toEqual(['celestialObject', 'enemyCraft', 'federationCraft']);
	});
});
