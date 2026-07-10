<script lang="ts">
	import type { Vector3 } from '@starship/engine';
	import { sliderPosToZoomRange, zoomRangeToSliderPos } from './zoom-math.js';
	import { plotPointToWorld, worldToPlotPoint } from './astrogator-math.js';
	import { gridLineValues, universeGridLineValues } from './astrogator-grid.js';

	type EntityKind = 'enemyCraft' | 'federationCraft' | 'celestialObject';

	interface PlotEntity {
		name: string;
		kind: EntityKind;
		position: Vector3;
	}

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
	}

	let { center, entities, range, onSelectPoint, rangeCircles = [], previewCircle }: Props = $props();

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

	// World-coordinate grid, labeled in the same distance-units as the zoom display, so the plot
	// reads as a real coordinate grid (per the book's Astrogator) rather than unlabeled tick marks.
	let gridValues = $derived(gridLineValues(zoomRange, 5));
	function gridOffset(value: number) {
		return (value / zoomRange) * PLOT_RADIUS_PCT;
	}

	// Rings larger than the current zoom level would overflow the plot, so they're hidden rather
	// than clipped — the same "beyond the current view" treatment as an out-of-range entity.
	let visibleRangeCircles = $derived(rangeCircles.filter((c) => c.radius <= zoomRange));

	// Recomputes on every change to previewCircle.center, so dragging a slider that feeds this
	// prop moves the ring in real time — the same reactivity that drives every other plot mark.
	let previewCirclePlot = $derived.by(() => {
		if (!previewCircle) return null;
		const point = worldToPlotPoint(previewCircle.center, center, zoomRange, VIEW_SIZE, PLOT_RADIUS_PCT);
		return { ...point, radius: (previewCircle.radius / zoomRange) * PLOT_RADIUS_PCT };
	});

	// Universe (absolute) coordinate grid — anchored to fixed points in space, unlike the
	// ship-relative grid above, so it visibly shifts under the Enterprise as the ship moves.
	let universeXValues = $derived(universeGridLineValues(center.x, zoomRange, 5));
	let universeYValues = $derived(universeGridLineValues(center.y, zoomRange, 5));
	function universeXOffset(worldX: number) {
		return ((worldX - center.x) / zoomRange) * PLOT_RADIUS_PCT;
	}
	function universeYOffset(worldY: number) {
		return ((worldY - center.y) / zoomRange) * PLOT_RADIUS_PCT;
	}
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
			<g data-testid="astrogator-grid" stroke="currentColor" stroke-width="0.12" opacity="0.35">
				{#each gridValues as value (value)}
					{@const offset = gridOffset(value)}
					<line x1={VIEW_SIZE / 2 + offset} y1="0" x2={VIEW_SIZE / 2 + offset} y2={VIEW_SIZE} />
					<line x1={VIEW_SIZE / 2 - offset} y1="0" x2={VIEW_SIZE / 2 - offset} y2={VIEW_SIZE} />
					<line x1="0" y1={VIEW_SIZE / 2 + offset} x2={VIEW_SIZE} y2={VIEW_SIZE / 2 + offset} />
					<line x1="0" y1={VIEW_SIZE / 2 - offset} x2={VIEW_SIZE} y2={VIEW_SIZE / 2 - offset} />
				{/each}
				{#each gridValues as value (value)}
					{@const offset = gridOffset(value)}
					<text x={VIEW_SIZE / 2 + offset} y={VIEW_SIZE / 2 - 0.6} font-size="1.8" stroke="none" fill="currentColor" text-anchor="middle"
						>{value}</text
					>
					<text x={VIEW_SIZE / 2 + 0.8} y={VIEW_SIZE / 2 - offset} font-size="1.8" stroke="none" fill="currentColor">{value}</text>
				{/each}
			</g>

			<g data-testid="astrogator-universe-grid" stroke="var(--universe-grid)" stroke-width="0.12" opacity="0.5">
				{#each universeXValues as value (value)}
					{@const offset = universeXOffset(value)}
					<line x1={VIEW_SIZE / 2 + offset} y1="0" x2={VIEW_SIZE / 2 + offset} y2={VIEW_SIZE} />
				{/each}
				{#each universeYValues as value (value)}
					{@const offset = universeYOffset(value)}
					<line x1="0" y1={VIEW_SIZE / 2 - offset} x2={VIEW_SIZE} y2={VIEW_SIZE / 2 - offset} />
				{/each}
				{#each universeXValues as value (value)}
					{@const offset = universeXOffset(value)}
					<text x={VIEW_SIZE / 2 + offset} y={VIEW_SIZE - 1.2} font-size="1.8" stroke="none" fill="var(--universe-grid)" text-anchor="middle"
						>{value}</text
					>
				{/each}
				{#each universeYValues as value (value)}
					{@const offset = universeYOffset(value)}
					<text x={VIEW_SIZE - 12} y={VIEW_SIZE / 2 - offset - 0.6} font-size="1.8" stroke="none" fill="var(--universe-grid)"
						>{value}</text
					>
				{/each}
			</g>

			<line
				x1={VIEW_SIZE / 2}
				y1="0"
				x2={VIEW_SIZE / 2}
				y2={VIEW_SIZE}
				stroke="currentColor"
				stroke-width="0.12"
				opacity="0.6"
			/>
			<line
				x1="0"
				y1={VIEW_SIZE / 2}
				x2={VIEW_SIZE}
				y2={VIEW_SIZE / 2}
				stroke="currentColor"
				stroke-width="0.12"
				opacity="0.6"
			/>

			{#each visibleRangeCircles as circle (circle.label)}
				<circle
					data-testid={`range-circle-${circle.label}`}
					cx={VIEW_SIZE / 2}
					cy={VIEW_SIZE / 2}
					r={gridOffset(circle.radius)}
					fill="none"
					stroke="var(--chrome-navigation)"
					stroke-width="0.15"
					stroke-dasharray="0.8 0.6"
					opacity="0.55"
				>
					<title>{circle.label} range — {circle.radius} units</title>
				</circle>
			{/each}

			<circle data-testid="plot-mark-enterprise" cx={VIEW_SIZE / 2} cy={VIEW_SIZE / 2} r="1.1" fill="currentColor">
				<title>Enterprise</title>
			</circle>

			{#each plotted as entity (entity.kind + entity.name)}
				<g data-testid={`plot-mark-${entity.kind}-${entity.name}`}>
					<title>{entity.name}</title>
					{#if entity.kind === 'celestialObject'}
						<circle cx={entity.plotX} cy={entity.plotY} r="0.9" fill="none" stroke="currentColor" stroke-width="0.3" />
					{:else if entity.kind === 'enemyCraft'}
						<polygon
							points="{entity.plotX},{entity.plotY - 1} {entity.plotX - 1},{entity.plotY + 1} {entity.plotX + 1},{entity.plotY + 1}"
							fill="none"
							stroke="currentColor"
							stroke-width="0.3"
						/>
					{:else}
						<rect
							x={entity.plotX - 0.9}
							y={entity.plotY - 0.9}
							width="1.8"
							height="1.8"
							fill="none"
							stroke="currentColor"
							stroke-width="0.3"
						/>
					{/if}
				</g>
			{/each}

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
