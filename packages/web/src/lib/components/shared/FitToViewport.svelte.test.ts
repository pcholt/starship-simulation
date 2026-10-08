import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FitToViewportTestHost from './FitToViewportTestHost.svelte';

const waitForRefit = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('FitToViewport', () => {
	it('shrinks content that is taller than the frame so it fits without scrolling', async () => {
		render(FitToViewportTestHost, { contentHeightPx: 600 });
		await waitForRefit();

		const frame = page.getByTestId('fit-frame').element().getBoundingClientRect();
		const child = page.getByTestId('tall-child').element().getBoundingClientRect();

		expect(child.height).toBeLessThanOrEqual(frame.height);
	});

	it('does not shrink content that already fits the frame', async () => {
		render(FitToViewportTestHost, { contentHeightPx: 100 });
		await waitForRefit();

		const child = page.getByTestId('tall-child').element().getBoundingClientRect();

		expect(child.height).toBeGreaterThanOrEqual(100);
	});

	it('hides overflow on the frame instead of letting the page scroll', async () => {
		render(FitToViewportTestHost, { contentHeightPx: 1000 });

		const frameOverflow = getComputedStyle(page.getByTestId('fit-frame').element()).overflow;

		expect(frameOverflow).toBe('hidden');
	});

	it('leaves content at its natural size when given a fixed scale of 1', async () => {
		render(FitToViewportTestHost, { contentHeightPx: 600, fixedScale: 1 });
		await waitForRefit();

		const child = page.getByTestId('tall-child').element().getBoundingClientRect();

		expect(child.height).toBe(600);
	});
});
