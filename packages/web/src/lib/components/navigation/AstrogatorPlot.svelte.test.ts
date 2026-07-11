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
			entities: [{ id: 1, name: 'Rigel VII', kind: 'celestialObject', position: { x: 100, y: 0, z: 0 } }],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-celestialObject-Rigel VII')).toBeInTheDocument();
	});

	it('plots an enemy craft and a federation craft with distinct marks', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [
				{ id: 1, name: 'Klingon Bird of Prey', kind: 'enemyCraft', position: { x: 50, y: 50, z: 0 } },
				{ id: 2, name: 'USS Excelsior', kind: 'federationCraft', position: { x: -50, y: -50, z: 0 } }
			],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-enemyCraft-Klingon Bird of Prey')).toBeInTheDocument();
		await expect.element(page.getByTestId('plot-mark-federationCraft-USS Excelsior')).toBeInTheDocument();
	});

	it('excludes entities beyond the plot range', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [{ id: 1, name: 'Far Away', kind: 'celestialObject', position: { x: 100000, y: 0, z: 0 } }],
			range: 1000
		});

		await expect.element(page.getByTestId('plot-mark-celestialObject-Far Away')).not.toBeInTheDocument();
	});

	it('renders two entities that share a name without crashing (e.g. a scenario preset loaded twice)', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [
				{ id: 5, name: 'Klingon Bird of Prey', kind: 'enemyCraft', position: { x: 10, y: 0, z: 0 } },
				{ id: 9, name: 'Klingon Bird of Prey', kind: 'enemyCraft', position: { x: -10, y: 0, z: 0 } }
			],
			range: 1000
		});

		const marks = await page.getByTestId('plot-mark-enemyCraft-Klingon Bird of Prey').all();
		expect(marks).toHaveLength(2);
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
			entities: [{ id: 1, name: 'Far Object', kind: 'celestialObject', position: { x: 3000, y: 0, z: 0 } }],
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
			entities: [{ id: 1, name: 'Nearby Object', kind: 'celestialObject', position: { x: 800, y: 0, z: 0 } }],
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

	it('labels universe grid lines with absolute world coordinates, distinct from the ship-relative grid', async () => {
		render(AstrogatorPlot, { center: { x: 500, y: 0, z: 0 }, entities: [], range: 1000 });

		// Step is 200; the ship sits at x=500 (not a multiple of 200), so the universe grid's
		// absolute lines (e.g. 600) differ from where a ship-relative grid would put them.
		await expect.element(page.getByTestId('astrogator-universe-grid')).toHaveTextContent('600');
	});

	it('keeps the universe grid anchored to the origin when the ship is at the origin', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByTestId('astrogator-universe-grid')).toHaveTextContent('1000');
	});

	it('draws a preview circle at an arbitrary world point, not centered on the Enterprise', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			previewCircle: { center: { x: 400, y: 0, z: 0 }, radius: 100 }
		});

		await expect.element(page.getByTestId('scan-preview-circle')).toBeInTheDocument();
	});

	it('tracks a live-updated preview circle position as its center prop changes', async () => {
		const { rerender } = render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			previewCircle: { center: { x: 0, y: 0, z: 0 }, radius: 100 }
		});

		const circleAtOrigin = page.getByTestId('scan-preview-circle');
		const cxAtOrigin = await circleAtOrigin.element().getAttribute('cx');

		await rerender({
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			previewCircle: { center: { x: 500, y: 0, z: 0 }, radius: 100 }
		});

		const cxMoved = await page.getByTestId('scan-preview-circle').element().getAttribute('cx');
		expect(cxMoved).not.toBe(cxAtOrigin);
	});

	it('draws a shield sector per bank, faded by shield level, superimposed on the Enterprise', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			shieldOverlay: {
				headingDeg: 0,
				levels: [
					{ location: 'fore', level: 100 },
					{ location: 'aft', level: 0 },
					{ location: 'port', level: 50 },
					{ location: 'starboard', level: 25 }
				]
			}
		});

		await expect.element(page.getByTestId('shield-sector-fore')).toBeInTheDocument();
		const foreOpacity = await page.getByTestId('shield-sector-fore').element().getAttribute('opacity');
		const aftOpacity = await page.getByTestId('shield-sector-aft').element().getAttribute('opacity');
		expect(Number(foreOpacity)).toBeCloseTo(0.5);
		expect(Number(aftOpacity)).toBeCloseTo(0);
	});

	it('rotates the shield sectors as heading changes', async () => {
		const { rerender } = render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			shieldOverlay: { headingDeg: 0, levels: [{ location: 'fore', level: 100 }] }
		});

		const pointsAtZero = await page.getByTestId('shield-sector-fore').element().getAttribute('points');

		await rerender({
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			shieldOverlay: { headingDeg: 90, levels: [{ location: 'fore', level: 100 }] }
		});

		const pointsAtNinety = await page.getByTestId('shield-sector-fore').element().getAttribute('points');
		expect(pointsAtNinety).not.toBe(pointsAtZero);
	});

	it('shows a fading scan-flash circle at the given world point when scanFlash is set', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			scanFlash: { center: { x: 300, y: 0, z: 0 }, radius: 100, key: 1 }
		});

		await expect.element(page.getByTestId('scan-flash-circle')).toBeInTheDocument();
	});

	it('restarts the scan-flash animation when a new key arrives, even at the same position', async () => {
		const { rerender } = render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			scanFlash: { center: { x: 300, y: 0, z: 0 }, radius: 100, key: 1 }
		});

		const firstEl = page.getByTestId('scan-flash-circle').element();

		await rerender({
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			scanFlash: { center: { x: 300, y: 0, z: 0 }, radius: 100, key: 2 }
		});

		const secondEl = page.getByTestId('scan-flash-circle').element();
		expect(secondEl).not.toBe(firstEl);
	});

	it('lets a caller shorten the fade for an already-partly-elapsed scan flash, so a late-mounting view does not restart it from full brightness', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			scanFlash: { center: { x: 300, y: 0, z: 0 }, radius: 100, key: 1, initialOpacity: 0.2, durationMs: 500 }
		});

		const el = page.getByTestId('scan-flash-circle').element();
		expect(el.style.getPropertyValue('--flash-start')).toBe('0.2');
		expect(el.style.getPropertyValue('--flash-duration')).toBe('500ms');
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

	it('rotates the ship icon to face the given heading', async () => {
		const { rerender } = render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			shipHeadingDeg: 0
		});

		const pointsAtZero = await page.getByTestId('plot-mark-enterprise').element().getAttribute('points');

		await rerender({ center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000, shipHeadingDeg: 90 });

		const pointsAtNinety = await page.getByTestId('plot-mark-enterprise').element().getAttribute('points');
		expect(pointsAtNinety).not.toBe(pointsAtZero);
	});

	it('falls back to a plain mark for the Enterprise when no heading is given', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByTestId('plot-mark-enterprise')).toBeInTheDocument();
	});

	it('draws the projected future path as a line when given one', async () => {
		render(AstrogatorPlot, {
			center: { x: 0, y: 0, z: 0 },
			entities: [],
			range: 1000,
			projectedPath: [
				{ x: 0, y: 0, z: 0 },
				{ x: 100, y: 0, z: 0 },
				{ x: 200, y: 50, z: 0 }
			]
		});

		await expect.element(page.getByTestId('projected-path')).toBeInTheDocument();
	});

	it('omits the projected path line when none is given', async () => {
		render(AstrogatorPlot, { center: { x: 0, y: 0, z: 0 }, entities: [], range: 1000 });

		await expect.element(page.getByTestId('projected-path')).not.toBeInTheDocument();
	});
});
