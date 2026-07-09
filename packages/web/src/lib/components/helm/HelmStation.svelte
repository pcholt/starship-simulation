<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import { parseHelmCommand } from './helm-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);
	let weaponsLog: string[] = $state([]);

	let shields = $derived(
		(['fore', 'aft', 'port', 'starboard', 'top', 'bottom'] as const).map((location) => ({
			location,
			device: store.state.engineering.devices[`shield-${location}`]!
		}))
	);

	function describeTarget(command: { type: 'FirePhasers' | 'FireTorpedo'; target: { kind: string; name?: string } }): string {
		return command.target.kind === 'object' ? command.target.name! : 'coordinates';
	}

	function handleSubmit(text: string) {
		const parsed = parseHelmCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = store.dispatch(parsed.command);
		if (!result.ok) {
			errorMessage = result.reason;
			return;
		}
		errorMessage = null;
		if (parsed.command.type === 'FirePhasers' || parsed.command.type === 'FireTorpedo') {
			const weapon = parsed.command.type === 'FirePhasers' ? 'Phasers' : 'Torpedo';
			weaponsLog = [`${weapon} fired at ${describeTarget(parsed.command)}`, ...weaponsLog].slice(0, 10);
		}
	}
</script>

<section aria-label="Helm station">
	<h2>Helm</h2>

	<h3>Shields</h3>
	<table>
		<thead>
			<tr>
				<th>LOC</th>
				<th>FUNC</th>
				<th>LEVEL</th>
			</tr>
		</thead>
		<tbody>
			{#each shields as shield (shield.location)}
				<tr>
					<td>{shield.location.toUpperCase()}</td>
					<td>{shield.device.functionalStatus}</td>
					<td data-testid={`shield-${shield.location}-level`}>{shield.device.operationalStatus}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3>Weapons Log</h3>
	<ul data-testid="weapons-log">
		{#each weaponsLog as entry, i (i)}
			<li>{entry}</li>
		{/each}
	</ul>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
</section>
