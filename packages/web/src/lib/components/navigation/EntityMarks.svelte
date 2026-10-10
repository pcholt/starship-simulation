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
	<!-- Torpedoes all share the display name "Torpedo", so id (not name) is what makes this
	     testid unique when more than one is in flight at once. -->
	<g data-testid={`plot-mark-${entity.kind}-${entity.kind === 'torpedo' ? entity.id : entity.name}`}>
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
		{:else if entity.kind === 'shuttlecraft'}
			<polygon
				points="{entity.plotX},{entity.plotY - 0.9} {entity.plotX + 0.9},{entity.plotY} {entity.plotX},{entity.plotY + 0.9} {entity.plotX - 0.9},{entity.plotY}"
				fill="none"
				stroke="currentColor"
				stroke-width="0.3"
			/>
		{:else if entity.kind === 'torpedo'}
			<circle cx={entity.plotX} cy={entity.plotY} r="0.4" fill="currentColor" />
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
