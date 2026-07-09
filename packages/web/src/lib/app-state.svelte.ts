import { createLocalEngineClient } from './adapters/local-engine-client.js';
import { WorldStateStore } from './stores/world-state.svelte.js';

/**
 * The one shared engine instance for this browser session (local-only
 * multiplayer model: every station view reads/writes the same store).
 * Swapping to networked play later means replacing `createLocalEngineClient()`
 * with a `createWsEngineClient(...)` here — no other file needs to change.
 */
export const worldStateStore = new WorldStateStore(createLocalEngineClient());

const TICK_INTERVAL_MS = 200;

// Browser-only: advances the simulated clock in real time so running modules
// (ship movement, medical recovery) and a running scenario actually progress.
// Guarded so SvelteKit's SSR render of this module doesn't start a timer per request.
if (typeof window !== 'undefined') {
	let last = performance.now();
	setInterval(() => {
		const now = performance.now();
		worldStateStore.tick(now - last);
		last = now;
	}, TICK_INTERVAL_MS);
}
