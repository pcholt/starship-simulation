<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import { parseHelmCommand, HELM_COMMANDS } from './helm-command-parser.js';

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
	let phasers = $derived(
		(['fore', 'aft', 'port', 'starboard', 'top', 'bottom'] as const).map((location) => ({
			location,
			device: store.state.engineering.devices[`phaser-${location}`]!
		}))
	);
	let torpedoTubes = $derived(
		[1, 2, 3, 4, 5, 6].map((n) => ({ number: n, device: store.state.engineering.devices[`torpedoTube-${n}`]! }))
	);

	function describeTarget(command: { type: 'FirePhasers' | 'FireTorpedo'; target: { kind: string; name?: string } }): string {
		return command.target.kind === 'object' ? command.target.name! : 'coordinates';
	}

	async function handleSubmit(text: string) {
		const parsed = parseHelmCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = await store.dispatch(parsed.command);
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
	<StationStatusBar {store} moduleName="helm" />

	<h3>Phasers</h3>
	<table>
		<thead>
			<tr>
				<th>NBR</th>
				<th>OP</th>
				<th>FUNC</th>
				<th>REL</th>
			</tr>
		</thead>
		<tbody>
			{#each phasers as phaser (phaser.location)}
				<tr>
					<td>{phaser.location.toUpperCase()}</td>
					<td>{phaser.device.operationalStatus}</td>
					<td data-testid={`phaser-${phaser.location}-func`}>{phaser.device.functionalStatus}</td>
					<td>{phaser.device.reliabilityFactor}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3>Torpedo Tubes</h3>
	<table>
		<thead>
			<tr>
				<th>STA</th>
				<th>OP</th>
				<th>FUNC</th>
				<th>REL</th>
			</tr>
		</thead>
		<tbody>
			{#each torpedoTubes as tube (tube.number)}
				<tr>
					<td>{tube.number}</td>
					<td>{tube.device.operationalStatus}</td>
					<td data-testid={`torpedo-tube-${tube.number}-func`}>{tube.device.functionalStatus}</td>
					<td>{tube.device.reliabilityFactor}</td>
				</tr>
			{/each}
		</tbody>
	</table>

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
	<CommandReference commands={HELM_COMMANDS} />
</section>
