<script lang="ts">
	interface FireFlashPlot {
		fromX: number;
		fromY: number;
		toX: number;
		toY: number;
		key: number | string;
	}

	interface Props {
		fireFlash: FireFlashPlot | null;
	}

	let { fireFlash }: Props = $props();
</script>

{#if fireFlash}
	{#key fireFlash.key}
		<line
			data-testid="weapon-fire-line"
			x1={fireFlash.fromX}
			y1={fireFlash.fromY}
			x2={fireFlash.toX}
			y2={fireFlash.toY}
			stroke="var(--chrome-helm)"
			stroke-width="0.4"
			class="fire-flash"
		/>
	{/key}
{/if}

<style>
	.fire-flash {
		animation: fire-flash-fade 500ms linear forwards;
	}

	@keyframes fire-flash-fade {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
</style>
