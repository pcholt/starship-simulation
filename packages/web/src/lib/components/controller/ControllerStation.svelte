<script lang="ts">
	import type { ModuleTarget, ScenarioScript } from '@starship/engine';
	import { ALL_MODULE_NAMES } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import Panel from '../shared/Panel.svelte';
	import { parseControllerCommand, CONTROLLER_COMMANDS } from './controller-command-parser.js';
	import { PRESET_SCENARIOS, type PresetScenario } from './preset-scenarios.js';

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

	async function handleSubmit(text: string) {
		const parsed = parseControllerCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = await store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleLoadScenario() {
		try {
			const script = JSON.parse(scenarioText) as ScenarioScript;
			await store.loadScenario(script);
			scenarioError = null;
		} catch {
			scenarioError = 'Invalid scenario JSON';
		}
	}

	async function handleRunScenario() {
		const result = await store.dispatch({ module: 'controller', type: 'RunScenario' });
		scenarioError = result.ok ? null : result.reason;
	}

	async function handleHaltScenario() {
		const result = await store.dispatch({ module: 'controller', type: 'HaltScenario' });
		scenarioError = result.ok ? null : result.reason;
	}

	async function handlePreset(preset: PresetScenario) {
		await store.loadScenario(preset.script);
		const result = await store.dispatch({ module: 'controller', type: 'RunScenario' });
		scenarioError = result.ok ? null : result.reason;
	}

	async function handleModuleLifecycle(type: 'Initialize' | 'Execute' | 'Halt', target: ModuleTarget) {
		const result = await store.dispatch({ module: 'controller', type, target });
		errorMessage = result.ok ? null : result.reason;
	}
</script>

<section aria-label="Simulation Controller station">
	<h2>Simulation Controller</h2>

	<div class="grid">
		<Panel title="Module Status" accentVar="chrome-controller">
			<table>
				<thead>
					<tr>
						<th>MODULE</th>
						<th>STATUS</th>
						<th>ACTIONS</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>all</td>
						<td></td>
						<td class="module-actions">
							<button data-testid="module-initialize-all" onclick={() => handleModuleLifecycle('Initialize', 'all')}
								>Initialize</button
							>
							<button data-testid="module-execute-all" onclick={() => handleModuleLifecycle('Execute', 'all')}>Execute</button>
							<button data-testid="module-halt-all" onclick={() => handleModuleLifecycle('Halt', 'all')}>Halt</button>
						</td>
					</tr>
					{#each ALL_MODULE_NAMES as name (name)}
						<tr>
							<td>{name}</td>
							<td data-testid={`module-status-${name}`}>{store.state.modules[name]}</td>
							<td class="module-actions">
								<button data-testid={`module-initialize-${name}`} onclick={() => handleModuleLifecycle('Initialize', name)}
									>Initialize</button
								>
								<button data-testid={`module-execute-${name}`} onclick={() => handleModuleLifecycle('Execute', name)}
									>Execute</button
								>
								<button data-testid={`module-halt-${name}`} onclick={() => handleModuleLifecycle('Halt', name)}>Halt</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Panel>

		<Panel title="Variable Display" accentVar="chrome-controller">
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
		</Panel>

		<Panel title="Alerts" accentVar="chrome-neutral">
			<div aria-label="Alerts"></div>
		</Panel>

		<Panel title="Scenario" accentVar="chrome-controller">
			<p data-testid="scenario-status">SCENARIO {scenarioRunning ? 'IS RUNNING' : 'IS NOT RUNNING'}</p>

			<h4>Preset Scenarios</h4>
			<ul data-testid="preset-scenarios" class="preset-list">
				{#each PRESET_SCENARIOS as preset (preset.id)}
					<li>
						<strong>{preset.name}</strong> — {preset.description}
						<button type="button" onclick={() => handlePreset(preset)}>Load & Run: {preset.name}</button>
					</li>
				{/each}
			</ul>

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
		</Panel>

		<Panel title="Command" accentVar="chrome-controller">
			<CommandBox onSubmit={handleSubmit} {errorMessage} accentVar="chrome-controller" />
			<CommandReference commands={CONTROLLER_COMMANDS} />
		</Panel>
	</div>
</section>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.module-actions {
		display: flex;
		gap: var(--space-2);
	}

	.preset-list {
		list-style: none;
		margin: 0 0 var(--space-4);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
