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
	/**
	 * Time elapsed since the scenario started running, in ms — what `ScenarioStep.atMs` is
	 * measured against. Deliberately its own clock rather than the engine's absolute
	 * `simulatedTimeMs`: a scenario loaded and run after the session has been running a while
	 * (or paused via Halt) must still time its steps from its own start, not from session start.
	 */
	elapsedMs: number;
}

export function createScenarioRuntimeState(script: ScenarioScript): ScenarioRuntimeState {
	return { script, runState: 'halted', nextStepIndex: 0, elapsedMs: 0 };
}

/** Steps whose `atMs` has been reached by the scenario's own elapsed time, in order, without mutating the runtime state. */
export function dueSteps(state: ScenarioRuntimeState): ScenarioStep[] {
	if (state.runState !== 'running') return [];
	const due: ScenarioStep[] = [];
	for (let i = state.nextStepIndex; i < state.script.steps.length; i++) {
		const step = state.script.steps[i]!;
		if (step.atMs > state.elapsedMs) break;
		due.push(step);
	}
	return due;
}
