<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import { BANK_LOCATIONS, distanceBetween, FULL_SCAN_RANGE, PARTIAL_SCAN_RANGE, PHASER_RANGE_HALF_LIFE } from '@starship/engine';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	import { formatChronometer, formatCoordinate } from '../../format.js';
	import AstrogatorPlot from './AstrogatorPlot.svelte';
	import CompassDial from './CompassDial.svelte';
	import { parseNavigationCommand, NAVIGATION_COMMANDS } from './navigation-command-parser.js';
	import { toPlotEntities } from './plot-entities.js';
	import { createAstrogatorOverlayState } from './astrogator-overlay-state.svelte.js';
	import { createWeaponFireOverlayState } from './weapon-fire-overlay-state.svelte.js';

	/** How far ahead (and at what resolution) to project the ship's future track on the Astrogator. */
	const PROJECTED_PATH_SECONDS = 20;
	const PROJECTED_PATH_STEP_SECONDS = 1;

	/** Plot radius in world distance-units — matches Sciences' partial-scan range, since both represent sensor reach. */
	const PLOT_RANGE = 1000;
	/** 0-20 warp, per the book's navigation data spec. */
	const MAX_WARP_SPEED = 20;

	// Torpedoes have no fixed range ring (their reach depends on fuel and target speed, not a
	// simple radius), so only sensors and phasers get one — phasers use their damage half-life as
	// the "effective range" since damage merely decays with distance rather than cutting off sharply.
	const RANGE_CIRCLES = [
		{ label: 'Full Sensors', radius: FULL_SCAN_RANGE },
		{ label: 'Sensors', radius: PARTIAL_SCAN_RANGE },
		{ label: 'Phasers', radius: PHASER_RANGE_HALF_LIFE }
	];

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let navigation = $derived(store.state.enterpriseNavigation);
	let destinationLabel = $derived.by(() => {
		const destination = navigation.destination;
		if (!destination) return 'NONE';
		if (destination.kind === 'coordinates')
			return `${formatCoordinate(destination.x)}, ${formatCoordinate(destination.y)}, ${formatCoordinate(destination.z)}`;
		if (destination.kind === 'celestialObject') return `Celestial Object #${destination.id}`;
		if (destination.kind === 'craft') return `${destination.craftClass} #${destination.id}`;
		return destination.kind;
	});

	// Resolves the destination to a concrete point so ETA can be computed, whatever kind of Location it is.
	let destinationPosition = $derived.by(() => {
		const destination = navigation.destination;
		if (!destination) return null;
		if (destination.kind === 'coordinates') return { x: destination.x, y: destination.y, z: destination.z };
		if (destination.kind === 'celestialObject') {
			return store.state.celestialObjects.find((o) => o.id === destination.id)?.position ?? null;
		}
		if (destination.kind === 'craft') {
			const fleet = destination.craftClass === 'enemy' ? store.state.enemyCraft : store.state.federationCraft;
			return fleet.find((c) => c.id === destination.id)?.position ?? null;
		}
		return null;
	});

	let eta = $derived.by(() => {
		if (!destinationPosition || navigation.velocity.warpSpeed <= 0) return 'N/A';
		const distance = distanceBetween(navigation.position, destinationPosition);
		return `${(distance / navigation.velocity.warpSpeed).toFixed(1)}s`;
	});

	let plotEntities = $derived(toPlotEntities(store.state));

	// Supplementary detail table alongside the Astrogator plot — the same entities, but with exact distance and no range cutoff.
	let nearbyObjects = $derived(
		plotEntities
			.map((e) => ({ ...e, distance: distanceBetween(navigation.position, e.position) }))
			.sort((a, b) => a.distance - b.distance)
	);

	const KIND_LABELS = {
		celestialObject: 'celestial object',
		enemyCraft: 'enemy craft',
		federationCraft: 'federation craft',
		torpedo: 'torpedo'
	};

	let shieldOverlay = $derived({
		headingDeg: navigation.velocity.xyAngleDeg,
		levels: BANK_LOCATIONS.map((location) => ({
			location,
			level: store.state.engineering.devices[`shield-${location}`]!.operationalStatus
		}))
	});

	// The composable takes the store instance once and reads store.state reactively from inside its
	// own $effect from then on — `store` itself (the object reference) is never reassigned by the
	// parent, only its `.state` field, so capturing it here is safe despite the linter's caution.
	// svelte-ignore state_referenced_locally
	const astrogatorOverlay = createAstrogatorOverlayState(store, {
		scanFlashRadius: FULL_SCAN_RANGE,
		projectedPathSeconds: PROJECTED_PATH_SECONDS,
		projectedPathStepSeconds: PROJECTED_PATH_STEP_SECONDS
	});
	let shipProjectedPath = $derived(astrogatorOverlay.projectedPath(navigation));
	// svelte-ignore state_referenced_locally
	const weaponFireOverlay = createWeaponFireOverlayState(store);

	async function handleSubmit(text: string) {
		const parsed = parseNavigationCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = await store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleSpeedChange(warpSpeed: number) {
		await store.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed });
	}

	// Preserves the *intended* value of the other axis, not the (possibly still turning) actual
	// value — otherwise nudging one axis while a turn on the other axis is still in progress would
	// silently cancel that in-progress turn back to wherever the ship currently happens to be facing.
	async function handleHeadingChange(xyAngleDeg: number) {
		await store.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg, xzAngleDeg: navigation.intendedDirection.xzAngleDeg });
	}

	async function handlePitchChange(xzAngleDeg: number) {
		await store.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: navigation.intendedDirection.xyAngleDeg, xzAngleDeg });
	}

	async function handleSelectPoint(position: { x: number; y: number; z: number }) {
		await store.dispatch({ module: 'navigation', type: 'SetCourse', destination: { kind: 'coordinates', ...position } });
	}
