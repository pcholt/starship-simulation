import type { CargoItem } from './cargo.js';
import type { CelestialObject } from './celestial-object.js';
import type { Craft } from './craft.js';
import { distanceBetween } from './sciences.js';
import type { Vector3 } from './vector.js';

export type ManifestHolderKind = 'federationShip' | 'starbase' | 'planet';

export interface CargoManifest {
	holderKind: ManifestHolderKind;
	holderId: number;
	name: string;
	distance: number;
	cargo: CargoItem[];
}

export interface ManifestSources {
	federationCraft: readonly Craft[];
	celestialObjects: readonly CelestialObject[];
}

function manifestOfCraft(craft: Craft, distance: number): CargoManifest {
	return {
		holderKind: craft.kind === 'starbase' ? 'starbase' : 'federationShip',
		holderId: craft.id,
		name: craft.name,
		distance,
		cargo: craft.cargo
	};
}

function manifestOfPlanet(planet: CelestialObject, distance: number): CargoManifest {
	return { holderKind: 'planet', holderId: planet.id, name: planet.name, distance, cargo: planet.cargo };
}

/** Manifests of every Federation ship, starbase and planet within `range` of the Enterprise, nearest first. */
export function manifestsInRange(sources: ManifestSources, enterprisePosition: Vector3, range: number): CargoManifest[] {
	const federation = sources.federationCraft.map((craft) => manifestOfCraft(craft, distanceBetween(enterprisePosition, craft.position)));
	const planets = sources.celestialObjects.map((planet) => manifestOfPlanet(planet, distanceBetween(enterprisePosition, planet.position)));
	return [...federation, ...planets].filter((manifest) => manifest.distance <= range).sort((first, second) => first.distance - second.distance);
}
