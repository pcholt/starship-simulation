<script lang="ts">
	import type { Vector3 } from '@starship/engine';
	import { gridLineValues, universeGridLineValues } from './astrogator-grid.js';

	interface Props {
		center: Vector3;
		zoomRange: number;
		viewSize: number;
		plotRadiusPct: number;
	}

	let { center, zoomRange, viewSize, plotRadiusPct }: Props = $props();

	// World-coordinate grid, labeled in the same distance-units as the zoom display, so the plot
	// reads as a real coordinate grid (per the book's Astrogator) rather than unlabeled tick marks.
	let gridValues = $derived(gridLineValues(zoomRange, 5));
	function gridOffset(value: number) {
		return (value / zoomRange) * plotRadiusPct;
	}

	// Universe (absolute) coordinate grid — anchored to fixed points in space, unlike the
	// ship-relative grid above, so it visibly shifts under the Enterprise as the ship moves.
	let universeXValues = $derived(universeGridLineValues(center.x, zoomRange, 5));
	let universeYValues = $derived(universeGridLineValues(center.y, zoomRange, 5));
	function universeXOffset(worldX: number) {
		return ((worldX - center.x) / zoomRange) * plotRadiusPct;
	}
	function universeYOffset(worldY: number) {
		return ((worldY - center.y) / zoomRange) * plotRadiusPct;
	}
</script>

<g data-testid="astrogator-grid" stroke="currentColor" stroke-width="0.12" opacity="0.35">
	{#each gridValues as value (value)}
		{@const offset = gridOffset(value)}
		<line x1={viewSize / 2 + offset} y1="0" x2={viewSize / 2 + offset} y2={viewSize} />
		<line x1={viewSize / 2 - offset} y1="0" x2={viewSize / 2 - offset} y2={viewSize} />
		<line x1="0" y1={viewSize / 2 + offset} x2={viewSize} y2={viewSize / 2 + offset} />
		<line x1="0" y1={viewSize / 2 - offset} x2={viewSize} y2={viewSize / 2 - offset} />
	{/each}
	{#each gridValues as value (value)}
		{@const offset = gridOffset(value)}
		<text x={viewSize / 2 + offset} y={viewSize / 2 - 0.6} font-size="1.8" stroke="none" fill="currentColor" text-anchor="middle"
			>{value}</text
		>
		<text x={viewSize / 2 + 0.8} y={viewSize / 2 - offset} font-size="1.8" stroke="none" fill="currentColor">{value}</text>
	{/each}
</g>

<g data-testid="astrogator-universe-grid" stroke="var(--universe-grid)" stroke-width="0.12" opacity="0.5">
	{#each universeXValues as value (value)}
		{@const offset = universeXOffset(value)}
		<line x1={viewSize / 2 + offset} y1="0" x2={viewSize / 2 + offset} y2={viewSize} />
	{/each}
	{#each universeYValues as value (value)}
		{@const offset = universeYOffset(value)}
		<line x1="0" y1={viewSize / 2 - offset} x2={viewSize} y2={viewSize / 2 - offset} />
	{/each}
	{#each universeXValues as value (value)}
		{@const offset = universeXOffset(value)}
		<text x={viewSize / 2 + offset} y={viewSize - 1.2} font-size="1.8" stroke="none" fill="var(--universe-grid)" text-anchor="middle"
			>{value}</text
		>
	{/each}
	{#each universeYValues as value (value)}
		{@const offset = universeYOffset(value)}
		<text x={viewSize - 12} y={viewSize / 2 - offset - 0.6} font-size="1.8" stroke="none" fill="var(--universe-grid)"
			>{value}</text
		>
	{/each}
</g>

<line x1={viewSize / 2} y1="0" x2={viewSize / 2} y2={viewSize} stroke="currentColor" stroke-width="0.12" opacity="0.6" />
<line x1="0" y1={viewSize / 2} x2={viewSize} y2={viewSize / 2} stroke="currentColor" stroke-width="0.12" opacity="0.6" />
