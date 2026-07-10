<script lang="ts">
	interface Props {
		onSubmit: (text: string) => void;
		errorMessage?: string | null;
		/** CSS custom property name (without `--`) for the submit button's accent — defaults to the neutral chrome. */
		accentVar?: string;
	}

	let { onSubmit, errorMessage = null, accentVar = 'chrome-neutral' }: Props = $props();
	let value = $state('');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!value.trim()) return;
		onSubmit(value);
		value = '';
	}
</script>

<form onsubmit={submit} aria-label="Command" class="command-box" style:--accent="var(--{accentVar})">
	<label>
		<span>COMMAND</span>
		<input type="text" bind:value aria-label="Command input" placeholder="e.g. SV 5" />
	</label>
	<button type="submit">Enter</button>
	{#if errorMessage}
		<p role="alert">{errorMessage}</p>
	{/if}
</form>

<style>
	.command-box {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		min-width: 12rem;
		font-family: var(--font-body);
		font-weight: 700;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	input {
		flex: 1;
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-family: var(--font-data);
		font-size: 0.95rem;
		padding: var(--space-2) var(--space-3);
	}

	input:focus-visible {
		border-color: var(--accent);
	}

	input::placeholder {
		color: var(--text-muted);
		opacity: 0.6;
	}

	button {
		background: var(--accent);
		color: var(--text-on-chrome);
		border: none;
		border-radius: var(--radius-capsule);
		padding: var(--space-2) var(--space-6);
		font-family: var(--font-body);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.8rem;
	}

	button:hover {
		filter: brightness(1.1);
	}

	[role='alert'] {
		flex-basis: 100%;
		margin: 0;
		color: var(--status-critical);
		font-size: 0.85rem;
	}
</style>
