<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import { parseSciencesCommand, SCIENCES_COMMANDS } from './sciences-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let lifeSupport = $derived(store.state.lifeSupport);
	let scan = $derived(store.state.lastScanResult);

	function handleSubmit(text: string) {
		const parsed = parseSciencesCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}
</script>

<section aria-label="Sciences station">
	<h2>Sciences</h2>

	<h3>Life Support</h3>
	<dl>
		<dt>AIR</dt>
		<dd data-testid="life-support-air">{lifeSupport.air}</dd>
		<dt>WATER</dt>
		<dd data-testid="life-support-water">{lifeSupport.water}</dd>
		<dt>FOOD</dt>
		<dd data-testid="life-support-food">{lifeSupport.food}</dd>
	</dl>

	<h3>Scan Result</h3>
	<dl>
		<dt>IDENTITY</dt>
		<dd data-testid="scan-identity">{scan?.identity ?? 'NONE'}</dd>
		<dt>QUALITY</dt>
		<dd data-testid="scan-quality">{scan?.quality ?? 'NONE'}</dd>
		<dt>DISTANCE</dt>
		<dd data-testid="scan-distance">{scan ? scan.distance.toFixed(1) : 'NONE'}</dd>
		{#if scan?.radius !== undefined}
			<dt>RADIUS</dt>
			<dd data-testid="scan-radius">{scan.radius}</dd>
		{/if}
		{#if scan?.mass !== undefined}
			<dt>MASS</dt>
			<dd data-testid="scan-mass">{scan.mass}</dd>
		{/if}
		{#if scan?.mission !== undefined}
			<dt>MISSION</dt>
			<dd data-testid="scan-mission">{scan.mission}</dd>
		{/if}
	</dl>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
	<CommandReference commands={SCIENCES_COMMANDS} />
</section>
