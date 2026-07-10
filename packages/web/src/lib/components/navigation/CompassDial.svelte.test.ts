import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CompassDial from './CompassDial.svelte';

describe('CompassDial', () => {
	it('shows the current heading value', async () => {
		render(CompassDial, { headingDeg: 45, onSelect: () => {} });
		await expect.element(page.getByTestId('compass-heading')).toHaveTextContent('45');
	});

	it('calls onSelect with a heading in [0, 360) when the dial is clicked', async () => {
		const onSelect = vi.fn();
		render(CompassDial, { headingDeg: 0, onSelect });

		const dial = page.getByTestId('compass-dial');
		await dial.click();

		expect(onSelect).toHaveBeenCalledTimes(1);
		const [heading] = onSelect.mock.calls[0]!;
		expect(heading).toBeGreaterThanOrEqual(0);
		expect(heading).toBeLessThan(360);
	});
});
