<script lang="ts">
	import type { BankLocation } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	import { parseHelmCommand, HELM_COMMANDS } from './helm-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);
	let weaponsLog: string[] = $state([]);

	const LOCATIONS = ['fore', 'aft', 'port', 'starboard', 'top', 'bottom'] as const;

	let shields = $derived(
		LOCATIONS.map((location) => ({
			location,
			device: store.state.engineering.devices[`shield-${location}`]!
		}))
	);
	let phasers = $derived(
		LOCATIONS.map((location) => ({
			location,
			device: store.state.engineering.devices[`phaser-${location}`]!
		}))
	);
	let torpedoTubes = $derived(
		[1, 2, 3, 4, 5, 6].map((n) => ({ number: n, device: store.state.engineering.devices[`torpedoTube-${n}`]! }))
	);

	let targets = $derived([
		...store.state.enemyCraft.map((c) => ({ name: c.name, kind: 'enemy craft' })),
		...store.state.federationCraft.map((c) => ({ name: c.name, kind: 'federation craft' }))
	]);

	function describeTarget(command: { type: 'FirePhasers' | 'FireTorpedo'; target: { kind: string; name?: string } }): string {
		return command.target.kind === 'object' ? command.target.name! : 'coordinates';
	}

	function logWeaponResult(weapon: 'Phasers' | 'Torpedo', targetName: string) {
		weaponsLog = [`${weapon} fired at ${targetName}`, ...weaponsLog].slice(0, 10);
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
			logWeaponResult(weapon, describeTarget(parsed.command));
		}
	}

	async function handleSetShieldLevel(location: BankLocation, level: number) {
		const result = await store.dispatch({ module: 'helm', type: 'SetShieldLevel', location, level });
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleFirePhasers(name: string) {
		const result = await store.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name } });
		errorMessage = result.ok ? null : result.reason;
		if (result.ok) logWeaponResult('Phasers', name);
	}

	async function handleFireTorpedo(name: string) {
		const result = await store.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name } });
		errorMessage = result.ok ? null : result.reason;
		if (result.ok) logWeaponResult('Torpedo', name);
	}
</script>

<section aria-label="Helm station">
	<h2>Helm</h2>
	<StationStatusBar {store} moduleName="helm" />

	<div class="grid">
		<div class="sidebar">
			<Panel title="Shields" accentVar="chrome-helm">
				<div class="shield-controls">
					{#each shields as shield (shield.location)}
						<Slider
							label={`Shield ${shield.location.charAt(0).toUpperCase()}${shield.location.slice(1)}`}
							value={shield.device.operationalStatus}
							min={0}
							max={100}
							step={1}
							unit="%"
							accentVar="chrome-helm"
							testId={`shield-${shield.location}-level`}
							onChange={(v) => handleSetShieldLevel(shield.location, v)}
						/>
					{/each}
				</div>
			</Panel>

			<Panel title="Phasers" accentVar="chrome-helm">
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
			</Panel>

			<Panel title="Torpedo Tubes" accentVar="chrome-helm">
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
			</Panel>
		</div>

		<div class="main-column">
			<Panel title="Weapons Targeting" accentVar="chrome-helm">
				<ul class="target-list" data-testid="targets">
					{#each targets as target (target.name)}
						<li>
							<span class="target-name">{target.name} <span class="kind">({target.kind})</span></span>
							<button data-testid={`fire-phasers-${target.name}`} onclick={() => handleFirePhasers(target.name)}>Fire Phasers</button>
							<button data-testid={`fire-torpedo-${target.name}`} onclick={() => handleFireTorpedo(target.name)}>Fire Torpedo</button>
						</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Weapons Log" accentVar="chrome-neutral">
				<ul data-testid="weapons-log">
					{#each weaponsLog as entry, i (i)}
						<li>{entry}</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Alerts" accentVar="chrome-neutral">
				<div aria-label="Alerts"></div>
			</Panel>

			<Panel title="Command" accentVar="chrome-helm">
				<CommandBox onSubmit={handleSubmit} {errorMessage} accentVar="chrome-helm" />
				<CommandReference commands={HELM_COMMANDS} />
			</Panel>
		</div>
	</div>
</section>

<style>
	.grid {
		display: grid;
		grid-template-columns: minmax(260px, 320px) 1fr;
		gap: var(--space-4);
		align-items: start;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.main-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}

	.shield-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.target-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.target-list li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.target-name {
		flex: 1;
	}

	.kind {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	@media (max-width: 800px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
