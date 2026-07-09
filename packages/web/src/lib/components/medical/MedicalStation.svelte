<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StationStatusBar from '../shared/StationStatusBar.svelte';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();

	let icu = $derived(store.state.medical.icu);
	let computer = $derived(store.state.engineering.devices.intensiveCareUnit!);
</script>

<section aria-label="Medical station">
	<h2>Medical</h2>
	<StationStatusBar {store} moduleName="medical" />

	<h3>Intensive Care Unit</h3>
	<table>
		<thead>
			<tr>
				<th>UNIT</th>
				<th>NAME</th>
				<th>HEALTH</th>
			</tr>
		</thead>
		<tbody>
			{#each icu as patient, i (i)}
				<tr>
					<td>{i + 1}</td>
					<td data-testid={`icu-slot-${i}`}>
						{#if patient}
							{patient.name} ({patient.health.toFixed(1)})
						{:else}
							EMPTY
						{/if}
					</td>
					<td></td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3>Medical Computer</h3>
	<dl>
		<dt>OPSTAT</dt>
		<dd>{computer.operationalStatus}</dd>
		<dt>FUNCSTAT</dt>
		<dd>{computer.functionalStatus}</dd>
	</dl>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<p><em>Medical has no direct operator commands — patients are admitted via the Communications officer.</em></p>
</section>
