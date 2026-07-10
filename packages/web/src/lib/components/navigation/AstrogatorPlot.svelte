<script lang="ts">
	import type { Vector3 } from '@starship/engine';
	import { sliderPosToZoomRange, zoomRangeToSliderPos } from './zoom-math.js';
	import { plotPointToWorld } from './astrogator-math.js';

	type EntityKind = 'enemyCraft' | 'federationCraft' | 'celestialObject';

	interface PlotEntity {
		name: string;
		kind: EntityKind;
		position: Vector3;
	}

	interface Props {
		center: Vector3;
		entities: PlotEntity[];
		/** Initial plot radius in world distance-units — entities further than the current zoom level (in the x/y plane) aren't shown. */
		range: number;
		/** Called with the world-space point clicked on the plot, for point-and-click course setting. */
		onSelectPoint?: (position: Vector3) => void;
	}

	let { center, entities, range, onSelectPoint }: Props = $props();

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

	const TICKS = [-40, -30, -20, -10, 10, 20, 30, 40];
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
			<line x1={VIEW_SIZE / 2} y1="0" x2={VIEW_SIZE / 2} y2={VIEW_SIZE} stroke="currentColor" stroke-width="0.2" opacity="0.4" />
			<line x1="0" y1={VIEW_SIZE / 2} x2={VIEW_SIZE} y2={VIEW_SIZE / 2} stroke="currentColor" stroke-width="0.2" opacity="0.4" />
			{#each TICKS as t (t)}
				<line x1={VIEW_SIZE / 2 - 1} y1={VIEW_SIZE / 2 + t} x2={VIEW_SIZE / 2 + 1} y2={VIEW_SIZE / 2 + t} stroke="currentColor" />
				<line x1={VIEW_SIZE / 2 + t} y1={VIEW_SIZE / 2 - 1} x2={VIEW_SIZE / 2 + t} y2={VIEW_SIZE / 2 + 1} stroke="currentColor" />
			{/each}

			<circle data-testid="plot-mark-enterprise" cx={VIEW_SIZE / 2} cy={VIEW_SIZE / 2} r="2.5" fill="currentColor">
				<title>Enterprise</title>
			</circle>

			{#each plotted as entity (entity.kind + entity.name)}
				<g data-testid={`plot-mark-${entity.kind}-${entity.name}`}>
					<title>{entity.name}</title>
					{#if entity.kind === 'celestialObject'}
						<circle cx={entity.plotX} cy={entity.plotY} r="1.8" fill="none" stroke="currentColor" />
					{:else if entity.kind === 'enemyCraft'}
						<polygon
							points="{entity.plotX},{entity.plotY - 2} {entity.plotX - 2},{entity.plotY + 2} {entity.plotX + 2},{entity.plotY + 2}"
							fill="none"
							stroke="currentColor"
						/>
					{:else}
						<rect x={entity.plotX - 1.8} y={entity.plotY - 1.8} width="3.6" height="3.6" fill="none" stroke="currentColor" />
					{/if}
				</g>
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
	</ul>
</div>

<style>
	.astrogator {
		display: flex;
		gap: var(--space-6);
		align-items: flex-start;
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
</style>
