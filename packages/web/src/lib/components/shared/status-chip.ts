import type { ModuleRunState, ScenarioRunState } from '@starship/engine';

export type StatusLevel = 'ok' | 'warning' | 'critical' | 'neutral';

/** A running module/scenario reads as nominal (ok); halted reads as a caution state, not an error — it's often a deliberate GM action. */
export function runStateToStatus(runState: ModuleRunState | ScenarioRunState): StatusLevel {
	return runState === 'running' ? 'ok' : 'warning';
}
