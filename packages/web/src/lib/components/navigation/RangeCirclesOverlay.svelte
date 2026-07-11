<script lang="ts">
	interface RangeCircle {
		label: string;
		/** Radius in world distance-units, centered on the Enterprise. */
		radius: number;
	}

	interface Props {
		circles: RangeCircle[];
		zoomRange: number;
		viewSize: number;
		plotRadiusPct: number;
	}

	let { circles, zoomRange, viewSize, plotRadiusPct }: Props = $props();

	// Rings larger than the current zoom level would overflow the plot, so they're hidden rather
	// than clipped — the same "beyond the current view" treatment as an out-of-range entity.
	let visibleCircles = $derived(circles.filter((c) => c.radius <= zoomRange));
</script>

{#each visibleCircles as circle (circle.label)}
	<circle
		data-testid={`range-circle-${circle.label}`}
		cx={viewSize / 2}
		cy={viewSize / 2}
		r={(circle.radius / zoomRange) * plotRadiusPct}
		fill="none"
		stroke="var(--chrome-navigation)"
		stroke-width="0.15"
		stroke-dasharray="0.8 0.6"
		opacity="0.55"
	>
		<title>{circle.label} range — {circle.radius} units</title>
	</circle>
{/each}
