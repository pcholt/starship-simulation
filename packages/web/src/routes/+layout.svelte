<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import StationNav from '$lib/components/shared/StationNav.svelte';
	import FitToViewport from '$lib/components/shared/FitToViewport.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<StationNav />
	<main>
		<FitToViewport fixedScale={page.params.name === 'controller' ? 1 : undefined}>
			{@render children()}
		</FitToViewport>
	</main>
</div>

<style>
	.shell {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	main {
		flex: 1;
		min-width: 0;
		min-height: 0;
		padding: var(--space-6) var(--space-8);
	}
</style>
