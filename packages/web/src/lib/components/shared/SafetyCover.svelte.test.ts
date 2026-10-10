import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SafetyCoverTestHost from './SafetyCoverTestHost.svelte';

describe('SafetyCover', () => {
	it('starts closed, with its controls unreachable', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: false });

		await expect.element(page.getByTestId('cover')).toHaveAttribute('data-open', 'false');
		expect(page.getByTestId('covered-button').element().closest('[inert]')).not.toBeNull();
	});

	it('does not fire the covered control when the cover is clicked while closed', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: false });

		await page.getByTestId('cover').click();

		await expect.element(page.getByTestId('fire-count')).toHaveTextContent('0');
	});

	it('lifts when the cover is clicked, making the control reachable', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: false });

		await page.getByTestId('cover').click();

		await expect.element(page.getByTestId('cover')).toHaveAttribute('data-open', 'true');
		expect(page.getByTestId('covered-button').element().closest('[inert]')).toBeNull();
	});

	it('lets the covered control be used once lifted', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: false });
		await page.getByTestId('cover').click();

		await page.getByTestId('covered-button').click();

		await expect.element(page.getByTestId('fire-count')).toHaveTextContent('1');
	});

	it('closes again when the cover is clicked a second time', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: false });
		await page.getByTestId('cover').click();

		await page.getByTestId('cover').click();

		await expect.element(page.getByTestId('cover')).toHaveAttribute('data-open', 'false');
	});

	it('names what it protects in its accessible label, and reflects whether it is open', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: false });

		await expect.element(page.getByLabelText('Lift safety cover over test weapons')).toHaveAttribute('aria-expanded', 'false');
		await page.getByTestId('cover').click();
		await expect.element(page.getByLabelText('Close safety cover over test weapons')).toHaveAttribute('aria-expanded', 'true');
	});

	it('can be opened from outside through its bound open state', async () => {
		render(SafetyCoverTestHost, { initiallyOpen: true });

		await expect.element(page.getByTestId('cover')).toHaveAttribute('data-open', 'true');
	});
});
