import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import SciencesStation from './SciencesStation.svelte';

async function clickPlotAt(fractionX: number, fractionY: number) {
	const bounds = page.getByTestId('astrogator-svg').element().getBoundingClientRect();
	await page.getByTestId('astrogator-svg').click({ position: { x: bounds.width * fractionX, y: bounds.height * fractionY } });
}

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

	it('moves the scan preview circle on the plot when the plot is clicked', async () => {
		const store = setup();
		render(SciencesStation, { store });
		const before = await page.getByTestId('scan-preview-circle').element().getAttribute('cx');

		await clickPlotAt(0.8, 0.5);

		const after = await page.getByTestId('scan-preview-circle').element().getAttribute('cx');
		expect(after).not.toBe(before);
	});

	it('shows the selected scan center, relative to the ship, after the plot is clicked', async () => {
		const store = setup();
		render(SciencesStation, { store });

		await clickPlotAt(0.8, 0.5);

		await expect.element(page.getByTestId('scan-area-center')).not.toHaveTextContent('0, 0');
	});

	it('keeps moving the scan preview while the pointer is dragged across the plot', async () => {
		const store = setup();
		render(SciencesStation, { store });
		const svg = page.getByTestId('astrogator-svg').element();
		const bounds = svg.getBoundingClientRect();
		const pointerAt = (type: string, fractionX: number) =>
			svg.dispatchEvent(
				new PointerEvent(type, {
					bubbles: true,
					pointerId: 1,
					clientX: bounds.left + bounds.width * fractionX,
					clientY: bounds.top + bounds.height * 0.5
				})
			);

		const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
		const previewCx = () => page.getByTestId('scan-preview-circle').element().getAttribute('cx');

		pointerAt('pointerdown', 0.6);
		await settle();
		const firstCx = previewCx();
		pointerAt('pointermove', 0.8);
		await settle();
		const movedCx = previewCx();
		pointerAt('pointerup', 0.8);
		pointerAt('pointermove', 0.3);
		await settle();
		const cxAfterRelease = previewCx();

		expect(movedCx).not.toBe(firstCx);
		expect(cxAfterRelease).toBe(movedCx);
	});

	it('has no Scan Area X or Y sliders any more', async () => {
		const store = setup();
		render(SciencesStation, { store });

		await expect.element(page.getByLabelText('Scan Area X')).not.toBeInTheDocument();
		await expect.element(page.getByLabelText('Scan Area Y')).not.toBeInTheDocument();
	});

	it('scans an area chosen on the plot with the Scan Area button (point-and-click, no typed command)', async () => {
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

		await clickPlotAt(0.5, 0.5);
		await page.getByRole('button', { name: 'Scan Area' }).click();

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('Rigel VII');
	});

	it('treats the chosen scan center as an offset from the ship, not absolute world coordinates', async () => {
		const store = setup();
		store.dispatch({ module: 'navigation', type: 'SetDirection', xyAngleDeg: 0, xzAngleDeg: 0 });
		store.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 10 });
		store.tick(60_000);
		const shipPosition = store.state.enterpriseNavigation.position;
		expect(shipPosition.x).toBeGreaterThan(500);

		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Relative Object',
			position: { x: shipPosition.x + 10, y: shipPosition.y, z: shipPosition.z },
			radius: 1,
			mass: 1
		});
		render(SciencesStation, { store });

		await clickPlotAt(0.5, 0.5);
		await page.getByRole('button', { name: 'Scan Area' }).click();

		await expect.element(page.getByTestId('scan-identity')).toHaveTextContent('Relative Object');
	});
});
