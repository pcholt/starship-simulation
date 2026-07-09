import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import EngineeringStation from './EngineeringStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('EngineeringStation', () => {
	it('lists all six shuttlecraft with no mission assigned', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		for (let id = 1; id <= 6; id++) {
			await expect.element(page.getByTestId(`shuttlecraft-${id}-mission`)).toHaveTextContent('none');
		}
	});

	it('shows a device row for phaser-fore with its starting energy allocation', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await expect.element(page.getByTestId('device-phaser-fore-energy')).toBeInTheDocument();
	});

	it('updates energy allocation after an E D command is entered', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('Command input').fill('ED phaser-fore 500');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('device-phaser-fore-energy')).toHaveTextContent('500');
	});

	it('updates a shuttlecraft mission after an S S command is entered', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('Command input').fill('SS 1 seekSensorData');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('shuttlecraft-1-mission')).toHaveTextContent('seekSensorData');
	});

	it('shows an error message for an unrecognized command', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('Command input').fill('BOGUS');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});
});
