<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import { parseCommunicationsCommand, COMMUNICATIONS_COMMANDS } from './communications-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let currentMessage = $derived(store.state.communications.lastDisplayedMessage);
	let queueLength = $derived(store.state.communications.messageQueue.length);
	let log = $derived(store.state.communications.log);

	function handleSubmit(text: string) {
		const parsed = parseCommunicationsCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}
</script>

<section aria-label="Communications station">
	<h2>Communications</h2>

	<h3>Current Message</h3>
	<p data-testid="current-message">
		{#if currentMessage}
			{currentMessage.from}: {currentMessage.text}
		{:else}
			NONE
		{/if}
	</p>
	<p>Messages waiting: {queueLength}</p>

	<h3>Log</h3>
	<ul data-testid="comms-log">
		{#each log as entry, i (i)}
			<li>{entry}</li>
		{/each}
	</ul>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
	<CommandReference commands={COMMUNICATIONS_COMMANDS} />
</section>
