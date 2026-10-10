<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import Slider from '../shared/Slider.svelte';
	import LevelBar from '../shared/LevelBar.svelte';
	import { minimumOperationalEnergy, nominalMaximumEnergy, overdriveEnergyLimit } from '@starship/engine';
	import { DEVICE_GROUPS, type DeviceGroupId, deviceHealth, groupIdForDevice, humanizeDeviceId, summarizeGroupEnergy } from './device-groups.js';
	import { VALID_MISSIONS } from './engineering-command-parser.js';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let devices = $derived(Object.entries(store.state.engineering.devices));
	let shuttlecraft = $derived(store.state.engineering.shuttlecraft);
	let totalEnergy = $derived(store.state.engineering.totalEnergy);
	let radiatedEnergy = $derived(store.state.engineering.radiatedEnergy);
	let lockedGroups = $derived(store.state.engineering.lockedGroups);
	let groupEnergyShares = $derived(summarizeGroupEnergy(devices, totalEnergy));
	let devicesByGroup = $derived(
		DEVICE_GROUPS.map((group) => ({
			group,
			devices: devices.filter(([id]) => groupIdForDevice(id) === group.id)
		}))
	);

	async function handleSetEnergy(deviceId: string, amount: number) {
		const result = await store.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId, amount });
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleSetGroupToMinimum(group: DeviceGroupId) {
		const result = await store.dispatch({ module: 'engineering', type: 'SetGroupToMinimumEnergy', group });
		errorMessage = result.ok ? null : result.reason;
	}

	async function handleSetGroupLocked(group: DeviceGroupId, locked: boolean) {
		const result = await store.dispatch({ module: 'engineering', type: 'SetEnergyGroupLocked', group, locked });
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
		<div class="left-column">
			<Panel title="Energy Distribution" accentVar="chrome-engineering">
				<div class="distribution" data-testid="energy-distribution">
					<div class="distribution__bar" role="img" aria-label="Energy distribution across device groups">
						{#each groupEnergyShares as share (share.group.id)}
							<div
								class="distribution__segment"
								style:flex-grow={share.energy}
								style:background="var(--{share.group.accentVar})"
								title="{share.group.title}: {Math.round(share.energy)} EU"
							></div>
						{/each}
						<div
							class="distribution__segment distribution__segment--radiated"
							style:flex-grow={radiatedEnergy}
							title="Radiated: {Math.round(radiatedEnergy)} EU"
						></div>
					</div>
					<ul class="distribution__legend">
						{#each groupEnergyShares as share (share.group.id)}
							<li style:--group-accent="var(--{share.group.accentVar})">
								<span class="swatch"></span>
								<span class="legend-name">{share.group.title}</span>
								<span class="legend-value">{Math.round(share.percentOfTotal)}%</span>
							</li>
						{/each}
					</ul>
					<div class="distribution__total">
						<span>RADIATING <strong data-testid="radiated-energy" class="radiated">{Math.round(radiatedEnergy)} EU</strong></span>
						<span>TOTAL POOL <strong data-testid="total-energy">{totalEnergy} EU</strong></span>
					</div>
				</div>
			</Panel>

			<Panel title="Energy Allocation" accentVar="chrome-engineering" grow>
				<div class="device-groups" data-testid="energy-allocation-sliders">
					{#each devicesByGroup as { group, devices: groupDevices } (group.id)}
						<section class="device-group" style:--group-accent="var(--{group.accentVar})" aria-label={group.title}>
							<header class="device-group__header">
								<h3>{group.title}</h3>
								{#if groupDevices.some(([id]) => minimumOperationalEnergy(id) > 0)}
									<button
										type="button"
										class="minimum-button"
										aria-label={`Set ${group.title} to minimum`}
										onclick={() => handleSetGroupToMinimum(group.id)}
									>
										Set minimum
									</button>
								{/if}
								<label class="lock">
									<input
										type="checkbox"
										aria-label={`Lock ${group.title}`}
										checked={lockedGroups.includes(group.id)}
										onchange={(e) => handleSetGroupLocked(group.id, (e.currentTarget as HTMLInputElement).checked)}
									/>
									Locked
								</label>
							</header>
							{#each groupDevices as [id, device] (id)}
								<div class="device-row">
									<span
										class="health-dot"
										data-health={deviceHealth(device)}
										title="FUNC {device.functionalStatus} · OPER {device.operationalStatus} · REL {device.reliabilityFactor}"
									></span>
									<Slider
										label={`${id} Energy`}
										displayLabel={humanizeDeviceId(id)}
										labelAlert={device.energyAssigned < minimumOperationalEnergy(id)}
										labelTestId={`device-${id}-label`}
										value={Math.round(device.energyRequested)}
										min={0}
										max={overdriveEnergyLimit(id)}
										step={overdriveEnergyLimit(id) <= 50 ? 1 : 10}
										overdrive={Math.round(device.energyRequested) > nominalMaximumEnergy(id)}
										warnAbove={nominalMaximumEnergy(id)}
										warnBelow={minimumOperationalEnergy(id) || undefined}
										rowTestId={`device-${id}-row`}
										unit="EU"
										accentVar={group.accentVar}
										testId={`device-${id}-energy`}
										onChange={(v) => handleSetEnergy(id, v)}
									>
										{#snippet behindTrack()}
											<LevelBar
												label={`${id} current energy`}
												value={device.energyAssigned}
												max={overdriveEnergyLimit(id)}
												testId={`device-${id}-current-energy`}
												title="Receiving {Math.round(device.energyAssigned)} EU"
											/>
										{/snippet}
									</Slider>
								</div>
							{/each}
						</section>
					{/each}
				</div>
			</Panel>
		</div>

		<div class="right-column">
			<Panel title="Shuttlecraft" accentVar="chrome-engineering">
				<div class="shuttle-grid">
					{#each shuttlecraft as shuttle (shuttle.id)}
						<label class="shuttle-card">
							<span class="shuttle-card__title">Shuttle {shuttle.id}</span>
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
						</label>
					{/each}
				</div>
			</Panel>

			<Panel title="Alerts" accentVar="chrome-neutral">
				<div aria-label="Alerts">
					{#if errorMessage}
						<p role="alert">{errorMessage}</p>
					{/if}
				</div>
			</Panel>

		</div>
	</div>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.grid {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: var(--space-4);
	}

	.left-column,
	.right-column {
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.distribution {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.distribution__bar {
		display: flex;
		height: 1.1rem;
		border-radius: 999px;
		overflow: hidden;
		background: var(--panel-alt);
		gap: 2px;
	}

	.distribution__segment {
		flex-basis: 0;
		min-width: 0;
	}

	.distribution__segment--radiated {
		background: repeating-linear-gradient(45deg, #3a3d4c 0 4px, #2a2c38 4px 8px);
	}

	.radiated {
		color: var(--status-warning);
	}

	.distribution__legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.distribution__legend li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--group-accent);
	}

	.legend-value {
		font-family: var(--font-data);
		color: var(--text-primary);
	}

	.distribution__total {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
		align-items: baseline;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.distribution__total strong {
		font-family: var(--font-display);
		font-size: 1.2rem;
		margin-left: var(--space-2);
	}

	.distribution__total strong:not(.radiated) {
		color: var(--chrome-engineering);
	}

	.device-groups {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-3);
		align-content: start;
	}

	.device-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		height: auto;
		padding: var(--space-3);
		background: var(--panel-alt);
		border-left: 0.3rem solid var(--group-accent);
		border-radius: var(--radius-sm) var(--radius-capsule) var(--radius-capsule) var(--radius-sm);
	}

	.device-group h3 {
		margin: 0;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		color: var(--group-accent);
	}

	.device-group:last-child {
		grid-column: span 2;
	}

	.device-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0 var(--space-2);
	}

	.device-row {
		--slider-label-width: 8.5rem;
		--slider-value-width: 4.5rem;
		--slider-height: 1.3rem;
	}

	.device-group__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.device-group__header h3 {
		margin-right: auto;
	}

	.minimum-button {
		margin-right: var(--space-3);
		padding: 0.1rem var(--space-2);
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--group-accent);
		border-color: var(--group-accent);
	}

	.lock {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		cursor: pointer;
	}

	.lock input {
		accent-color: var(--group-accent);
	}

	.device-row :global(.slider) {
		flex: 1;
	}

	.health-dot {
		flex: none;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--status-ok);
		box-shadow: 0 0 0.4rem currentColor;
		color: var(--status-ok);
	}

	.health-dot[data-health='warning'] {
		background: var(--status-warning);
		color: var(--status-warning);
	}

	.health-dot[data-health='critical'] {
		background: var(--status-critical);
		color: var(--status-critical);
	}

	.shuttle-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-2);
	}

	.shuttle-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		background: var(--panel-alt);
		border-top: 0.2rem solid var(--chrome-engineering);
		border-radius: var(--radius-sm);
	}

	.shuttle-card__title {
		font-family: var(--font-display);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--chrome-engineering);
	}

	.mission-select {
		width: 100%;
		background: var(--panel);
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
