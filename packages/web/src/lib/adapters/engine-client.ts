import type { Command, CommandResult, Engine, EngineEvent, ScenarioScript, Unsubscribe, WorldState } from '@starship/engine';

/**
 * The boundary a Svelte store depends on instead of the engine directly.
 * `local-engine-client.ts` implements this in-process; `ws-engine-client.ts`
 * implements the same interface over a socket — no change needed to stores
 * or components either way.
 *
 * `dispatch`/`loadScenario` are async because a networked client can't
 * return a result synchronously (it has to wait for a server round trip);
 * the local client just resolves immediately.
 */
export interface EngineClient {
	dispatch(command: Command): Promise<CommandResult>;
	getState(): Readonly<WorldState>;
	subscribe(listener: (event: EngineEvent) => void): Unsubscribe;
	loadScenario(script: ScenarioScript): Promise<void>;
	/** Advances simulated time. Meaningful only for a local client — a networked client's server owns ticking, so this is a no-op there. */
	tick(deltaMs: number): void;
}

export type { Engine };
