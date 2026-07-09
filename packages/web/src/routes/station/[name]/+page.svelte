<script lang="ts">
	import { page } from '$app/state';
	import { worldStateStore } from '$lib/app-state.svelte.js';
	import NavigationStation from '$lib/components/navigation/NavigationStation.svelte';

	let name = $derived(page.params.name);
</script>

{#if name === 'navigation'}
	<NavigationStation store={worldStateStore} />
{:else}
	<p>Unknown station: {name}</p>
{/if}
