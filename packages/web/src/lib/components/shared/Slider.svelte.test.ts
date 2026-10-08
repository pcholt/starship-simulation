import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Slider from './Slider.svelte';

describe('Slider', () => {
	it('shows the label and current value', async () => {
		render(Slider, { label: 'Speed', value: 5, min: 0, max: 20, step: 1, unit: 'warp', onChange: () => {} });
		await expect.element(page.getByText('Speed')).toBeInTheDocument();
		await expect.element(page.getByTestId('slider-value')).toHaveTextContent('5 warp');
	});

	it('calls onChange with the new value when moved', async () => {
		const onChange = vi.fn();
		render(Slider, { label: 'Speed', value: 5, min: 0, max: 20, step: 1, onChange });

		await page.getByLabelText('Speed').fill('12');

		expect(onChange).toHaveBeenCalledWith(12);
	});

	it('uses a caller-supplied testId for the value readout, for pages with many sliders', async () => {
		render(Slider, { label: 'Shield Fore', value: 40, min: 0, max: 100, step: 1, testId: 'shield-fore-level', onChange: () => {} });

		await expect.element(page.getByTestId('shield-fore-level')).toHaveTextContent('40');
	});

	it('shows the display label while keeping the label as the accessible name', async () => {
		render(Slider, { label: 'phaser-fore Energy', displayLabel: 'Fore', value: 1, min: 0, max: 2, step: 1, onChange: () => {} });

		await expect.element(page.getByText('Fore')).toBeInTheDocument();
		await expect.element(page.getByLabelText('phaser-fore Energy')).toBeInTheDocument();
	});

	it('flags the label as alerting only when asked to', async () => {
		render(Slider, { label: 'Warp', value: 1, min: 0, max: 2, step: 1, labelAlert: true, labelTestId: 'warp-label', onChange: () => {} });

		await expect.element(page.getByTestId('warp-label')).toHaveAttribute('data-alert', 'true');
	});

	it('does not flag the label by default', async () => {
		render(Slider, { label: 'Warp', value: 1, min: 0, max: 2, step: 1, labelTestId: 'warp-label', onChange: () => {} });

		await expect.element(page.getByTestId('warp-label')).toHaveAttribute('data-alert', 'false');
	});

	it('marks the slider as overdriven only when asked to', async () => {
		render(Slider, { label: 'Warp', value: 1, min: 0, max: 2, step: 1, overdrive: true, rowTestId: 'warp-row', onChange: () => {} });

		await expect.element(page.getByTestId('warp-row')).toHaveAttribute('data-overdrive', 'true');
	});

	it('does not mark the slider as overdriven by default', async () => {
		render(Slider, { label: 'Warp', value: 1, min: 0, max: 2, step: 1, rowTestId: 'warp-row', onChange: () => {} });

		await expect.element(page.getByTestId('warp-row')).toHaveAttribute('data-overdrive', 'false');
	});
});
