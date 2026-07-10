<script lang="ts">
	import type { ModuleName } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StatusChip from './StatusChip.svelte';
	import { runStateToStatus } from './status-chip.js';

	interface Props {
		store: WorldStateStore;
		moduleName: ModuleName;
	}

	let { store, moduleName }: Props = $props();

	let moduleRunState = $derived(store.state.modules[moduleName]);
	let scenarioRunState = $derived(store.state.scenario?.runState ?? 'halted');
</script>

<div class="station-status">
	<span class="field">
		MODULE
		<span data-testid="module-run-state">
			<StatusChip label={moduleRunState.toUpperCase()} status={runStateToStatus(moduleRunState)} />
		</span>
	</span>
	<span class="field">
		SCENARIO
		<span data-testid="scenario-run-state">
			<StatusChip
				label={scenarioRunState === 'running' ? 'RUNNING' : 'NOT RUNNING'}
				status={runStateToStatus(scenarioRunState)}
			/>
		</span>
	</span>
	{#if moduleRunState === 'halted'}
		<p role="alert">This station is halted — commands will have no effect until the Simulation Controller executes it again.</p>
	{/if}
</div>

<style>
	.station-status {
		display: flex;
		gap: var(--space-6);
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-4);
	}
	.field {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-body);
		font-weight: 600;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}
	[role='alert'] {
		color: var(--status-warning);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
