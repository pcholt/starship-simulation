<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import StationNav from '$lib/components/shared/StationNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<StationNav />
	<main>
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: flex;
		min-height: 100vh;
	}

	main {
		flex: 1;
		min-width: 0;
		padding: var(--space-6) var(--space-8);
	}
</style>
