import type { Command, CommandResult, Engine, EngineEvent, ScenarioScript, Unsubscribe, WorldState } from '@starship/engine';

/**
 * The boundary a Svelte store depends on instead of the engine directly.
 * `local-engine-client.ts` implements this in-process today; a future
 * `ws-engine-client.ts` can implement the same interface over a socket
 * without any change to stores or components.
 */
export interface EngineClient {
	dispatch(command: Command): CommandResult;
	getState(): Readonly<WorldState>;
	subscribe(listener: (event: EngineEvent) => void): Unsubscribe;
	loadScenario(script: ScenarioScript): void;
	tick(deltaMs: number): void;
}

export type { Engine };
