<script lang="ts">
	import { PARTIAL_SCAN_RANGE, type BankLocation } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	import SafetyCover from '../shared/SafetyCover.svelte';
	import AstrogatorPlot from '../navigation/AstrogatorPlot.svelte';
	import { toPlotEntities } from '../navigation/plot-entities.js';
	import { createWeaponFireOverlayState } from '../navigation/weapon-fire-overlay-state.svelte.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);
	let weaponsLog: string[] = $state([]);

	const LOCATIONS = ['fore', 'aft', 'port', 'starboard'] as const;

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
		...store.state.enemyCraft.map((c) => ({ id: c.id, name: c.name, kind: 'enemy craft', hullIntegrity: c.hullIntegrity })),
		...store.state.federationCraft.map((c) => ({ id: c.id, name: c.name, kind: 'federation craft', hullIntegrity: c.hullIntegrity }))
	]);

	let plotEntities = $derived(toPlotEntities(store.state));
	// svelte-ignore state_referenced_locally
	const weaponFireOverlay = createWeaponFireOverlayState(store);

	// Offsets from the ship's current position, not absolute world coordinates — the same
	// convention as Sciences' scan area, since the plot is always centered on the Enterprise.
	let aimOffsetX = $state(0);
	let aimOffsetY = $state(0);

	let aimPoint = $derived({
		x: store.state.enterpriseNavigation.position.x + aimOffsetX,
		y: store.state.enterpriseNavigation.position.y + aimOffsetY,
		z: store.state.enterpriseNavigation.position.z
	});

	const AIM_MARKER_RADIUS = 15;

	function handleSelectAimPoint(position: { x: number; y: number; z: number }) {
		const ship = store.state.enterpriseNavigation.position;
		aimOffsetX = Math.round(position.x - ship.x);
		aimOffsetY = Math.round(position.y - ship.y);
	}

	function describeAimPoint(): string {
		return `coordinates (${Math.round(aimPoint.x)}, ${Math.round(aimPoint.y)})`;
	}

	let liftedCoverCraftIds = $derived(store.state.helm.liftedWeaponCoverCraftIds);

	async function handleSetWeaponCover(craftId: number, lifted: boolean) {
		const result = await store.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId, lifted });
		errorMessage = result.ok ? null : result.reason;
	}

	function logWeaponResult(weapon: 'Phasers' | 'Torpedo', targetName: string) {
		weaponsLog = [`${weapon} fired at ${targetName}`, ...weaponsLog].slice(0, 10);
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

	async function handleFirePhasersAtAimPoint() {
		const result = await store.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position: aimPoint } });
		errorMessage = result.ok ? null : result.reason;
		if (result.ok) logWeaponResult('Phasers', describeAimPoint());
	}

	async function handleFireTorpedoAtAimPoint() {
		const result = await store.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'coordinates', position: aimPoint } });
		errorMessage = result.ok ? null : result.reason;
		if (result.ok) logWeaponResult('Torpedo', describeAimPoint());
	}
</script>

{#snippet fireButtons(targetName: string)}
	<button data-testid={`fire-phasers-${targetName}`} onclick={() => handleFirePhasers(targetName)}>Fire Phasers</button>
	<button data-testid={`fire-torpedo-${targetName}`} onclick={() => handleFireTorpedo(targetName)}>Fire Torpedo</button>
{/snippet}

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
					{#each targets as target (target.kind + target.id)}
						<li>
							<span class="target-name">{target.name} <span class="kind">({target.kind})</span></span>
							<span class="hull-readout">
								<span class="hull-bar"><span class="hull-bar-fill" style={`width: ${target.hullIntegrity}%`}></span></span>
								<span data-testid={`target-hull-${target.id}`}>{target.hullIntegrity}%</span>
							</span>
							{#if target.kind === 'federation craft'}
								<SafetyCover
									protects={`weapons aimed at ${target.name}`}
									open={liftedCoverCraftIds.includes(target.id)}
									onOpenChange={(lifted) => handleSetWeaponCover(target.id, lifted)}
									testId={`safety-cover-${target.name}`}
								>
									{@render fireButtons(target.name)}
								</SafetyCover>
							{:else}
								{@render fireButtons(target.name)}
							{/if}
						</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Aim Point" accentVar="chrome-helm" grow>
				<AstrogatorPlot
					center={store.state.enterpriseNavigation.position}
					entities={plotEntities}
					range={PARTIAL_SCAN_RANGE}
					onSelectPoint={handleSelectAimPoint}
					previewCircle={{ center: aimPoint, radius: AIM_MARKER_RADIUS }}
					previewLabel="Aim point"
					previewAccentVar="chrome-helm"
					fireFlashes={weaponFireOverlay.fireFlashes}
					explosionFlashes={weaponFireOverlay.explosionFlashes}
				/>
				<div class="aim-controls">
					<Slider label="Aim X" value={aimOffsetX} min={-PARTIAL_SCAN_RANGE} max={PARTIAL_SCAN_RANGE} step={10} accentVar="chrome-helm" testId="aim-x" onChange={(v) => (aimOffsetX = v)} />
					<Slider label="Aim Y" value={aimOffsetY} min={-PARTIAL_SCAN_RANGE} max={PARTIAL_SCAN_RANGE} step={10} accentVar="chrome-helm" testId="aim-y" onChange={(v) => (aimOffsetY = v)} />
					<div class="aim-buttons">
						<button type="button" onclick={handleFirePhasersAtAimPoint}>Fire Phasers at Aim Point</button>
						<button type="button" onclick={handleFireTorpedoAtAimPoint}>Fire Torpedo at Aim Point</button>
					</div>
				</div>
			</Panel>

			<Panel title="Weapons Log" accentVar="chrome-neutral">
				<ul data-testid="weapons-log">
					{#each weaponsLog as entry, i (i)}
						<li>{entry}</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Alerts" accentVar="chrome-neutral">
				<div aria-label="Alerts">
					{#if errorMessage}
						<p role="alert">{errorMessage}</p>
					{/if}
				</div>
			</Panel>

		</div>
	</div>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.aim-controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-3) var(--space-4);
		margin-top: var(--space-3);
		align-items: center;
	}

	.aim-buttons {
		display: flex;
		gap: var(--space-2);
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(260px, 320px) 1fr;
		gap: var(--space-4);
		flex: 1;
		min-height: 0;
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

	.hull-readout {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-variant-numeric: tabular-nums;
	}

	.hull-bar {
		display: inline-block;
		width: 4rem;
		height: 0.5rem;
		background: var(--panel-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.hull-bar-fill {
		display: block;
		height: 100%;
		background: var(--chrome-helm);
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
