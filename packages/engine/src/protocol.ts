import type { Command, CommandResult } from './commands.js';
import type { EngineEvent } from './events.js';
import type { ScenarioScript } from './scenario/scenario.js';
import type { WorldState } from './domain/world-state.js';

/**
 * The wire protocol between a networked `EngineClient` and the server that
 * owns the real `Engine` instance. Kept here (not in `web` or `server`) since
 * both sides need to agree on it — it's the transport-agnostic contract the
 * whole client/server split is built around.
 */
export type ClientMessage =
	| { type: 'dispatch'; requestId: string; command: Command }
	| { type: 'loadScenario'; requestId: string; script: ScenarioScript };

export type ServerMessage =
	| { type: 'init'; state: WorldState }
	| { type: 'state'; state: WorldState }
	| { type: 'event'; event: EngineEvent }
	| { type: 'dispatchResult'; requestId: string; result: CommandResult };
