<script lang="ts">
	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step: number;
		unit?: string;
		accentVar?: string;
		/** Overrides the value readout's data-testid — useful on a page with many sliders where `slider-value` alone wouldn't be unique. */
		testId?: string;
		onChange: (value: number) => void;
	}

	let { label, value, min, max, step, unit = '', accentVar = 'chrome-neutral', testId = 'slider-value', onChange }: Props = $props();

	function handleInput(event: Event) {
		onChange(Number((event.currentTarget as HTMLInputElement).value));
	}
</script>

<label class="slider" style:--accent="var(--{accentVar})">
	<span class="slider__label">{label}</span>
	<input type="range" aria-label={label} {min} {max} {step} {value} oninput={handleInput} />
	<span data-testid={testId} class="slider__value">{value}{unit ? ` ${unit}` : ''}</span>
</label>

<style>
	.slider {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.slider__label {
		font-family: var(--font-body);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.75rem;
		color: var(--text-muted);
		min-width: 5rem;
	}

	input[type='range'] {
		flex: 1;
		accent-color: var(--accent);
	}

	.slider__value {
		font-family: var(--font-data);
		font-variant-numeric: tabular-nums;
		min-width: 4.5rem;
		text-align: right;
	}
</style>
