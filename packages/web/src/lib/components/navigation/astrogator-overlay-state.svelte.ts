import { untrack } from 'svelte';
import type { NavigationState, Vector3 } from '@starship/engine';
import type { WorldStateStore } from '../../stores/world-state.svelte.js';
import { projectedPath } from './projected-path.js';

export interface ScanFlashValue {
	center: Vector3;
	radius: number;
	key: number;
	initialOpacity: number;
	durationMs: number;
}

const SCAN_FLASH_DURATION_MS = 2000;

/**
 * Everything NavigationStation feeds into AstrogatorPlot that isn't a plain derived value from
 * `store.state` — the scan-flash marker (which needs its own effect/timeout to fade out over
 * time) and the projected future path. Pulled out of NavigationStation.svelte so the component
 * itself only wires props together rather than also owning this bookkeeping directly.
 */
export function createAstrogatorOverlayState(
	store: WorldStateStore,
	options: { scanFlashRadius: number; projectedPathSeconds: number; projectedPathStepSeconds: number }
) {
	let scanFlash: ScanFlashValue | null = $state(null);

	// Watches for a *new* Scan Area event (by sequence number, not object identity — the latter
	// would also change on every full-state broadcast in networked play) and shows a flash at the
	// scanned point for a couple of seconds, so Navigation sees where Sciences just looked.
	//
	// The event carries `atMs` (simulated time of the scan), so a component that only just
	// mounted — e.g. the player switched stations and back, or reloaded the page — can tell how
	// much of the flash's 2 seconds has already elapsed elsewhere, instead of always restarting
	// it from full brightness as if the scan had just happened.
	$effect(() => {
		const event = store.state.lastScanAreaEvent;
		if (!event) return;

		// Read the clock without subscribing to it — simulatedTimeMs ticks continuously, and this
		// effect must only re-run when a *new* scan event arrives, not on every tick in between.
		const elapsedMs = untrack(() => store.state.simulatedTimeMs) - event.atMs;
		const remainingMs = SCAN_FLASH_DURATION_MS - elapsedMs;
		if (remainingMs <= 0) {
			scanFlash = null;
			return;
		}

		scanFlash = {
			center: event.position,
			radius: options.scanFlashRadius,
			key: event.sequence,
			initialOpacity: 0.6 * (remainingMs / SCAN_FLASH_DURATION_MS),
			durationMs: remainingMs
		};
		const timeout = setTimeout(() => {
			scanFlash = null;
		}, remainingMs);
		return () => clearTimeout(timeout);
	});

	return {
		get scanFlash() {
			return scanFlash;
		},
		projectedPath(navigation: NavigationState) {
			return projectedPath(navigation, options.projectedPathSeconds, options.projectedPathStepSeconds);
		}
	};
}
