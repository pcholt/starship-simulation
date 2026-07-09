<script lang="ts">
	import type { ModuleName } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';

	interface Props {
		store: WorldStateStore;
		moduleName: ModuleName;
	}

	let { store, moduleName }: Props = $props();

	let moduleRunState = $derived(store.state.modules[moduleName]);
	let scenarioRunning = $derived(store.state.scenario?.runState === 'running');
</script>

<div class="station-status" data-halted={moduleRunState === 'halted'}>
	<span>
		MODULE: <strong data-testid="module-run-state">{moduleRunState.toUpperCase()}</strong>
	</span>
	<span>
		SCENARIO: <strong data-testid="scenario-run-state">{scenarioRunning ? 'RUNNING' : 'NOT RUNNING'}</strong>
	</span>
	{#if moduleRunState === 'halted'}
		<p role="alert">This station is halted — commands will have no effect until the Simulation Controller executes it again.</p>
	{/if}
</div>

<style>
	.station-status {
		display: flex;
		gap: 1.5rem;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.station-status[data-halted='true'] {
		color: #b00020;
	}
</style>
