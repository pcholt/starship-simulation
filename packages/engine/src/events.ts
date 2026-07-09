import type { Command } from './commands.js';

/**
 * Everything the engine emits via `subscribe`. This is deliberately the same
 * shape a future websocket relay would forward to remote clients, so no
 * engine or component code needs to change when a networked transport is
 * added later.
 */
export type EngineEvent =
	| { type: 'StateChanged'; paths: readonly string[] }
	| { type: 'AlertRaised'; module: string; severity: 'info' | 'warning' | 'critical'; message: string }
	| { type: 'ScenarioStepExecuted'; atMs: number; command: Command };

export type Unsubscribe = () => void;
