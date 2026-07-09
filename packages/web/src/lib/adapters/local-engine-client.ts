import { createEngine, type Engine, type EngineDeps } from '@starship/engine';
import type { EngineClient } from './engine-client.js';

/** Wraps an in-process `Engine` instance behind the transport-agnostic `EngineClient` interface. */
export function createLocalEngineClient(deps?: EngineDeps): EngineClient {
	const engine: Engine = createEngine(deps);
	return {
		dispatch: (command) => Promise.resolve(engine.dispatch(command)),
		getState: () => engine.getState(),
		subscribe: (listener) => engine.subscribe(listener),
		loadScenario: (script) => Promise.resolve(engine.loadScenario(script)),
		tick: (deltaMs) => engine.tick(deltaMs)
	};
}
