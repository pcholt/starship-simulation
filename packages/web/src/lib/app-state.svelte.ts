import { env } from '$env/dynamic/public';
import { createLocalEngineClient } from './adapters/local-engine-client.js';
import { createWsEngineClient } from './adapters/ws-engine-client.js';
import type { EngineClient } from './adapters/engine-client.js';
import { WorldStateStore } from './stores/world-state.svelte.js';

/**
 * Composition root: picks the local (single-browser) or networked
 * (multiplayer, server-hosted) `EngineClient` based on config. Everything
 * else — stores, station components — depends only on the `EngineClient`
 * interface and doesn't know or care which one is in play.
 *
 * Networked play requires a real WebSocket, which only exists in the
 * browser — SSR (and any render before hydration) always uses the local
 * client so there's something to render immediately; the browser then
 * reconnects to the real session on mount if PUBLIC_MULTIPLAYER_URL is set.
 */
const multiplayerUrl = typeof window !== 'undefined' ? env.PUBLIC_MULTIPLAYER_URL : undefined;

function createClient(): EngineClient {
	if (multiplayerUrl) return createWsEngineClient(multiplayerUrl);
	return createLocalEngineClient();
}

export const worldStateStore = new WorldStateStore(createClient());

const TICK_INTERVAL_MS = 200;

// Browser-only, and only for local play: advances the simulated clock in real time so running
// modules (ship movement, medical recovery) and a running scenario actually progress. In
// networked play the server owns ticking (see @starship/server) and broadcasts the result —
// calling tick() here would just hit ws-engine-client's documented no-op.
if (typeof window !== 'undefined' && !multiplayerUrl) {
	let last = performance.now();
	setInterval(() => {
		const now = performance.now();
		worldStateStore.tick(now - last);
		last = now;
	}, TICK_INTERVAL_MS);
}
