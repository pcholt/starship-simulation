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

	it('scans a listed object by clicking its Scan button (point-and-click, no typed command)', async () => {
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

		await page.getByTestId('scan-target-Rigel VII').click();

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('Rigel VII');
	});

	it('scans randomly via a button (point-and-click, no typed command)', async () => {
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

		await page.getByRole('button', { name: 'Scan Randomly' }).click();

		await expect.element(page.getByTestId('scan-identity')).not.toHaveTextContent('NONE');
	});

	it('shows a scan preview circle on the plot that tracks the Scan Area sliders live', async () => {
		const store = setup();
		render(SciencesStation, { store });

		const before = await page.getByTestId('scan-preview-circle').element().getAttribute('cx');

		await page.getByLabelText('Scan Area X').fill('300');

		const after = await page.getByTestId('scan-preview-circle').element().getAttribute('cx');
		expect(after).not.toBe(before);
	});

	it('scans an area via coordinate sliders and a Scan Area button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 0, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		render(SciencesStation, { store });

		await page.getByLabelText('Scan Area X').fill('0');
		await page.getByLabelText('Scan Area Y').fill('0');
		await page.getByRole('button', { name: 'Scan Area' }).click();

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('Rigel VII');
	});

	it('treats the Scan Area sliders as an offset from the ship, not absolute world coordinates', async () => {
		const store = setup();
		// Move the ship away from the world origin first.
		store.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 0, xzAngleDeg: 0 });
		store.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 10 });
		store.tick(5000);
		const shipPosition = store.state.enterpriseNavigation.position;
		expect(shipPosition.x).not.toBe(0);

		// An object sitting 50 units ahead of the ship's *current* position, not at world (50,0,0).
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Relative Object',
			position: { x: shipPosition.x + 50, y: shipPosition.y, z: shipPosition.z },
			radius: 1,
			mass: 1
		});
		render(SciencesStation, { store });

		await page.getByLabelText('Scan Area X').fill('50');
		await page.getByLabelText('Scan Area Y').fill('0');
		await page.getByRole('button', { name: 'Scan Area' }).click();

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('Relative Object');
	});
});
