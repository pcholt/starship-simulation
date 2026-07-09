import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
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
});
