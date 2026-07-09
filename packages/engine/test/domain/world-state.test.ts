import { describe, expect, it } from 'vitest';
import { createInitialWorldState } from '../../src/domain/world-state.js';

describe('createInitialWorldState', () => {
	it('starts the simulated clock at zero', () => {
		expect(createInitialWorldState().simulatedTimeMs).toBe(0);
	});

	it('starts every gameplay module halted', () => {
		const state = createInitialWorldState();
		expect(state.modules).toEqual({
			communications: 'halted',
			navigation: 'halted',
			sciences: 'halted',
			engineering: 'halted',
			medical: 'halted',
			helm: 'halted'
		});
	});

	it('starts with no enemy craft, federation craft, or celestial objects', () => {
		const state = createInitialWorldState();
		expect(state.enemyCraft).toEqual([]);
		expect(state.federationCraft).toEqual([]);
		expect(state.celestialObjects).toEqual([]);
	});

	it('starts with no scenario loaded', () => {
		expect(createInitialWorldState().scenario).toBeNull();
	});
});
