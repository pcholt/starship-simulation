import type { Vector3 } from '@starship/engine';
import { TORPEDO_SPLASH_RADIUS } from '@starship/engine';
import type { WorldStateStore } from '../../stores/world-state.svelte.js';
import { createFadingFlashes } from './fading-flash-state.svelte.js';

export interface FireFlashValue {
	from: Vector3;
	to: Vector3;
	key: number;
}

export interface ExplosionFlashValue {
	center: Vector3;
	radius: number;
	key: number;
	initialOpacity: number;
	durationMs: number;
}

const FIRE_FLASH_DURATION_MS = 500;
const EXPLOSION_FLASH_DURATION_MS = 1500;

/**
 * Watches `weaponFireEvents`/`torpedoExplosionEvents` and produces momentary fire-beam /
 * explosion-ring values for `AstrogatorPlot`, one per event still fading — several torpedoes can
 * resolve in the same tick, so this is a list, not a single slot. Kept separate from
 * `createAstrogatorOverlayState` — which also owns Navigation-only projected-path options — so
 * Sciences can use just this piece.
 */
export function createWeaponFireOverlayState(store: WorldStateStore) {
	const fire = createFadingFlashes(
		store,
		(s) => s.state.weaponFireEvents,
		FIRE_FLASH_DURATION_MS,
		(event): FireFlashValue => ({ from: event.from, to: event.to, key: event.sequence })
	);

	const explosion = createFadingFlashes(
		store,
		(s) => s.state.torpedoExplosionEvents,
		EXPLOSION_FLASH_DURATION_MS,
		(event, remainingMs): ExplosionFlashValue => ({
			center: event.position,
			radius: TORPEDO_SPLASH_RADIUS,
			key: event.sequence,
			initialOpacity: 0.8 * (remainingMs / EXPLOSION_FLASH_DURATION_MS),
			durationMs: remainingMs
		})
	);

	return {
		get fireFlashes() {
			return fire.flashes;
		},
		get explosionFlashes() {
			return explosion.flashes;
		}
	};
}
