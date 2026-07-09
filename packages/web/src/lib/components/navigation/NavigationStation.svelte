<script lang="ts">
	import type { WorldStateStore } from '../../stores/world-state.svelte.js';
	import CommandBox from '../shared/CommandBox.svelte';
	import { parseNavigationCommand } from './navigation-command-parser.js';

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
	</dl>

	<div aria-label="Alerts">
		<h3>ALERTS</h3>
	</div>

	<CommandBox onSubmit={handleSubmit} {errorMessage} />
</section>
