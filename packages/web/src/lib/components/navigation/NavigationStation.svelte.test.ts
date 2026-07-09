import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import NavigationStation from './NavigationStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('NavigationStation', () => {
	it('displays the Enterprise starting position and velocity', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await expect.element(page.getByText('X-COORDINATE')).toBeInTheDocument();
		await expect.element(page.getByTestId('nav-position-x')).toHaveTextContent('0');
		await expect.element(page.getByTestId('nav-speed')).toHaveTextContent('0');
	});

	it('updates the displayed speed after a Set Velocity command is entered', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SV 7');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-speed')).toHaveTextContent('7');
	});

	it('updates the displayed heading after a Set Direction command is entered', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SD 45 10');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-xy-angle')).toHaveTextContent('45');
		await expect.element(page.getByTestId('nav-xz-angle')).toHaveTextContent('10');
	});

	it('displays the destination after a Set Course to Coordinates command is entered', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 4 5 6');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-destination')).toHaveTextContent('4, 5, 6');
	});

	it('shows an error message for an unrecognized command without dispatching anything', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('BOGUS');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});

	it('shows the simulated-time chronometer', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('nav-chronometer')).toHaveTextContent('0');
	});

	it('computes an ETA once a course and speed toward coordinates are both set', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 100 0 0');
		await page.getByRole('button', { name: 'Enter' }).click();
		await page.getByLabelText('Command input').fill('SV 10');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-eta')).toHaveTextContent('10');
	});

	it('shows ETA as N/A when speed is zero', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 100 0 0');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-eta')).toHaveTextContent('N/A');
	});

	it('lists nearby celestial objects and craft (text substitute for the Astrogator plot)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 10, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('nearby-objects')).toHaveTextContent('Rigel VII');
	});
});
