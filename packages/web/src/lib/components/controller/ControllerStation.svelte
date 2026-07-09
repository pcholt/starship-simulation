<script lang="ts">
	import type { ScenarioScript } from '@starship/engine';
	import { ALL_MODULE_NAMES } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import { parseControllerCommand, CONTROLLER_COMMANDS } from './controller-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);
	let scenarioText = $state('');
	let scenarioError: string | null = $state(null);
	let selectedModule: string = $state('all');

	let scenarioRunning = $derived(store.state.scenario?.runState === 'running');

	// The book's "NAME OF MODULE WHOSE VARIABLES ARE BEING DISPLAYED" field, with each
	// top-level state field rendered as a VARIABLE NAME / VALUE row (Figure 3.3).
	let displayedVariables = $derived.by(() => {
		const state = store.state as unknown as Record<string, unknown>;
		const source = selectedModule === 'all' ? state : { [selectedModule]: state[selectedModule] };
		return Object.entries(source).map(([name, value]) => ({
			name,
			value: typeof value === 'object' ? JSON.stringify(value) : String(value)
		}));
	});

	function handleSubmit(text: string) {
		const parsed = parseControllerCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}

	function handleLoadScenario() {
		try {
			const script = JSON.parse(scenarioText) as ScenarioScript;
			store.loadScenario(script);
			scenarioError = null;
		} catch {
			scenarioError = 'Invalid scenario JSON';
		}
	}

	function handleRunScenario() {
		store.dispatch({ module: 'controller', type: 'RunScenario' });
	}

	function handleHaltScenario() {
		store.dispatch({ module: 'controller', type: 'HaltScenario' });
	}
</script>

<section aria-label="Simulation Controller station">
	<h2>Simulation Controller</h2>

	<h3>Module Status</h3>
	<table>
		<thead>
			<tr>
				<th>MODULE</th>
				<th>STATUS</th>
			</tr>
		</thead>
		<tbody>
			{#each ALL_MODULE_NAMES as name (name)}
				<tr>
					<td>{name}</td>
					<td data-testid={`module-status-${name}`}>{store.state.modules[name]}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3>Variable Display</h3>
	<label>
		NAME OF MODULE WHOSE VARIABLES ARE BEING DISPLAYED:
		<select bind:value={selectedModule}>
			<option value="all">all</option>
			{#each ALL_MODULE_NAMES as name (name)}
				<option value={name}>{name}</option>
			{/each}
		</select>
	</label>
	<table>
		<thead>
			<tr>
				<th>VARIABLE NAME</th>
				<th>VALUE</th>
			</tr>
		</thead>
		<tbody data-testid="variable-display">
			{#each displayedVariables as row (row.name)}
				<tr>
					<td>{row.name}</td>
					<td>{row.value}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<h3>Scenario</h3>
	<p data-testid="scenario-status">SCENARIO {scenarioRunning ? 'IS RUNNING' : 'IS NOT RUNNING'}</p>
	<label>
		Scenario script (JSON)
		<textarea aria-label="Scenario script" bind:value={scenarioText}></textarea>
	</label>
	<button type="button" onclick={handleLoadScenario}>Load Scenario</button>
	<button type="button" onclick={handleRunScenario}>Run Scenario</button>
	<button type="button" onclick={handleHaltScenario}>Halt Scenario</button>
	{#if scenarioError}
		<p role="alert">{scenarioError}</p>
	{/if}

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
	<CommandReference commands={CONTROLLER_COMMANDS} />
</section>
