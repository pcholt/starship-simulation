<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step: number;
		unit?: string;
		/** Visible text shown in place of `label`; `label` stays the accessible name. */
		displayLabel?: string;
		/** Puts a critical-red background behind the label. */
		labelAlert?: boolean;
		labelTestId?: string;
		/** Puts an orange background behind the whole slider. */
		overdrive?: boolean;
		rowTestId?: string;
		accentVar?: string;
		/** Overrides the value readout's data-testid — useful on a page with many sliders where `slider-value` alone wouldn't be unique. */
		testId?: string;
		onChange: (value: number) => void;
		/** Rendered behind the slider, filling the track exactly, so the thumb appears to drag it. */
		behindTrack?: Snippet;
	}

	let { label, value, min, max, step, unit = '', displayLabel, labelAlert = false, labelTestId, overdrive = false, rowTestId, accentVar = 'chrome-neutral', testId = 'slider-value', onChange, behindTrack }: Props = $props();

	function handleInput(event: Event) {
		onChange(Number((event.currentTarget as HTMLInputElement).value));
	}
</script>

<label class="slider" class:slider--overdrive={overdrive} data-overdrive={overdrive} data-testid={rowTestId} style:--accent="var(--{accentVar})">
	<span class="slider__label" class:slider__label--alert={labelAlert} data-testid={labelTestId} data-alert={labelAlert}>{displayLabel ?? label}</span>
	<span class="slider__track">
		{#if behindTrack}
			{@render behindTrack()}
		{:else}
			<span class="slider__rail"></span>
		{/if}
		<input type="range" aria-label={label} {min} {max} {step} {value} oninput={handleInput} />
	</span>
	<span data-testid={testId} class="slider__value">{value}{unit ? ` ${unit}` : ''}</span>
</label>

<style>
	.slider {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.slider--overdrive {
		background: var(--status-overdrive);
		border-radius: var(--radius-sm);
		box-shadow: 0 0 0 var(--space-1) var(--status-overdrive);
	}

	.slider--overdrive .slider__label,
	.slider--overdrive .slider__value {
		color: var(--text-on-chrome);
	}

	.slider__label {
		font-family: var(--font-body);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.75rem;
		color: var(--text-muted);
		flex: none;
		width: var(--slider-label-width, auto);
		min-width: 5rem;
	}

	.slider__label--alert {
		background: var(--status-critical);
		color: var(--text-on-chrome);
		border-radius: var(--radius-sm);
		text-align: center;
	}

	.slider__track {
		position: relative;
		flex: 1;
		min-width: 5rem;
		height: var(--slider-height, 1rem);
	}

	.slider__rail {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 0.25rem;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.18);
		border-radius: 999px;
	}

	input[type='range'] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		background: transparent;
		-webkit-appearance: none;
		appearance: none;
	}

	input[type='range']::-webkit-slider-runnable-track {
		height: var(--slider-height, 1rem);
		background: transparent;
	}

	input[type='range']::-moz-range-track {
		height: var(--slider-height, 1rem);
		background: transparent;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 0.4rem;
		height: var(--slider-height, 1rem);
		border-radius: 999px;
		border: none;
		background: var(--accent);
		box-shadow: 0 0 0 1px var(--panel, #0a0c12);
	}

	input[type='range']::-moz-range-thumb {
		width: 0.4rem;
		height: var(--slider-height, 1rem);
		border-radius: 999px;
		border: none;
		background: var(--accent);
	}

	.slider__value {
		font-family: var(--font-data);
		font-variant-numeric: tabular-nums;
		flex: none;
		width: var(--slider-value-width, auto);
		min-width: 4.5rem;
		text-align: right;
	}
</style>
