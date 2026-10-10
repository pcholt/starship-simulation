<script lang="ts">
	import { CARGO_LABELS, CARGO_TYPES, type Command } from '@starship/engine';
	import Panel from '../shared/Panel.svelte';
	import { buildSetCargoCommand, createEmptySetCargoForm, type CargoHolderOption } from './set-cargo-command.js';

	interface Props {
		holders: CargoHolderOption[];
		onSetCargo: (command: Command) => void;
		onInvalid: (reason: string) => void;
	}

	let { holders, onSetCargo, onInvalid }: Props = $props();
	let form = $state(createEmptySetCargoForm());

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const result = buildSetCargoCommand(form, holders);
		if (!result.ok) {
			onInvalid(result.reason);
			return;
		}
		onSetCargo(result.command);
	}
</script>

<Panel title="Set Cargo" accentVar="chrome-controller">
	<form class="set-cargo" onsubmit={handleSubmit} aria-label="Set cargo">
		<label>
			Holder
			<select bind:value={form.holderKey} aria-label="Cargo holder">
				{#each holders as holder (holder.key)}
					<option value={holder.key}>{holder.label}</option>
				{/each}
			</select>
		</label>
		<label>
			Cargo
			<select bind:value={form.cargoType} aria-label="Cargo type to set">
				{#each CARGO_TYPES as type (type)}
					<option value={type}>{CARGO_LABELS[type]}</option>
				{/each}
			</select>
		</label>
		<label>
			Quantity
			<input type="number" min="0" bind:value={form.quantity} aria-label="Cargo quantity" />
		</label>
		<button type="submit">Set Cargo</button>
	</form>
</Panel>

<style>
	.set-cargo {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.set-cargo label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	input[type='number'] {
		font-family: var(--font-data);
		background: var(--panel-alt);
		color: var(--text-primary);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
		width: 100%;
	}
</style>
