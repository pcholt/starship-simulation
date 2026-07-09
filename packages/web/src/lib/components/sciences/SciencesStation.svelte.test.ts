import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import SciencesStation from './SciencesStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('SciencesStation', () => {
	it('displays full life support levels by default', async () => {
		const store = setup();
		render(SciencesStation, { store });

		await expect.element(page.getByTestId('life-support-air')).toHaveTextContent('100');
		await expect.element(page.getByTestId('life-support-water')).toHaveTextContent('100');
		await expect.element(page.getByTestId('life-support-food')).toHaveTextContent('100');
	});

	it('shows no scan data before any scan has been made', async () => {
		const store = setup();
		render(SciencesStation, { store });

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('NONE');
	});

	it('shows the Sciences Computer functional and operational status (Figure 3.12)', async () => {
		const store = setup();
		render(SciencesStation, { store });

		await expect.element(page.getByTestId('sciences-computer-funcstat')).toHaveTextContent('100');
		await expect.element(page.getByTestId('sciences-computer-opstat')).toHaveTextContent('100');
	});

	it('displays scan results after scanning a named object', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 10, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		render(SciencesStation, { store });

		await page.getByLabelText('Command input').fill('SSO Rigel VII');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('Rigel VII');
		await expect.element(page.getByTestId('scan-quality')).toHaveTextContent('full');
	});

	it('shows an error message when scanning an object that does not exist', async () => {
		const store = setup();
		render(SciencesStation, { store });

		await page.getByLabelText('Command input').fill('SSO Nonexistent');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});
});
