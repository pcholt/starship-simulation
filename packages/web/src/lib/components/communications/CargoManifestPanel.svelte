<script lang="ts">
	import type { CargoManifest, StoredCargoItem } from '@starship/engine';
	import '../../dense-table.css';
	import Panel from '../shared/Panel.svelte';
	import { buildEnterpriseCargoRows, buildHolderManifestViews, describeCommunicationsRange } from './cargo-manifest-view.js';

	interface Props {
		enterpriseCargo: StoredCargoItem[];
		manifestsInRange: CargoManifest[];
		communicationsRange: number;
	}

	let { enterpriseCargo, manifestsInRange, communicationsRange }: Props = $props();

	let enterpriseRows = $derived(buildEnterpriseCargoRows(enterpriseCargo));
	let holderViews = $derived(buildHolderManifestViews(manifestsInRange));
</script>

<Panel title="Cargo Manifest" accentVar="chrome-communications">
	<h4>Enterprise</h4>
	<table class="dense-table" data-testid="enterprise-cargo">
		<thead>
			<tr><th>Cargo</th><th>Quantity</th><th>Stored</th></tr>
		</thead>
		<tbody>
			{#each enterpriseRows as row (row.type)}
				<tr data-testid={`enterprise-cargo-${row.type}`}>
					<td>{row.label}</td>
					<td>{row.quantity}</td>
					<td>{row.locationLabel}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h4>In communication range <span class="range" data-testid="comms-range">({describeCommunicationsRange(communicationsRange)})</span></h4>
	{#if holderViews.length === 0}
		<p class="none-in-range" data-testid="no-manifests-in-range">Nothing in communication range.</p>
	{/if}
	{#each holderViews as view (view.key)}
		<section class="holder" data-testid={`manifest-${view.key}`}>
			<header>
				<strong>{view.name}</strong>
				<span>{view.holderLabel} · {view.distanceLabel}</span>
			</header>
			{#if view.lines.length === 0}
				<p class="empty-hold">Empty hold</p>
			{:else}
				<table class="dense-table">
					<tbody>
						{#each view.lines as line (line.type)}
							<tr><td>{line.label}</td><td>{line.quantity}</td></tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>
	{/each}
</Panel>

<style>
	h4 {
		margin: var(--space-3) 0 var(--space-1);
		font-size: 0.75rem;
	}

	h4:first-child {
		margin-top: 0;
	}

	.range {
		font-family: var(--font-data);
		color: var(--text-muted);
		text-transform: none;
	}

	.holder {
		margin-bottom: var(--space-2);
		padding: var(--space-1) var(--space-2);
		background: var(--panel-alt);
		border-left: 0.25rem solid var(--chrome-communications);
		border-radius: var(--radius-sm);
	}

	.holder header {
		display: flex;
		justify-content: space-between;
		gap: var(--space-3);
		font-size: 0.72rem;
	}

	.holder header span {
		color: var(--text-muted);
	}

	.none-in-range,
	.empty-hold {
		margin: 0;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
</style>
