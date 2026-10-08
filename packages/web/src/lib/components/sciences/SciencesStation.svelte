<script lang="ts">
	import { FULL_SCAN_RANGE, PARTIAL_SCAN_RANGE } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	// Reused from Navigation: a generic world-space plot, not navigation-specific — it draws the
	// scan-area preview ring here rather than a course.
	import AstrogatorPlot from '../navigation/AstrogatorPlot.svelte';
	import { toPlotEntities } from '../navigation/plot-entities.js';
	import { createWeaponFireOverlayState } from '../navigation/weapon-fire-overlay-state.svelte.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let lifeSupport = $derived(store.state.lifeSupport);
	let scan = $derived(store.state.lastScanResult);
	let computer = $derived(store.state.engineering.devices.sciencesComputer!);

	let scanTargets = $derived([
		...store.state.celestialObjects.map((o) => ({ id: o.id, name: o.name, kind: 'celestial object' })),
		...store.state.enemyCraft.map((c) => ({ id: c.id, name: c.name, kind: 'enemy craft' })),
		...store.state.federationCraft.map((c) => ({ id: c.id, name: c.name, kind: 'federation craft' }))
	]);

	let plotEntities = $derived(toPlotEntities(store.state));
	// svelte-ignore state_referenced_locally
	const weaponFireOverlay = createWeaponFireOverlayState(store);

	// Offsets from the ship's current position, not absolute world coordinates — the science
	// officer aims relative to where the Enterprise is now, matching how the Astrogator plot
	// itself is always centered on the ship rather than on a fixed world point.
	let scanAreaX = $state(0);
	let scanAreaY = $state(0);

	let scanAreaWorldPosition = $derived({
		x: store.state.enterpriseNavigation.position.x + scanAreaX,
		y: store.state.enterpriseNavigation.position.y + scanAreaY,
		z: store.state.enterpriseNavigation.position.z
	});

	// Tracks the sliders live (Slider fires onChange on every `oninput`, not just on release),
	// so the preview ring on the plot below follows the science officer's finger in real time.
	let scanAreaPreview = $derived({
		center: scanAreaWorldPosition,
		radius: FULL_SCAN_RANGE
	});

	async function handleScanObject(name: string) {
		const result = await store.dispatch({ module: 'sciences', type: 'ScanObject', name });
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleScanRandom() {
		const result = await store.dispatch({ module: 'sciences', type: 'ScanRandom' });
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleScanArea() {
		const result = await store.dispatch({
			module: 'sciences',
			type: 'ScanArea',
			position: scanAreaWorldPosition
		});
		errorMessage = result.ok ? null : result.reason;
	}
</script>

<section aria-label="Sciences station">
	<h2>Sciences</h2>
	<StationStatusBar {store} moduleName="sciences" />

	<div class="grid">
		<div class="sidebar">
			<Panel title="Sciences Computer" accentVar="chrome-sciences">
				<dl>
					<dt>OPERATIONAL STATUS</dt>
					<dd data-testid="sciences-computer-opstat">{computer.operationalStatus}</dd>
					<dt>FUNCTIONAL STATUS</dt>
					<dd data-testid="sciences-computer-funcstat">{computer.functionalStatus}</dd>
				</dl>
			</Panel>

			<Panel title="Life Support" accentVar="chrome-sciences">
				<dl>
					<dt>AIR</dt>
					<dd data-testid="life-support-air">{lifeSupport.air}</dd>
					<dt>WATER</dt>
					<dd data-testid="life-support-water">{lifeSupport.water}</dd>
					<dt>FOOD</dt>
					<dd data-testid="life-support-food">{lifeSupport.food}</dd>
				</dl>
			</Panel>

			<Panel title="Scan Result" accentVar="chrome-sciences">
				<dl>
					<dt>IDENTITY</dt>
					<dd data-testid="scan-identity">{scan?.identity ?? 'NONE'}</dd>
					<dt>QUALITY</dt>
					<dd data-testid="scan-quality">{scan?.quality ?? 'NONE'}</dd>
					<dt>DISTANCE</dt>
					<dd data-testid="scan-distance">{scan ? scan.distance.toFixed(1) : 'NONE'}</dd>
					{#if scan?.radius !== undefined}
						<dt>RADIUS</dt>
						<dd data-testid="scan-radius">{scan.radius}</dd>
					{/if}
					{#if scan?.mass !== undefined}
						<dt>MASS</dt>
						<dd data-testid="scan-mass">{scan.mass}</dd>
					{/if}
					{#if scan?.mission !== undefined}
						<dt>MISSION</dt>
						<dd data-testid="scan-mission">{scan.mission}</dd>
					{/if}
				</dl>
			</Panel>
			<Panel title="Alerts" accentVar="chrome-neutral">
				<div aria-label="Alerts">
					{#if errorMessage}
						<p role="alert">{errorMessage}</p>
					{/if}
				</div>
			</Panel>
		</div>

		<div class="main-column">
			<Panel title="Scan Targets" accentVar="chrome-sciences">
				<ul class="target-list" data-testid="scan-targets">
					{#each scanTargets as target (target.kind + target.id)}
						<li>
							<button data-testid={`scan-target-${target.name}`} onclick={() => handleScanObject(target.name)}>
								{target.name} <span class="kind">({target.kind})</span>
							</button>
						</li>
					{/each}
				</ul>
				<button onclick={handleScanRandom}>Scan Randomly</button>
			</Panel>

			<Panel title="Scan Area" accentVar="chrome-sciences" grow>
				<AstrogatorPlot
					center={store.state.enterpriseNavigation.position}
					entities={plotEntities}
					range={PARTIAL_SCAN_RANGE}
					previewCircle={scanAreaPreview}
					fireFlashes={weaponFireOverlay.fireFlashes}
					explosionFlashes={weaponFireOverlay.explosionFlashes}
				/>
				<div class="scan-area-controls">
					<Slider
						label="Scan Area X"
						value={scanAreaX}
						min={-PARTIAL_SCAN_RANGE}
						max={PARTIAL_SCAN_RANGE}
						step={10}
						accentVar="chrome-sciences"
						onChange={(v) => (scanAreaX = v)}
					/>
					<Slider
						label="Scan Area Y"
						value={scanAreaY}
						min={-PARTIAL_SCAN_RANGE}
						max={PARTIAL_SCAN_RANGE}
						step={10}
						accentVar="chrome-sciences"
						onChange={(v) => (scanAreaY = v)}
					/>
					<button onclick={handleScanArea}>Scan Area</button>
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

	.target-list {
		list-style: none;
		margin: 0 0 var(--space-3);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.target-list button {
		width: 100%;
		text-align: left;
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		padding: var(--space-2) var(--space-3);
	}

	.kind {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.scan-area-controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		align-items: end;
		gap: var(--space-4);
		margin-top: var(--space-3);
	}

	@media (max-width: 800px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
