<script lang="ts">
	import type { Shuttle } from '@starship/engine';
	import Panel from '../shared/Panel.svelte';

	interface Props {
		shuttles: Shuttle[];
		onLaunch: (shuttleId: number) => void;
		onRecall: (shuttleId: number) => void;
	}

	let { shuttles, onLaunch, onRecall }: Props = $props();
</script>

<Panel title="Shuttles" accentVar="chrome-controller">
	<ul class="shuttle-list" data-testid="shuttle-controls">
		{#each shuttles as shuttle (shuttle.id)}
			<li>
				<span class="shuttle-name">{shuttle.name}</span>
				<span class="shuttle-status" data-testid={`shuttle-status-${shuttle.id}`}>
					{shuttle.status === 'inFlight' ? 'IN FLIGHT' : 'IN BAY'}
				</span>
				{#if shuttle.status === 'inFlight'}
					<button type="button" onclick={() => onRecall(shuttle.id)}>Recall {shuttle.name}</button>
				{:else}
					<button type="button" onclick={() => onLaunch(shuttle.id)}>Launch {shuttle.name}</button>
				{/if}
			</li>
		{/each}
	</ul>
</Panel>

<style>
	.shuttle-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--space-3);
	}

	.shuttle-status {
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
</style>
