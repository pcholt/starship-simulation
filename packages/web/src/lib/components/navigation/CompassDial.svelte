<script lang="ts">
	import { angleFromPointer, pointerFromAngle } from './compass-math.js';

	interface Props {
		headingDeg: number;
		/** Where the ship is steering toward, if different from the current heading — drawn as a fainter secondary marker. */
		intendedHeadingDeg?: number;
		onSelect: (headingDeg: number) => void;
	}

	let { headingDeg, intendedHeadingDeg, onSelect }: Props = $props();

	const VIEW_SIZE = 100;
	const CENTER = VIEW_SIZE / 2;
	const RADIUS = 42;

	let needle = $derived(pointerFromAngle(headingDeg, RADIUS));
	let intendedMarker = $derived(intendedHeadingDeg === undefined ? null : pointerFromAngle(intendedHeadingDeg, RADIUS));

	function handleClick(event: MouseEvent) {
		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const svgX = ((event.clientX - rect.left) / rect.width) * VIEW_SIZE;
		const svgY = ((event.clientY - rect.top) / rect.height) * VIEW_SIZE;
		// Headings are whole degrees, matching the book's SD command.
		onSelect(Math.round(angleFromPointer(svgX - CENTER, svgY - CENTER)) % 360);
	}

	const KEYBOARD_STEP_DEG = 5;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			onSelect((headingDeg + KEYBOARD_STEP_DEG) % 360);
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			onSelect((headingDeg - KEYBOARD_STEP_DEG + 360) % 360);
		}
	}

	const TICKS = [0, 45, 90, 135, 180, 225, 270, 315];
</script>

<div class="compass">
	<svg
		data-ui-sound="plotSelect"
		data-testid="compass-dial"
		viewBox="0 0 {VIEW_SIZE} {VIEW_SIZE}"
		role="slider"
		tabindex="0"
		aria-label="Compass — click or use arrow keys to set heading"
		aria-valuenow={Math.round(headingDeg)}
		aria-valuemin={0}
		aria-valuemax={359}
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		<circle cx={CENTER} cy={CENTER} r={RADIUS} fill="var(--panel-alt)" stroke="currentColor" stroke-width="0.5" />
		{#each TICKS as tick (tick)}
			{@const p1 = pointerFromAngle(tick, RADIUS)}
			{@const p2 = pointerFromAngle(tick, RADIUS - 4)}
			<line x1={CENTER + p1.x} y1={CENTER + p1.y} x2={CENTER + p2.x} y2={CENTER + p2.y} stroke="currentColor" stroke-width="0.5" />
		{/each}
		{#if intendedMarker}
			<line
				data-testid="compass-intended-marker"
				x1={CENTER}
				y1={CENTER}
				x2={CENTER + intendedMarker.x}
				y2={CENTER + intendedMarker.y}
				stroke="var(--chrome-navigation)"
				stroke-width="1"
				stroke-dasharray="3 2"
				opacity="0.6"
			/>
		{/if}
		<line x1={CENTER} y1={CENTER} x2={CENTER + needle.x} y2={CENTER + needle.y} stroke="var(--chrome-navigation)" stroke-width="2" />
		<circle cx={CENTER} cy={CENTER} r="2" fill="var(--chrome-navigation)" />
	</svg>
	<p data-testid="compass-heading">{Math.round(headingDeg)}°</p>
</div>

<style>
	.compass {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		max-width: 12rem;
	}

	svg {
		width: 100%;
		aspect-ratio: 1;
		cursor: crosshair;
	}

	p {
		margin: 0;
		font-family: var(--font-data);
		font-variant-numeric: tabular-nums;
		font-size: 1.1rem;
	}
</style>
