<script lang="ts">
	import type { Vector3 } from '@starship/engine';

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
	}

	let { center, entities, range }: Props = $props();

	const VIEW_SIZE = 100;
	const PLOT_RADIUS_PCT = 45;

	// The displayed plot radius, adjustable via the zoom slider independent of the initial `range` prop.
	// Deliberately seeded only once from `range` (not kept in sync with it) — the zoom slider is the
	// user's control from here on.
	// svelte-ignore state_referenced_locally
	let zoomRange = $state(range);
	let zoomMin = $derived(Math.max(1, Math.round(range / 10)));
	let zoomMax = $derived(range * 4);
	let zoomStep = $derived(Math.max(1, Math.round(range / 10)));

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

	const TICKS = [-40, -30, -20, -10, 10, 20, 30, 40];
</script>

<div aria-label="Astrogator">
	<svg viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}" role="img" aria-label="Tactical plot">
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
		<input type="range" aria-label="Zoom (plot range)" min={zoomMin} max={zoomMax} step={zoomStep} bind:value={zoomRange} />
		<span>{zoomRange} units</span>
	</label>

	<ul data-testid="symbol-key">
		<li>◉ ENTERPRISE</li>
		<li>△ ENEMY CRAFT</li>
		<li>▢ FEDERATION CRAFT</li>
		<li>○ CELESTIAL OBJECT</li>
	</ul>
</div>

<style>
	svg {
		display: block;
		width: 100%;
		max-width: 640px;
		aspect-ratio: 1;
	}
	.zoom-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 640px;
	}
	.zoom-control input[type='range'] {
		flex: 1;
	}
</style>
