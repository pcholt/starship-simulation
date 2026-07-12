<script lang="ts">
	import type { BankLocation, Vector3 } from '@starship/engine';
	import { sliderPosToZoomRange, zoomRangeToSliderPos } from './zoom-math.js';
	import { plotPointToWorld, worldToPlotPoint } from './astrogator-math.js';
	import { pointerFromAngle } from './compass-math.js';
	import type { PlotEntity } from './plot-entities.js';
	import PlotGrids from './PlotGrids.svelte';
	import ShieldSectorsOverlay from './ShieldSectorsOverlay.svelte';
	import RangeCirclesOverlay from './RangeCirclesOverlay.svelte';
	import EntityMarks from './EntityMarks.svelte';
	import WeaponFireOverlay from './WeaponFireOverlay.svelte';

	interface RangeCircle {
		label: string;
		/** Radius in world distance-units, centered on the Enterprise. */
		radius: number;
	}

	interface PreviewCircle {
		/** World-space center — need not be the Enterprise's position, e.g. a scan target being aimed at. */
		center: Vector3;
		radius: number;
	}

	interface ShieldOverlay {
		/** The ship's current heading — shield sectors rotate with it, "fore" always facing this direction. */
		headingDeg: number;
		levels: { location: BankLocation; level: number }[];
	}

	interface ScanFlash {
		center: Vector3;
		radius: number;
		/** Changing this (e.g. an event sequence number) restarts the fade-out animation, even if center/radius repeat. */
		key: number | string;
		/** Starting opacity (0-1). Lets a caller resume a flash partway through its fade — e.g. a view that mounted after the scan already happened — rather than always popping back to full brightness. Defaults to 0.6. */
		initialOpacity?: number;
		/** How long the fade takes, in milliseconds. Should match however much of the flash's lifetime is left. Defaults to 2000. */
		durationMs?: number;
	}

	interface FireFlash {
		/** World-space point the shot was fired from, e.g. the Enterprise's position at the moment of firing. */
		from: Vector3;
		/** World-space point the shot was aimed at. */
		to: Vector3;
		/** Distinguishes simultaneous fire events (e.g. an event sequence number) — each gets its own fade-out animation. */
		key: number | string;
		/** Starting opacity (0-1). Defaults to 1. */
		initialOpacity?: number;
		/** How long the fade takes, in milliseconds. Defaults to 500. */
		durationMs?: number;
	}

	interface Props {
		center: Vector3;
		entities: PlotEntity[];
		/** Initial plot radius in world distance-units — entities further than the current zoom level (in the x/y plane) aren't shown. */
		range: number;
		/** Called with the world-space point clicked on the plot, for point-and-click course setting. */
		onSelectPoint?: (position: Vector3) => void;
		/** Weapon/sensor reach rings drawn around the Enterprise, e.g. sensor and phaser range. */
		rangeCircles?: RangeCircle[];
		/** A single ring drawn at an arbitrary world point, e.g. a live scan-area preview that tracks a slider. */
		previewCircle?: PreviewCircle;
		/** Deflector shield strength per bank, drawn as heading-oriented pie sectors over the Enterprise. */
		shieldOverlay?: ShieldOverlay;
		/** A momentary ring at a scanned point that fades out over a couple of seconds, e.g. a Sciences Scan Area result. */
		scanFlash?: ScanFlash | null;
		/** The ship's current (actual) heading — when given, the Enterprise mark becomes a directional icon pointing this way instead of a plain dot. */
		shipHeadingDeg?: number;
		/** World-space points tracing the ship's predicted future track, e.g. from projected-path.ts — drawn as a dashed line when moving. */
		projectedPath?: Vector3[];
		/** Momentary beam lines from the firing point to the target, one per shot still fading — several can be fired close together. */
		fireFlashes?: FireFlash[];
		/** Momentary rings at torpedo detonation points (hit or fuel-out), one per explosion still fading — several torpedoes can resolve in the same tick. */
		explosionFlashes?: ScanFlash[];
	}

	let {
		center,
		entities,
		range,
		onSelectPoint,
		rangeCircles = [],
		previewCircle,
		shieldOverlay,
		scanFlash,
		shipHeadingDeg,
		projectedPath,
		fireFlashes = [],
		explosionFlashes = []
	}: Props = $props();

	/** Fixed visual size in viewBox units for the directional ship icon. */
	const SHIP_ICON_LENGTH = 2.4;
	const SHIP_ICON_REAR_SPREAD_DEG = 145;
	const SHIP_ICON_REAR_RADIUS = 1.5;

	const VIEW_SIZE = 100;
	const PLOT_RADIUS_PCT = 45;
	const ZOOM_STEPS = 200;

	let zoomMin = $derived(Math.max(1, Math.round(range / 10)));
	let zoomMax = $derived(range * 4);

	// Slider position (0..ZOOM_STEPS) drives zoomRange logarithmically, so equal slider travel
	// means equal *ratio* of zoom change rather than equal absolute change — a linear slider
	// would waste most of its travel on either extreme. Seeded once from `range`; the slider is
	// the user's control from here on.
	// svelte-ignore state_referenced_locally
	let sliderPos = $state(zoomRangeToSliderPos(range, zoomMin, zoomMax, ZOOM_STEPS));
	let zoomRange = $derived(sliderPosToZoomRange(sliderPos, zoomMin, zoomMax, ZOOM_STEPS));

	// Projected onto the x/y plane (top-down), matching the book's flat Astrogator grid.
	let plotted = $derived(
		entities
			.map((e) => {
				const dx = e.position.x - center.x;
				const dy = e.position.y - center.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				return { ...e, dx, dy, distance };
			})
			.filter((e) => e.distance <= zoomRange)
			.map((e) => ({
				...e,
				plotX: VIEW_SIZE / 2 + (e.dx / zoomRange) * PLOT_RADIUS_PCT,
				plotY: VIEW_SIZE / 2 - (e.dy / zoomRange) * PLOT_RADIUS_PCT
			}))
	);

	function handlePlotClick(event: MouseEvent) {
		if (!onSelectPoint) return;
		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const svgPoint = {
			x: ((event.clientX - rect.left) / rect.width) * VIEW_SIZE,
			y: ((event.clientY - rect.top) / rect.height) * VIEW_SIZE
		};
		onSelectPoint(plotPointToWorld(svgPoint, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT));
	}

	// Recomputes on every change to previewCircle.center, so dragging a slider that feeds this
	// prop moves the ring in real time — the same reactivity that drives every other plot mark.
	let previewCirclePlot = $derived.by(() => {
		if (!previewCircle) return null;
		const point = worldToPlotPoint(previewCircle.center, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
		return { ...point, radius: (previewCircle.radius / zoomRange) * PLOT_RADIUS_PCT };
	});

	let scanFlashPlot = $derived.by(() => {
		if (!scanFlash) return null;
		const point = worldToPlotPoint(scanFlash.center, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
		return {
			...point,
			radius: (scanFlash.radius / zoomRange) * PLOT_RADIUS_PCT,
			key: scanFlash.key,
			initialOpacity: scanFlash.initialOpacity ?? 0.6,
			durationMs: scanFlash.durationMs ?? 2000
		};
	});

	let fireFlashesPlot = $derived(
		fireFlashes.map((flash) => {
			const from = worldToPlotPoint(flash.from, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
			const to = worldToPlotPoint(flash.to, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
			return {
				fromX: from.x,
				fromY: from.y,
				toX: to.x,
				toY: to.y,
				key: flash.key,
				initialOpacity: flash.initialOpacity ?? 1,
				durationMs: flash.durationMs ?? 500
			};
		})
	);

	let explosionFlashesPlot = $derived(
		explosionFlashes.map((flash) => {
			const point = worldToPlotPoint(flash.center, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
			return {
				...point,
				radius: (flash.radius / zoomRange) * PLOT_RADIUS_PCT,
				key: flash.key,
				initialOpacity: flash.initialOpacity ?? 0.6,
				durationMs: flash.durationMs ?? 2000
			};
		})
	);

	// A small dart shape pointing in shipHeadingDeg: an apex forward, two points swept back on
	// either side — the same pointerFromAngle convention the compass dial and shield sectors use.
	let shipIconPoints = $derived.by(() => {
		if (shipHeadingDeg === undefined) return null;
		const tip = pointerFromAngle(shipHeadingDeg, SHIP_ICON_LENGTH);
		const left = pointerFromAngle(shipHeadingDeg + SHIP_ICON_REAR_SPREAD_DEG, SHIP_ICON_REAR_RADIUS);
		const right = pointerFromAngle(shipHeadingDeg - SHIP_ICON_REAR_SPREAD_DEG, SHIP_ICON_REAR_RADIUS);
		return [tip, left, right]
			.map((p) => `${VIEW_SIZE / 2 + p.x},${VIEW_SIZE / 2 + p.y}`)
			.join(' ');
	});

	let projectedPathPlotPoints = $derived.by(() => {
		if (!projectedPath || projectedPath.length === 0) return null;
		return projectedPath
			.map((worldPoint) => {
				const p = worldToPlotPoint(worldPoint, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
				return `${p.x},${p.y}`;
			})
			.join(' ');
	});
</script>

<div class="astrogator" aria-label="Astrogator">
	<div class="plot-column">
		<!-- Free-form point selection has no clean keyboard equivalent; the typed SCC command remains the keyboard-accessible path for setting course. -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<svg
			data-testid="astrogator-svg"
			viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}"
			role="img"
			aria-label="Tactical plot — click to set course"
			onclick={handlePlotClick}
		>
			<PlotGrids {center} {zoomRange} viewSize={VIEW_SIZE} plotRadiusPct={PLOT_RADIUS_PCT} />

			<RangeCirclesOverlay circles={rangeCircles} {zoomRange} viewSize={VIEW_SIZE} plotRadiusPct={PLOT_RADIUS_PCT} />

			{#if shieldOverlay}
				<ShieldSectorsOverlay {shieldOverlay} viewSize={VIEW_SIZE} />
			{/if}

			{#if projectedPathPlotPoints}
				<polyline
					data-testid="projected-path"
					points={projectedPathPlotPoints}
					fill="none"
					stroke="var(--chrome-navigation)"
					stroke-width="0.25"
					stroke-dasharray="1.2 0.8"
					opacity="0.7"
				/>
			{/if}

			{#if shipIconPoints}
				<polygon data-testid="plot-mark-enterprise" points={shipIconPoints} fill="currentColor">
					<title>Enterprise</title>
				</polygon>
			{:else}
				<circle data-testid="plot-mark-enterprise" cx={VIEW_SIZE / 2} cy={VIEW_SIZE / 2} r="1.1" fill="currentColor">
					<title>Enterprise</title>
				</circle>
			{/if}

			<EntityMarks entities={plotted} />

			{#if previewCirclePlot}
				<circle
					data-testid="scan-preview-circle"
					cx={previewCirclePlot.x}
					cy={previewCirclePlot.y}
					r={previewCirclePlot.radius}
					fill="none"
					stroke="var(--chrome-sciences)"
					stroke-width="0.3"
				>
					<title>Scan preview — {previewCircle?.radius} units</title>
				</circle>
			{/if}

			{#if scanFlashPlot}
				{#key scanFlashPlot.key}
					<circle
						data-testid="scan-flash-circle"
						cx={scanFlashPlot.x}
						cy={scanFlashPlot.y}
						r={scanFlashPlot.radius}
						fill="var(--chrome-sciences)"
						class="fade-flash"
						style={`--flash-start: ${scanFlashPlot.initialOpacity}; --flash-duration: ${scanFlashPlot.durationMs}ms`}
					/>
				{/key}
			{/if}

			{#each fireFlashesPlot as flash (flash.key)}
				<WeaponFireOverlay fireFlash={flash} />
			{/each}

			{#each explosionFlashesPlot as flash (flash.key)}
				<circle
					data-testid="torpedo-explosion-flash"
					cx={flash.x}
					cy={flash.y}
					r={flash.radius}
					fill="var(--chrome-helm)"
					class="scan-flash"
					style={`--flash-start: ${flash.initialOpacity}; --flash-duration: ${flash.durationMs}ms`}
				/>
			{/each}
		</svg>

		<label class="zoom-control">
			Zoom (plot range)
			<input type="range" aria-label="Zoom (plot range)" min={0} max={ZOOM_STEPS} step={1} bind:value={sliderPos} />
			<span data-testid="zoom-range-display">{Math.round(zoomRange)} units</span>
		</label>
	</div>

	<ul data-testid="symbol-key" class="symbol-key">
		<li>◉ ENTERPRISE</li>
		<li>△ ENEMY CRAFT</li>
		<li>▢ FEDERATION CRAFT</li>
		<li>○ CELESTIAL OBJECT</li>
		<li>● TORPEDO</li>
		<li class="universe-grid-key">▦ UNIVERSE GRID</li>
		{#each rangeCircles as circle (circle.label)}
			<li>⊚ {circle.label.toUpperCase()} RANGE</li>
		{/each}
		{#if previewCircle}
			<li class="preview-circle-key">⊚ SCAN PREVIEW</li>
		{/if}
	</ul>
</div>

<style>
	.astrogator {
		display: flex;
		gap: var(--space-6);
		align-items: flex-start;
		/* Distinct from --chrome-navigation, so the absolute universe grid reads as a separate
		   layer from the ship-relative grid and the navigation station's own accent chrome. */
		--universe-grid: #3b5bdb;
	}

	.plot-column {
		flex: 1;
		min-width: 0;
	}

	svg {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		cursor: crosshair;
	}

	.zoom-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-3);
	}

	.zoom-control input[type='range'] {
		flex: 1;
	}

	.symbol-key {
		list-style: none;
		margin: 0;
		padding: 0;
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-family: var(--font-body);
		font-size: 0.85rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.universe-grid-key {
		color: #3b5bdb;
	}

	.preview-circle-key {
		color: var(--chrome-sciences);
	}
</style>
