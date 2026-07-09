import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import CommunicationsStation from './CommunicationsStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('CommunicationsStation', () => {
	it('shows no message before any have been received', async () => {
		const store = setup();
		render(CommunicationsStation, { store });

		await expect.element(page.getByTestId('current-message')).toHaveTextContent('NONE');
	});

	it('displays the next queued message after a D M command', async () => {
		const store = setup();
		store.dispatch({ module: 'communications', type: 'ReceiveMessage', from: 'Starbase 12', text: 'Report status' });
		render(CommunicationsStation, { store });

		await page.getByLabelText('Command input').fill('D M');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('current-message')).toHaveTextContent('Starbase 12');
		await expect.element(page.getByTestId('current-message')).toHaveTextContent('Report status');
	});

	it('sends a distress message and logs it', async () => {
		const store = setup();
		render(CommunicationsStation, { store });

		await page.getByLabelText('Command input').fill('S D');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('Distress message sent');
	});

	it('shows an error for a peace offer sent to a nonexistent craft', async () => {
		const store = setup();
		render(CommunicationsStation, { store });

		await page.getByLabelText('Command input').fill('S P O Nobody');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});
});
