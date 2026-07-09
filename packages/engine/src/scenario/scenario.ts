import type { Command } from '../commands.js';

/** One scripted event: dispatch `command` once the simulated clock reaches `atMs`. */
export interface ScenarioStep {
	atMs: number;
	command: Command;
}

export interface ScenarioScript {
	steps: ScenarioStep[];
}

export type ScenarioRunState = 'running' | 'halted';

export interface ScenarioRuntimeState {
	script: ScenarioScript;
	runState: ScenarioRunState;
	/** Index into `script.steps` of the next step not yet executed (steps are required to be in ascending `atMs` order). */
	nextStepIndex: number;
}

export function createScenarioRuntimeState(script: ScenarioScript): ScenarioRuntimeState {
	return { script, runState: 'halted', nextStepIndex: 0 };
}

/** Steps whose `atMs` has been reached by `simulatedTimeMs`, in order, without mutating the runtime state. */
export function dueSteps(state: ScenarioRuntimeState, simulatedTimeMs: number): ScenarioStep[] {
	if (state.runState !== 'running') return [];
	const due: ScenarioStep[] = [];
	for (let i = state.nextStepIndex; i < state.script.steps.length; i++) {
		const step = state.script.steps[i]!;
		if (step.atMs > simulatedTimeMs) break;
		due.push(step);
	}
	return due;
}
