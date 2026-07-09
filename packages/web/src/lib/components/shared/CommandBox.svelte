<script lang="ts">
	interface Props {
		onSubmit: (text: string) => void;
		errorMessage?: string | null;
	}

	let { onSubmit, errorMessage = null }: Props = $props();
	let value = $state('');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!value.trim()) return;
		onSubmit(value);
		value = '';
	}
</script>

<form onsubmit={submit} aria-label="Command">
	<label>
		COMMAND:
		<input type="text" bind:value aria-label="Command input" />
	</label>
	<button type="submit">Enter</button>
	{#if errorMessage}
		<p role="alert">{errorMessage}</p>
	{/if}
</form>
