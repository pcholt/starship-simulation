<script lang="ts">
	import { distanceBetween } from '@starship/engine';
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import CommandReference from '../shared/CommandReference.svelte';
	import StationStatusBar from '../shared/StationStatusBar.svelte';
	import AstrogatorPlot from './AstrogatorPlot.svelte';
	import { parseNavigationCommand, NAVIGATION_COMMANDS } from './navigation-command-parser.js';

	/** Plot radius in world distance-units — matches Sciences' partial-scan range, since both represent sensor reach. */
	const PLOT_RANGE = 1000;

	interface Props {
		store: WorldStateStore;
	}

	let { store }: Props = $props();
	let errorMessage: string | null = $state(null);

	let navigation = $derived(store.state.enterpriseNavigation);
	let destinationLabel = $derived.by(() => {
		const destination = navigation.destination;
		if (!destination) return 'NONE';
		if (destination.kind === 'coordinates') return `${destination.x}, ${destination.y}, ${destination.z}`;
		if (destination.kind === 'celestialObject') return `Celestial Object #${destination.id}`;
		if (destination.kind === 'craft') return `${destination.craftClass} #${destination.id}`;
		return destination.kind;
	});

	// Resolves the destination to a concrete point so ETA can be computed, whatever kind of Location it is.
	let destinationPosition = $derived.by(() => {
		const destination = navigation.destination;
		if (!destination) return null;
		if (destination.kind === 'coordinates') return { x: destination.x, y: destination.y, z: destination.z };
		if (destination.kind === 'celestialObject') {
			return store.state.celestialObjects.find((o) => o.id === destination.id)?.position ?? null;
		}
		if (destination.kind === 'craft') {
			const fleet = destination.craftClass === 'enemy' ? store.state.enemyCraft : store.state.federationCraft;
			return fleet.find((c) => c.id === destination.id)?.position ?? null;
		}
		return null;
	});

	let eta = $derived.by(() => {
		if (!destinationPosition || navigation.velocity.warpSpeed <= 0) return 'N/A';
		const distance = distanceBetween(navigation.position, destinationPosition);
		return `${(distance / navigation.velocity.warpSpeed).toFixed(1)}s`;
	});

	let plotEntities = $derived([
		...store.state.celestialObjects.map((o) => ({ name: o.name, kind: 'celestialObject' as const, position: o.position })),
		...store.state.enemyCraft.map((c) => ({ name: c.name, kind: 'enemyCraft' as const, position: c.position })),
		...store.state.federationCraft.map((c) => ({ name: c.name, kind: 'federationCraft' as const, position: c.position }))
	]);

	// Supplementary detail table alongside the Astrogator plot — the same entities, but with exact distance and no range cutoff.
	let nearbyObjects = $derived(
		plotEntities
			.map((e) => ({ ...e, distance: distanceBetween(navigation.position, e.position) }))
			.sort((a, b) => a.distance - b.distance)
	);

	const KIND_LABELS = { celestialObject: 'celestial object', enemyCraft: 'enemy craft', federationCraft: 'federation craft' };

	function handleSubmit(text: string) {
		const result = parseNavigationCommand(text);
		if (!result.ok) {
			errorMessage = result.reason;
			return;
		}
		errorMessage = null;
		store.dispatch(result.command);
	}
</script>

<section aria-label="Navigation station">
	<h2>Navigation</h2>
	<StationStatusBar {store} moduleName="navigation" />

	<dl>
		<dt>X-COORDINATE</dt>
		<dd data-testid="nav-position-x">{navigation.position.x}</dd>
		<dt>Y-COORDINATE</dt>
		<dd data-testid="nav-position-y">{navigation.position.y}</dd>
		<dt>Z-COORDINATE</dt>
		<dd data-testid="nav-position-z">{navigation.position.z}</dd>

		<dt>X/Y DIRECTION</dt>
		<dd data-testid="nav-xy-angle">{navigation.velocity.xyAngleDeg}</dd>
		<dt>X/Z DIRECTION</dt>
		<dd data-testid="nav-xz-angle">{navigation.velocity.xzAngleDeg}</dd>
		<dt>SPEED</dt>
		<dd data-testid="nav-speed">{navigation.velocity.warpSpeed}</dd>

		<dt>DESTINATION</dt>
		<dd data-testid="nav-destination">{destinationLabel}</dd>
		<dt>ETA</dt>
		<dd data-testid="nav-eta">{eta}</dd>

		<dt>CHRONOMETER</dt>
		<dd data-testid="nav-chronometer">{store.state.simulatedTimeMs}</dd>
	</dl>

	<AstrogatorPlot center={navigation.position} entities={plotEntities} range={PLOT_RANGE} />

	<h3>Nearby Objects</h3>
	<table>
		<thead>
			<tr>
				<th>NAME</th>
				<th>KIND</th>
				<th>DISTANCE</th>
			</tr>
		</thead>
		<tbody data-testid="nearby-objects">
			{#each nearbyObjects as entry (entry.name)}
				<tr>
					<td>{entry.name}</td>
					<td>{KIND_LABELS[entry.kind]}</td>
					<td>{entry.distance.toFixed(1)}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
	<CommandReference commands={NAVIGATION_COMMANDS} />
</section>
