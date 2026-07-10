<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	import { parseEngineeringCommand, ENGINEERING_COMMANDS, VALID_MISSIONS } from './engineering-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let devices = $derived(Object.entries(store.state.engineering.devices));
	let shuttlecraft = $derived(store.state.engineering.shuttlecraft);
	let totalEnergy = $derived(store.state.engineering.totalEnergy);

	async function handleSubmit(text: string) {
		const parsed = parseEngineeringCommand(text);
		if (!parsed.ok) {
			errorMessage = parsed.reason;
			return;
		}
		const result = await store.dispatch(parsed.command);
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleSetEnergy(deviceId: string, amount: number) {
		const result = await store.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId, amount });
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleSetMission(shuttlecraftId: number, mission: string) {
		const result = await store.dispatch({
			module: 'engineering',
			type: 'SetShuttlecraftMission',
			shuttlecraftId,
			mission: mission as (typeof VALID_MISSIONS)[number]
		});
		errorMessage = result.ok ? null : result.reason;
	}
</script>

<section aria-label="Engineering station">
	<h2>Engineering</h2>
	<StationStatusBar {store} moduleName="engineering" />

	<div class="grid">
		<Panel title="Energy Allocation" accentVar="chrome-engineering">
			<div class="device-controls">
				{#each devices as [id, device] (id)}
					<div class="device-row">
						<Slider
							label={`${id} Energy`}
							value={Math.round(device.energyAssigned)}
							min={0}
							max={totalEnergy}
							step={10}
							unit="EU"
							accentVar="chrome-engineering"
							testId={`device-${id}-energy`}
							onChange={(v) => handleSetEnergy(id, v)}
						/>
						<span class="device-stats">FUNC {device.functionalStatus} · OPER {device.operationalStatus} · REL {device.reliabilityFactor}</span>
					</div>
				{/each}
			</div>
		</Panel>

		<Panel title="Shuttlecraft" accentVar="chrome-engineering">
			<table>
				<thead>
					<tr>
						<th>NBR</th>
						<th>MISSION</th>
					</tr>
				</thead>
				<tbody>
					{#each shuttlecraft as shuttle (shuttle.id)}
						<tr>
							<td>{shuttle.id}</td>
							<td>
								<select
									class="mission-select"
									aria-label={`Shuttlecraft ${shuttle.id} Mission`}
									value={shuttle.mission}
									onchange={(e) => handleSetMission(shuttle.id, (e.currentTarget as HTMLSelectElement).value)}
								>
									{#each VALID_MISSIONS as mission (mission)}
										<option value={mission}>{mission}</option>
									{/each}
								</select>
								<!-- Mirrors the select's selected value as plain text: a <select>'s own textContent
								     always includes every option, so tests can't assert the selection from it alone. -->
								<span data-testid={`shuttlecraft-${shuttle.id}-mission`} class="sr-only">{shuttle.mission}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Panel>

		<Panel title="Alerts" accentVar="chrome-neutral">
			<div aria-label="Alerts"></div>
		</Panel>

		<Panel title="Command" accentVar="chrome-engineering">
			<CommandBox onSubmit={handleSubmit} {errorMessage} accentVar="chrome-engineering" />
			<CommandReference commands={ENGINEERING_COMMANDS} />
		</Panel>
	</div>
</section>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.device-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: 32rem;
		overflow-y: auto;
	}

	.device-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.device-stats {
		font-family: var(--font-data);
		font-size: 0.75rem;
		color: var(--text-muted);
		padding-left: calc(5rem + var(--space-3));
	}

	.mission-select {
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-body);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
