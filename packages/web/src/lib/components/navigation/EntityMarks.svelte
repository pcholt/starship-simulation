<script lang="ts">
	import type { PlotEntity } from './plot-entities.js';

	interface PlottedEntity extends PlotEntity {
		plotX: number;
		plotY: number;
	}

	interface Props {
		entities: PlottedEntity[];
	}

	let { entities }: Props = $props();
</script>

{#each entities as entity (entity.kind + entity.id)}
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
