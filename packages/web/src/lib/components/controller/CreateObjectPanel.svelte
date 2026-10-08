<script lang="ts">
	import Panel from '../shared/Panel.svelte';
	import {
		CREATABLE_KIND_LABELS,
		SUGGESTED_MISSIONS,
		buildCreateObjectCommand,
		createEmptyObjectForm,
		type CreatableKind
	} from './create-object-command.js';
	import type { Command } from '@starship/engine';

	interface Props {
		onCreate: (command: Command) => void;
		onInvalid: (reason: string) => void;
	}

	let { onCreate, onInvalid }: Props = $props();
	let form = $state(createEmptyObjectForm());

	let isCraft = $derived(form.kind !== 'celestialObject');
	let suggestedMissions = $derived(form.kind === 'celestialObject' ? [] : SUGGESTED_MISSIONS[form.kind]);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const result = buildCreateObjectCommand(form);
		if (!result.ok) {
			onInvalid(result.reason);
			return;
		}
		onCreate(result.command);
		form.name = '';
	}
</script>

<Panel title="Create Object" accentVar="chrome-controller">
	<form class="create-object" onsubmit={handleSubmit} aria-label="Create object">
		<label>
			Kind
			<select bind:value={form.kind} aria-label="Kind of object">
				{#each Object.entries(CREATABLE_KIND_LABELS) as [kind, label] (kind)}
					<option value={kind as CreatableKind}>{label}</option>
				{/each}
			</select>
		</label>
		<label>
			Name
			<input type="text" bind:value={form.name} aria-label="Object name" />
		</label>
		{#if isCraft}
			<label>
				Mission
				<input type="text" bind:value={form.mission} aria-label="Craft mission" list="suggested-missions" />
				<datalist id="suggested-missions">
					{#each suggestedMissions as mission (mission)}
						<option value={mission}></option>
					{/each}
				</datalist>
			</label>
		{/if}
		<div class="coordinates">
			<label>X <input type="number" bind:value={form.x} aria-label="Object X" /></label>
			<label>Y <input type="number" bind:value={form.y} aria-label="Object Y" /></label>
			<label>Z <input type="number" bind:value={form.z} aria-label="Object Z" /></label>
		</div>
		{#if !isCraft}
			<div class="coordinates">
				<label>Radius <input type="number" bind:value={form.radius} aria-label="Object radius" /></label>
				<label>Mass <input type="number" bind:value={form.mass} aria-label="Object mass" /></label>
			</div>
		{/if}
		<button type="submit">Create</button>
	</form>
</Panel>

<style>
	.create-object {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.create-object label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.coordinates {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
		gap: var(--space-2);
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
