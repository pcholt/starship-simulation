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

	it('displays the next message by clicking a button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({ module: 'communications', type: 'ReceiveMessage', from: 'Starbase 12', text: 'Report status' });
		render(CommunicationsStation, { store });

		await page.getByRole('button', { name: 'Display Next Message' }).click();

		await expect.element(page.getByTestId('current-message')).toHaveTextContent('Starbase 12');
	});

	it('sends a distress message by clicking a button (point-and-click, no typed command)', async () => {
		const store = setup();
		render(CommunicationsStation, { store });

		await page.getByRole('button', { name: 'Send Distress Signal' }).click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('Distress message sent');
	});

	it('requests aid from a listed federation craft by clicking its button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateFederationCraft',
			name: 'USS Excelsior',
			mission: 'patrol',
			position: { x: 10, y: 0, z: 0 }
		});
		render(CommunicationsStation, { store });

		await page.getByTestId('request-aid-USS Excelsior').click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('USS Excelsior');
	});

	it('sends a peace offer to a listed enemy craft by clicking its button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 10, y: 0, z: 0 }
		});
		render(CommunicationsStation, { store });

		await page.getByTestId('send-peace-offer-Klingon Bird of Prey').click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('Klingon Bird of Prey');
	});
});
