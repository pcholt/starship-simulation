import type { Command, CommandResult, ScenarioScript, WorldState } from '@starship/engine';
import type { EngineClient } from '../adapters/engine-client.js';

/**
 * Interface-adapter layer: binds an `EngineClient`'s snapshot/event model to
 * Svelte reactivity. Station components read `store.state...` and call
 * `store.dispatch(...)` — they never touch an `EngineClient` or the engine
 * directly, so they don't need to change when the client is swapped for a
 * networked one later.
 */
export class WorldStateStore {
	#client: EngineClient;
	state: WorldState = $state()!;

	constructor(client: EngineClient) {
		this.#client = client;
		this.state = client.getState();
		client.subscribe(() => {
			this.state = client.getState();
		});
	}

	dispatch(command: Command): CommandResult {
		return this.#client.dispatch(command);
	}

	loadScenario(script: ScenarioScript): void {
		this.#client.loadScenario(script);
		this.state = this.#client.getState();
	}

	tick(deltaMs: number): void {
		this.#client.tick(deltaMs);
		this.state = this.#client.getState();
	}
}
