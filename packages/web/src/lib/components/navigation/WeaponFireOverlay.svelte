<script lang="ts">
	interface FireFlashPlot {
		fromX: number;
		fromY: number;
		toX: number;
		toY: number;
		key: number | string;
		initialOpacity: number;
		durationMs: number;
	}

	interface Props {
		fireFlash: FireFlashPlot;
	}

	let { fireFlash }: Props = $props();
</script>

<line
	data-testid="weapon-fire-line"
	x1={fireFlash.fromX}
	y1={fireFlash.fromY}
	x2={fireFlash.toX}
	y2={fireFlash.toY}
	stroke="var(--chrome-helm)"
	stroke-width="0.4"
	class="fade-flash"
	style={`--flash-start: ${fireFlash.initialOpacity}; --flash-duration: ${fireFlash.durationMs}ms`}
/>
