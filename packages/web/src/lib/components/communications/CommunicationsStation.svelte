<script lang="ts">
	import type { ShipStation } from '@starship/engine';
	import { SHIP_STATIONS, communicationsRange, manifestsInRange } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import Panel from '../shared/Panel.svelte';
	import CargoManifestPanel from './CargoManifestPanel.svelte';
	import CrewRosterPanel from '../crew/CrewRosterPanel.svelte';

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let currentMessage = $derived(store.state.communications.lastDisplayedMessage);
	let queueLength = $derived(store.state.communications.messageQueue.length);
	let log = $derived(store.state.communications.log);
	let federationCraft = $derived(store.state.federationCraft);
	let enemyCraft = $derived(store.state.enemyCraft);
	let range = $derived(communicationsRange(store.state.engineering.devices));
	let manifests = $derived(
		manifestsInRange(
			{ federationCraft: store.state.federationCraft, celestialObjects: store.state.celestialObjects },
			store.state.enterpriseNavigation.position,
			range
		)
	);

	let personnelName = $state('');
	let personnelStation: ShipStation = $state(SHIP_STATIONS[0]);
	let cargoType = $state('');
	let cargoStation: ShipStation = $state(SHIP_STATIONS[0]);

	async function dispatchAndReport(command: Parameters<WorldStateStore['dispatch']>[0]) {
		const result = await store.dispatch(command);
		errorMessage = result.ok ? null : result.reason;
	}

	function handleDisplayNextMessage() {
		dispatchAndReport({ module: 'communications', type: 'DisplayNextMessage' });
	}

	function handleSendDistressMessage() {
		dispatchAndReport({ module: 'communications', type: 'SendDistressMessage' });
	}

	function handleRequestAid(federationCraftName: string) {
		dispatchAndReport({ module: 'communications', type: 'RequestAid', federationCraftName });
	}

	function handleSendPeaceOffer(craftName: string) {
		dispatchAndReport({ module: 'communications', type: 'SendPeaceOffer', craftName });
	}

	function handleAcceptPeaceOffer(craftName: string) {
		dispatchAndReport({ module: 'communications', type: 'AcceptPeaceOffer', craftName });
	}

	function handleRejectPeaceOffer(craftName: string) {
		dispatchAndReport({ module: 'communications', type: 'RejectPeaceOffer', craftName });
	}

	function handleRequestPersonnelMovement() {
		if (!personnelName.trim()) return;
		dispatchAndReport({
			module: 'communications',
			type: 'RequestPersonnelMovement',
			personnelName: personnelName.trim(),
			destination: { kind: 'shipStation', station: personnelStation }
		});
	}

	function handleRequestCargoMovement() {
		if (!cargoType.trim()) return;
		dispatchAndReport({
			module: 'communications',
			type: 'RequestCargoMovement',
			cargoType: cargoType.trim(),
			destination: { kind: 'shipStation', station: cargoStation }
		});
	}
</script>

<section aria-label="Communications station">
	<h2>Communications</h2>
	<StationStatusBar {store} moduleName="communications" />

	<div class="grid">
		<div class="sidebar">
			<Panel title="Current Message" accentVar="chrome-communications">
				<p data-testid="current-message">
					{#if currentMessage}
						{currentMessage.from}: {currentMessage.text}
					{:else}
						NONE
					{/if}
				</p>
				<p>Messages waiting: {queueLength}</p>
				<button onclick={handleDisplayNextMessage}>Display Next Message</button>
				<button onclick={handleSendDistressMessage}>Send Distress Signal</button>
			</Panel>

			<Panel title="Log" accentVar="chrome-neutral">
				<ul data-testid="comms-log">
					{#each log as entry, i (i)}
						<li>{entry}</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Alerts" accentVar="chrome-neutral">
				<div aria-label="Alerts">
					{#if errorMessage}
						<p role="alert">{errorMessage}</p>
					{/if}
				</div>
			</Panel>
		</div>

		<div class="main-column">
			<Panel title="Federation Craft — Request Aid" accentVar="chrome-communications">
				<ul class="target-list">
					{#each federationCraft as craft (craft.id)}
						<li>
							<span class="target-name">{craft.name}</span>
							<button data-testid={`request-aid-${craft.name}`} onclick={() => handleRequestAid(craft.name)}>Request Aid</button>
						</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Enemy Craft — Peace Offers" accentVar="chrome-communications">
				<ul class="target-list">
					{#each enemyCraft as craft (craft.id)}
						<li>
							<span class="target-name">{craft.name}</span>
							<button data-testid={`send-peace-offer-${craft.name}`} onclick={() => handleSendPeaceOffer(craft.name)}
								>Send Peace Offer</button
							>
							<button data-testid={`accept-peace-offer-${craft.name}`} onclick={() => handleAcceptPeaceOffer(craft.name)}
								>Accept</button
							>
							<button data-testid={`reject-peace-offer-${craft.name}`} onclick={() => handleRejectPeaceOffer(craft.name)}
								>Reject</button
							>
						</li>
					{/each}
				</ul>
			</Panel>

			<Panel title="Request Personnel / Cargo Movement" accentVar="chrome-communications">
				<div class="movement-form">
					<label>
						Personnel name
						<input type="text" bind:value={personnelName} />
					</label>
					<label>
						Destination
						<select aria-label="Personnel destination station" bind:value={personnelStation}>
							{#each SHIP_STATIONS as station (station)}
								<option value={station}>{station}</option>
							{/each}
						</select>
					</label>
					<button onclick={handleRequestPersonnelMovement}>Request Personnel Movement</button>
				</div>
				<div class="movement-form">
					<label>
						Cargo type
						<input type="text" bind:value={cargoType} />
					</label>
					<label>
						Destination
						<select aria-label="Cargo destination station" bind:value={cargoStation}>
							{#each SHIP_STATIONS as station (station)}
								<option value={station}>{station}</option>
							{/each}
						</select>
					</label>
					<button onclick={handleRequestCargoMovement}>Request Cargo Movement</button>
				</div>
			</Panel>

			<CargoManifestPanel enterpriseCargo={store.state.cargo} manifestsInRange={manifests} communicationsRange={range} />
		</div>

		<div class="roster-column">
			<CrewRosterPanel crewStatus={store.state.crewStatus} />
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
		grid-template-columns: minmax(260px, 320px) minmax(0, 1fr) minmax(0, 1.2fr);
		gap: var(--space-4);
	}

	.roster-column {
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.main-column {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}

	.target-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.target-list li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.target-name {
		flex: 1;
	}

	.movement-form {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.movement-form label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.movement-form input,
	.movement-form select {
		background: var(--panel-alt);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-body);
	}

	@media (max-width: 800px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
