<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();

	let icu = $derived(store.state.medical.icu);
	let computer = $derived(store.state.engineering.devices.intensiveCareUnit!);

	/** Health is 0-10 (0 = dead, 10 = fully recovered) — a different scale from the device percent fields elsewhere. */
	const MAX_HEALTH = 10;

	function healthStatus(health: number): 'ok' | 'warning' | 'critical' {
		if (health >= 7) return 'ok';
		if (health >= 3) return 'warning';
		return 'critical';
	}
</script>

<section aria-label="Medical station">
	<h2>Medical</h2>
	<StationStatusBar {store} moduleName="medical" />

	<div class="grid">
		<Panel title="Intensive Care Unit" accentVar="chrome-medical">
			<div class="icu-grid">
				{#each icu as patient, i (i)}
					<div class="icu-slot">
						<span class="icu-unit">UNIT {i + 1}</span>
						<span class="icu-name" data-testid={`icu-slot-${i}`}>
							{#if patient}
								{patient.name} ({patient.health.toFixed(1)})
							{:else}
								EMPTY
							{/if}
						</span>
						{#if patient}
							<div class="health-bar" data-status={healthStatus(patient.health)}>
								<div class="health-bar__fill" style:width={`${(patient.health / MAX_HEALTH) * 100}%`}></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</Panel>

		<Panel title="Medical Computer" accentVar="chrome-medical">
			<dl>
				<dt>OPSTAT</dt>
				<dd>{computer.operationalStatus}</dd>
				<dt>FUNCSTAT</dt>
				<dd>{computer.functionalStatus}</dd>
			</dl>
		</Panel>

		<Panel title="Alerts" accentVar="chrome-neutral">
			<div aria-label="Alerts"></div>
		</Panel>
	</div>

	<p><em>Medical has no direct operator commands — patients are admitted via the Communications officer.</em></p>
</section>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.icu-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.icu-slot {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		padding: var(--space-3);
	}

	.icu-unit {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.icu-name {
		font-family: var(--font-data);
	}

	.health-bar {
		height: 0.4rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}

	.health-bar__fill {
		height: 100%;
		border-radius: 999px;
	}

	.health-bar[data-status='ok'] .health-bar__fill {
		background: var(--status-ok);
	}

	.health-bar[data-status='warning'] .health-bar__fill {
		background: var(--status-warning);
	}

	.health-bar[data-status='critical'] .health-bar__fill {
		background: var(--status-critical);
	}
</style>
