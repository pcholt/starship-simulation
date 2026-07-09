import { describe, expect, it } from 'vitest';
import { createInitialWorldState } from '../../src/domain/world-state.js';

describe('createInitialWorldState', () => {
	it('starts the simulated clock at zero', () => {
		expect(createInitialWorldState().simulatedTimeMs).toBe(0);
	});

	it('starts every gameplay module running, as on an active bridge — Halt is for the Controller to take a station offline (damage, GM narrative), not a startup gate', () => {
		const state = createInitialWorldState();
		expect(state.modules).toEqual({
			communications: 'running',
			navigation: 'running',
			sciences: 'running',
			engineering: 'running',
			medical: 'running',
			helm: 'running'
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
