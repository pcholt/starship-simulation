<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import { parseEngineeringCommand, ENGINEERING_COMMANDS } from './engineering-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let devices = $derived(Object.entries(store.state.engineering.devices));
	let shuttlecraft = $derived(store.state.engineering.shuttlecraft);

	async function handleSubmit(text: string) {
		const parsed = parseEngineeringCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = await store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}
</script>

<section aria-label="Engineering station">
	<h2>Engineering</h2>
	<StationStatusBar {store} moduleName="engineering" />

	<h3>Devices</h3>
	<table>
		<thead>
			<tr>
				<th>DEVICE</th>
				<th>FUNC</th>
				<th>OPER</th>
				<th>REL</th>
				<th>ENERGY</th>
			</tr>
		</thead>
		<tbody>
			{#each devices as [id, device] (id)}
				<tr>
					<td>{id}</td>
					<td>{device.functionalStatus}</td>
					<td>{device.operationalStatus}</td>
					<td>{device.reliabilityFactor}</td>
					<td data-testid={`device-${id}-energy`}>{device.energyAssigned.toFixed(0)}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3>Shuttlecraft</h3>
	<table>
		<thead>
			<tr>
				<th>NBR</th>
				<th>MISSION</th>
			</tr>
		</thead>
		<tbody>
			{#each shuttlecraft as shuttle (shuttle.id)}
				<tr>
					<td>{shuttle.id}</td>
					<td data-testid={`shuttlecraft-${shuttle.id}-mission`}>{shuttle.mission}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
	<CommandReference commands={ENGINEERING_COMMANDS} />
</section>
