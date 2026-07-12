import type { NavigationState, ScanAreaEvent, Vector3 } from '@starship/engine';
import type { WorldStateStore } from '../../stores/world-state.svelte.js';
import { projectedPath } from './projected-path.js';
import { createFadingFlashes } from './fading-flash-state.svelte.js';

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
	// A scan is a single player-triggered action (never more than one in flight at a time), so this
	// wraps `lastScanAreaEvent` as a 0-or-1-item list for `createFadingFlashes`, then unwraps it —
	// same fade-tracking mechanism the (genuinely multi-item) weapon-fire/explosion overlays use.
	const scan = createFadingFlashes(
		store,
		(s): ScanAreaEvent[] => (s.state.lastScanAreaEvent ? [s.state.lastScanAreaEvent] : []),
		SCAN_FLASH_DURATION_MS,
		(event, remainingMs): ScanFlashValue => ({
			center: event.position,
			radius: options.scanFlashRadius,
			key: event.sequence,
			initialOpacity: 0.6 * (remainingMs / SCAN_FLASH_DURATION_MS),
			durationMs: remainingMs
		})
	);

	return {
		get scanFlash() {
			return scan.flashes.at(-1) ?? null;
		},
		projectedPath(navigation: NavigationState) {
			return projectedPath(navigation, options.projectedPathSeconds, options.projectedPathStepSeconds);
		}
	};
}
