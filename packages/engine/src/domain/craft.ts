import type { CargoItem } from './cargo.js';
import type { Vector3 } from './vector.js';

/** Which of `WorldState`'s parallel craft arrays a non-Enterprise craft belongs to. */
export type Fleet = 'enemyCraft' | 'federationCraft' | 'shuttlecraft';

export type CraftKind = 'ship' | 'starbase';

/** A non-Enterprise spacecraft (enemy or Federation). Shared shape per the book's parallel data arrays. */
export interface Craft {
	id: number;
	name: string;
	mission: string;
	position: Vector3;
	/** 0-100; a combat target's remaining structural integrity. 0 = destroyed. */
	hullIntegrity: number;
	/** A starbase is a fixed Federation station; anything else is a ship. Absent means ship. */
	kind?: CraftKind;
	cargo: CargoItem[];
	/**
	 * Warp speed used only by the torpedo hit/miss check (a fast-moving target has a 50% chance to
	 * evade). Defaults to 0. This craft doesn't actually move at this speed, or at all — there is no
	 * enemy/Federation movement simulation yet. Scoped here (rather than passed as a parameter into
	 * FireTorpedo/tick) so a scenario or the Controller can set a craft up as "hard to hit" without
	 * the caller needing to know why; expect this field's meaning to be revisited once real
	 * craft movement exists.
	 */
	speed: number;
}