</script>

<section aria-label="Navigation station">
	<h2>Navigation</h2>
	<StationStatusBar {store} moduleName="navigation" />

	<div class="grid">
		<div class="sidebar">
			<Panel title="Position & Heading" accentVar="chrome-navigation">
				<dl>
					<dt>X-COORDINATE</dt>
					<dd data-testid="nav-position-x">{formatCoordinate(navigation.position.x)}</dd>
					<dt>Y-COORDINATE</dt>
					<dd data-testid="nav-position-y">{formatCoordinate(navigation.position.y)}</dd>
					<dt>Z-COORDINATE</dt>
					<dd data-testid="nav-position-z">{formatCoordinate(navigation.position.z)}</dd>

					<dt>X/Y DIRECTION</dt>
					<dd data-testid="nav-xy-angle">{Math.round(navigation.velocity.xyAngleDeg)}</dd>
					<dt>X/Z DIRECTION</dt>
					<dd data-testid="nav-xz-angle">{Math.round(navigation.velocity.xzAngleDeg)}</dd>
					<dt>SPEED</dt>
					<dd data-testid="nav-speed">{navigation.velocity.warpSpeed}</dd>
				</dl>
			</Panel>

			<Panel title="Course" accentVar="chrome-navigation">
				<dl>
					<dt>DESTINATION</dt>
					<dd data-testid="nav-destination">{destinationLabel}</dd>
					<dt>ETA</dt>
					<dd data-testid="nav-eta">{eta}</dd>
					<dt>CHRONOMETER</dt>
					<dd data-testid="nav-chronometer">{formatChronometer(store.state.simulatedTimeMs)}</dd>
				</dl>
			</Panel>

			<Panel title="Helm Controls" accentVar="chrome-navigation">
				<div class="helm-controls">
					<dl class="heading-readout">
						<dt>CURRENT X/Y, X/Z</dt>
						<dd>
							<span data-testid="nav-xy-angle-current">{Math.round(navigation.velocity.xyAngleDeg)}°</span>,
							<span data-testid="nav-xz-angle-current">{Math.round(navigation.velocity.xzAngleDeg)}°</span>
						</dd>
						<dt>INTENDED X/Y, X/Z</dt>
						<dd>
							<span data-testid="nav-xy-angle-intended">{Math.round(navigation.intendedDirection.xyAngleDeg)}°</span>,
							<span data-testid="nav-xz-angle-intended">{Math.round(navigation.intendedDirection.xzAngleDeg)}°</span>
						</dd>
					</dl>
					<Slider
						label="Speed"
						value={navigation.velocity.warpSpeed}
						min={0}
						max={MAX_WARP_SPEED}
						step={1}
						unit="warp"
						accentVar="chrome-navigation"
						onChange={handleSpeedChange}
					/>
					<Slider
						label="X/Z Angle"
						value={navigation.intendedDirection.xzAngleDeg}
						min={0}
						max={359}
						step={1}
						unit="°"
						accentVar="chrome-navigation"
						onChange={handlePitchChange}
					/>
					<CompassDial
						headingDeg={navigation.velocity.xyAngleDeg}
						intendedHeadingDeg={navigation.intendedDirection.xyAngleDeg}
						onSelect={handleHeadingChange}
					/>
				</div>
			</Panel>
		</div>

		<div class="main-column">
			<Panel title="Astrogator" accentVar="chrome-navigation">
				<AstrogatorPlot
					center={navigation.position}
					entities={plotEntities}
					range={PLOT_RANGE}
					onSelectPoint={handleSelectPoint}
					rangeCircles={RANGE_CIRCLES}
					{shieldOverlay}
					scanFlash={astrogatorOverlay.scanFlash}
					shipHeadingDeg={navigation.velocity.xyAngleDeg}
					projectedPath={shipProjectedPath}
					fireFlashes={weaponFireOverlay.fireFlashes}
					explosionFlashes={weaponFireOverlay.explosionFlashes}
				/>
			</Panel>

			<div class="lower-row">
				<Panel title="Nearby Objects" accentVar="chrome-navigation">
					<table>
						<thead>
							<tr>
								<th>NAME</th>
								<th>KIND</th>
								<th>DISTANCE</th>
							</tr>
						</thead>
						<tbody data-testid="nearby-objects">
							{#each nearbyObjects as entry (entry.kind + entry.id)}
								<tr>
									<td>{entry.name}</td>
									<td>{KIND_LABELS[entry.kind]}</td>
									<td>{entry.distance.toFixed(1)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Panel>

				<Panel title="Alerts" accentVar="chrome-neutral">
					<div aria-label="Alerts"></div>
				</Panel>
			</div>

			<Panel title="Command" accentVar="chrome-navigation">
				<CommandBox onSubmit={handleSubmit} {errorMessage} accentVar="chrome-navigation" />
				<CommandReference commands={NAVIGATION_COMMANDS} />
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

	.lower-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--space-4);
	}

	.helm-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.heading-readout dd {
		display: flex;
		gap: var(--space-1);
	}

	@media (max-width: 800px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
