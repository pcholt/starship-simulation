<script lang="ts">
	import FitToViewport from './FitToViewport.svelte';

	let { contentHeightPx, fixedScale }: { contentHeightPx: number; fixedScale?: number } = $props();
</script>

<div style="width: 800px; height: 400px;">
	<FitToViewport {fixedScale}>
		<div data-testid="tall-child" style="height: {contentHeightPx}px;"></div>
	</FitToViewport>
</div>
