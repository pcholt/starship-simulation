import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AstrogatorPlot from './AstrogatorPlot.svelte';

describe('AstrogatorPlot', () => {
	it('always plots the Enterprise at the center', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByTestId('plot-mark-enterprise')).toBeInTheDocument();
	});

	it('plots a celestial object within range', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [{ name: 'Rigel VII', kind: 'celestialObject', position: { x: 100, y: 0, z: 0 } }],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-celestialObject-Rigel VII')).toBeInTheDocument();
	});

	it('plots an enemy craft and a federation craft with distinct marks', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [
				{ name: 'Klingon Bird of Prey', kind: 'enemyCraft', position: { x: 50, y: 50, z: 0 } },
				{ name: 'USS Excelsior', kind: 'federationCraft', position: { x: -50, y: -50, z: 0 } }
			],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-enemyCraft-Klingon Bird of Prey')).toBeInTheDocument();
		await expect.element(page.getByTestId('plot-mark-federationCraft-USS Excelsior')).toBeInTheDocument();
	});

	it('excludes entities beyond the plot range', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [{ name: 'Far Away', kind: 'celestialObject', position: { x: 100000, y: 0, z: 0 } }],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-celestialObject-Far Away')).not.toBeInTheDocument();
	});

	it('renders a symbol key for the entity kinds the engine actually models', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByTestId('symbol-key')).toHaveTextContent('ENTERPRISE');
		await expect.element(page.getByTestId('symbol-key')).toHaveTextContent('ENEMY CRAFT');
		await expect.element(page.getByTestId('symbol-key')).toHaveTextContent('FEDERATION CRAFT');
		await expect.element(page.getByTestId('symbol-key')).toHaveTextContent('CELESTIAL OBJECT');
	});

	it('shows a zoom slider initialized to display the given range', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByLabelText('Zoom (plot range)')).toBeInTheDocument();
		await expect.element(page.getByTestId('zoom-range-display')).toHaveTextContent('1000 units');
	});

	it('zooming all the way out (max slider position) reveals an entity beyond the initial range', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [{ name: 'Far Object', kind: 'celestialObject', position: { x: 3000, y: 0, z: 0 } }],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-celestialObject-Far Object')).not.toBeInTheDocument();

		const slider = page.getByLabelText('Zoom (plot range)');
		const max = await slider.element().getAttribute('max');
		await slider.fill(max!);

		await expect.element(page.getByTestId('plot-mark-celestialObject-Far Object')).toBeInTheDocument();
	});

	it('zooming all the way in (min slider position) hides an entity within the initial range', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [{ name: 'Nearby Object', kind: 'celestialObject', position: { x: 800, y: 0, z: 0 } }],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-celestialObject-Nearby Object')).toBeInTheDocument();

		await page.getByLabelText('Zoom (plot range)').fill('0');

		await expect.element(page.getByTestId('plot-mark-celestialObject-Nearby Object')).not.toBeInTheDocument();
	});

	it('labels coordinate grid lines with world-distance values', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByTestId('astrogator-grid')).toHaveTextContent('200');
		await expect.element(page.getByTestId('astrogator-grid')).toHaveTextContent('1000');
	});

	it('draws a labeled range circle for each entry in rangeCircles', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			rangeCircles: [
				{ label: 'Sensors', radius: 1000 },
				{ label: 'Phasers', radius: 300 }
			]
		});

		await expect.element(page.getByTestId('range-circle-Sensors')).toBeInTheDocument();
		await expect.element(page.getByTestId('range-circle-Phasers')).toBeInTheDocument();
		await expect.element(page.getByTestId('symbol-key')).toHaveTextContent('SENSORS');
		await expect.element(page.getByTestId('symbol-key')).toHaveTextContent('PHASERS');
	});

	it('omits range circles outside the current zoom level', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 100,
			rangeCircles: [{ label: 'Sensors', radius: 1000 }]
		});

		await expect.element(page.getByTestId('range-circle-Sensors')).not.toBeInTheDocument();
	});

	it('calls onSelectPoint with a world-space position when the plot is clicked', async () => {
		const onSelectPoint = vi.fn();
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000, onSelectPoint });

		await page.getByTestId('astrogator-svg').click();

		expect(onSelectPoint).toHaveBeenCalledTimes(1);
		const [position] = onSelectPoint.mock.calls[0]!;
		expect(position).toHaveProperty('x');
		expect(position).toHaveProperty('y');
		expect(position).toHaveProperty('z');
	});
});
