import { describe, expect, it } from 'vitest';
import { findFitScale } from './fit-scale';

const bounds = { minimumScale: 0.4, maximumScale: 1.5 };

describe('findFitScale', () => {
	it('returns the maximum scale when the content is tiny', () => {
		const scale = findFitScale({
			availableWidth: 1000,
			availableHeight: 800,
			measureContentHeightAtWidth: () => 100,
			...bounds
		});

		expect(scale).toBe(1.5);
	});

	it('returns a scale at which the scaled content height fits the available height', () => {
		const scale = findFitScale({
			availableWidth: 1000,
			availableHeight: 800,
			measureContentHeightAtWidth: () => 1600,
			...bounds
		});

		expect(scale * 1600).toBeLessThanOrEqual(800);
		expect(scale * 1600).toBeGreaterThan(790);
	});

	it('returns the minimum scale when even that cannot fit the content', () => {
		const scale = findFitScale({
			availableWidth: 1000,
			availableHeight: 100,
			measureContentHeightAtWidth: () => 5000,
			...bounds
		});

		expect(scale).toBe(0.4);
	});

	it('widens the layout width as the scale shrinks, so wrapped content gets shorter', () => {
		const heightShrinksAsWidthGrows = (width: number) => 1_200_000 / width;

		const scale = findFitScale({
			availableWidth: 1000,
			availableHeight: 600,
			measureContentHeightAtWidth: heightShrinksAsWidthGrows,
			...bounds
		});

		const layoutWidth = 1000 / scale;
		expect(scale * heightShrinksAsWidthGrows(layoutWidth)).toBeLessThanOrEqual(600);
		expect(scale).toBeGreaterThan(0.7);
	});
});
