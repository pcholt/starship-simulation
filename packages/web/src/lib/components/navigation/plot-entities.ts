import type { CelestialObject, Craft, Torpedo, Vector3 } from '@starship/engine';

export type EntityKind = 'enemyCraft' | 'federationCraft' | 'celestialObject' | 'torpedo';

export interface PlotEntity {
	/** Unique across all entities (celestial objects, craft, and torpedoes share one id sequence in the engine) — used as a keyed-each key, since display names are not guaranteed unique (e.g. a scenario preset loaded twice). */
	id: number;
	name: string;
	kind: EntityKind;
	position: Vector3;
}

export interface PlottableWorldState {
	celestialObjects: CelestialObject[];
	enemyCraft: Craft[];
	federationCraft: Craft[];
	torpedoes: Torpedo[];
}

/**
 * Flattens the separate entity lists the engine tracks into one list shaped for
 * `AstrogatorPlot`. Shared by every station that draws a world-space plot (Navigation, Sciences)
 * so they can't drift apart on how an entity's plot representation is derived.
 */
export function toPlotEntities(state: PlottableWorldState): PlotEntity[] {
	return [
		...state.celestialObjects.map((o) => ({ id: o.id, name: o.name, kind: 'celestialObject' as const, position: o.position })),
		...state.enemyCraft.map((c) => ({ id: c.id, name: c.name, kind: 'enemyCraft' as const, position: c.position })),
		...state.federationCraft.map((c) => ({ id: c.id, name: c.name, kind: 'federationCraft' as const, position: c.position })),
		...state.torpedoes.map((t) => ({ id: t.id, name: 'Torpedo', kind: 'torpedo' as const, position: t.position }))
	];
}
