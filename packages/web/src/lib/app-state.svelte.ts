import { createLocalEngineClient } from './adapters/local-engine-client.js';
import { WorldStateStore } from './stores/world-state.svelte.js';

/**
 * The one shared engine instance for this browser session (local-only
 * multiplayer model: every station view reads/writes the same store).
 * Swapping to networked play later means replacing `createLocalEngineClient()`
 * with a `createWsEngineClient(...)` here — no other file needs to change.
 */
export const worldStateStore = new WorldStateStore(createLocalEngineClient());
