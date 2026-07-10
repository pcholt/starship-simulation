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
});
