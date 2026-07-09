<script lang="ts">
	import { page } from '$app/state';
	import { worldStateStore } from '$lib/app-state.svelte.js';
	import NavigationStation from '$lib/components/navigation/NavigationStation.svelte';
	import SciencesStation from '$lib/components/sciences/SciencesStation.svelte';
	import EngineeringStation from '$lib/components/engineering/EngineeringStation.svelte';
	import HelmStation from '$lib/components/helm/HelmStation.svelte';
	import MedicalStation from '$lib/components/medical/MedicalStation.svelte';

	let name = $derived(page.params.name);
</script>

{#if name === 'navigation'}
	<NavigationStation store={worldStateStore} />
{:else if name === 'sciences'}
	<SciencesStation store={worldStateStore} />
{:else if name === 'engineering'}
	<EngineeringStation store={worldStateStore} />
{:else if name === 'helm'}
	<HelmStation store={worldStateStore} />
{:else if name === 'medical'}
	<MedicalStation store={worldStateStore} />
{:else}
	<p>Unknown station: {name}</p>
{/if}
