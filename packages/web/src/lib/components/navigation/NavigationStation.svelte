<script lang="ts">
	import { untrack } from 'svelte';
	import type { Vector3 } from '@starship/engine';
	import { BANK_LOCATIONS, distanceBetween, FULL_SCAN_RANGE, PARTIAL_SCAN_RANGE, PHASER_RANGE_HALF_LIFE } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	import { formatChronometer, formatCoordinate } from '../../format.js';
	import AstrogatorPlot from './AstrogatorPlot.svelte';
	import CompassDial from './CompassDial.svelte';
	import { parseNavigationCommand, NAVIGATION_COMMANDS } from './navigation-command-parser.js';
	import { projectedPath } from './projected-path.js';

	/** How far ahead (and at what resolution) to project the ship's future track on the Astrogator. */
	const PROJECTED_PATH_SECONDS = 20;
	const PROJECTED_PATH_STEP_SECONDS = 1;

	/** Plot radius in world distance-units — matches Sciences' partial-scan range, since both represent sensor reach. */
	const PLOT_RANGE = 1000;
	/** 0-20 warp, per the book's navigation data spec. */
	const MAX_WARP_SPEED = 20;

	// Torpedoes have no hard range cutoff in this engine (they home in regardless of distance),
	// so only sensors and phasers get a ring — phasers use their damage half-life as the
	// "effective range" since damage merely decays with distance rather than cutting off sharply.
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

	let plotEntities = $derived([
		...store.state.celestialObjects.map((o) => ({ id: o.id, name: o.name, kind: 'celestialObject' as const, position: o.position })),
		...store.state.enemyCraft.map((c) => ({ id: c.id, name: c.name, kind: 'enemyCraft' as const, position: c.position })),
		...store.state.federationCraft.map((c) => ({ id: c.id, name: c.name, kind: 'federationCraft' as const, position: c.position }))
	]);

	// Supplementary detail table alongside the Astrogator plot — the same entities, but with exact distance and no range cutoff.
	let nearbyObjects = $derived(
		plotEntities
			.map((e) => ({ ...e, distance: distanceBetween(navigation.position, e.position) }))
			.sort((a, b) => a.distance - b.distance)
	);

	const KIND_LABELS = { celestialObject: 'celestial object', enemyCraft: 'enemy craft', federationCraft: 'federation craft' };

	let shipProjectedPath = $derived(projectedPath(navigation, PROJECTED_PATH_SECONDS, PROJECTED_PATH_STEP_SECONDS));

	let shieldOverlay = $derived({
		headingDeg: navigation.velocity.xyAngleDeg,
		levels: BANK_LOCATIONS.map((location) => ({
			location,
			level: store.state.engineering.devices[`shield-${location}`]!.operationalStatus
		}))
	});

	/** How long the Sciences Scan Area flash stays visible before it's removed (the CSS fade spans the same duration). */
	const SCAN_FLASH_DURATION_MS = 2000;
	let scanFlash: { center: Vector3; radius: number; key: number; initialOpacity: number; durationMs: number } | null =
		$state(null);

	// Watches for a *new* Scan Area event (by sequence number, not object identity — the latter
	// would also change on every full-state broadcast in networked play) and shows a flash at the
	// scanned point for a couple of seconds, so Navigation sees where Sciences just looked.
	//
	// The event carries `atMs` (simulated time of the scan), so a component that only just
	// mounted — e.g. the player switched stations and back, or reloaded the page — can tell how
	// much of the flash's 2 seconds has already elapsed elsewhere, instead of always restarting
	// it from full brightness as if the scan had just happened.
	$effect(() => {
		const event = store.state.lastScanAreaEvent;
		if (!event) return;

		// Read the clock without subscribing to it — simulatedTimeMs ticks continuously, and this
		// effect must only re-run when a *new* scan event arrives, not on every tick in between.
		const elapsedMs = untrack(() => store.state.simulatedTimeMs) - event.atMs;
		const remainingMs = SCAN_FLASH_DURATION_MS - elapsedMs;
		if (remainingMs <= 0) {
			scanFlash = null;
			return;
		}

		scanFlash = {
			center: event.position,
			radius: FULL_SCAN_RANGE,
			key: event.sequence,
			initialOpacity: 0.6 * (remainingMs / SCAN_FLASH_DURATION_MS),
			durationMs: remainingMs
		};
		const timeout = setTimeout(() => {
			scanFlash = null;
		}, remainingMs);
		return () => clearTimeout(timeout);
	});

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
					{scanFlash}
					shipHeadingDeg={navigation.velocity.xyAngleDeg}
					projectedPath={shipProjectedPath}
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
