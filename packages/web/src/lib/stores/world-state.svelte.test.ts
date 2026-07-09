import { describe, expect, it } from 'vitest';
import { createLocalEngineClient } from '../adapters/local-engine-client.js';
import { WorldStateStore } from './world-state.svelte.js';

describe('WorldStateStore', () => {
	it('reflects dispatched command results in state', () => {
		const store = new WorldStateStore(createLocalEngineClient());
		store.dispatch({ module: 'controller', type: 'Execute', target: 'navigation' });
		expect(store.state.modules.navigation).toBe('running');
	});

	it('forwards loadScenario to the underlying client and reflects it in state', () => {
		const store = new WorldStateStore(createLocalEngineClient());
		store.loadScenario({ steps: [] });
		expect(store.state.scenario).not.toBeNull();
	});

	it('forwards tick to the underlying client and reflects elapsed simulated time in state', () => {
		const store = new WorldStateStore(createLocalEngineClient());
		store.tick(500);
		expect(store.state.simulatedTimeMs).toBe(500);
	});
});
