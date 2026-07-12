import { untrack } from 'svelte';
import type { Vector3 } from '@starship/engine';
import type { WorldStateStore } from '../../stores/world-state.svelte.js';

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
const EXPLOSION_FLASH_RADIUS = 3; // matches TORPEDO_SPLASH_RADIUS

/**
 * Watches `lastWeaponFireEvent`/`lastTorpedoExplosionEvent` (by sequence number, not object
 * identity — see `createAstrogatorOverlayState`'s scan-flash effect for why) and produces a
 * momentary fire-beam / explosion-ring for `AstrogatorPlot`. Kept separate from
 * `createAstrogatorOverlayState` — which also owns Navigation-only projected-path options — so
 * Sciences can use just this piece.
 */
export function createWeaponFireOverlayState(store: WorldStateStore) {
	let fireFlash: FireFlashValue | null = $state(null);
	let explosionFlash: ExplosionFlashValue | null = $state(null);

	$effect(() => {
		const event = store.state.lastWeaponFireEvent;
		if (!event) return;

		const elapsedMs = untrack(() => store.state.simulatedTimeMs) - event.atMs;
		const remainingMs = FIRE_FLASH_DURATION_MS - elapsedMs;
		if (remainingMs <= 0) {
			fireFlash = null;
			return;
		}

		fireFlash = { from: event.from, to: event.to, key: event.sequence };
		const timeout = setTimeout(() => {
			fireFlash = null;
		}, remainingMs);
		return () => clearTimeout(timeout);
	});

	$effect(() => {
		const event = store.state.lastTorpedoExplosionEvent;
		if (!event) return;

		const elapsedMs = untrack(() => store.state.simulatedTimeMs) - event.atMs;
		const remainingMs = EXPLOSION_FLASH_DURATION_MS - elapsedMs;
		if (remainingMs <= 0) {
			explosionFlash = null;
			return;
		}

		explosionFlash = {
			center: event.position,
			radius: EXPLOSION_FLASH_RADIUS,
			key: event.sequence,
			initialOpacity: 0.8 * (remainingMs / EXPLOSION_FLASH_DURATION_MS),
			durationMs: remainingMs
		};
		const timeout = setTimeout(() => {
			explosionFlash = null;
		}, remainingMs);
		return () => clearTimeout(timeout);
	});

	return {
		get fireFlash() {
			return fireFlash;
		},
		get explosionFlash() {
			return explosionFlash;
		}
	};
}
