import { describe, expect, it } from 'vitest';
import { createInitialWorldState, appendBoundedEvent, MAX_TRACKED_WEAPON_EVENTS } from '../../src/domain/world-state.js';

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

describe('appendBoundedEvent', () => {
	it('assigns sequence 1 to the first event in an empty list', () => {
		const events = appendBoundedEvent<{ sequence: number; atMs: number }>([], { atMs: 100 });
		expect(events).toEqual([{ sequence: 1, atMs: 100 }]);
	});

	it('assigns each new event the next sequence number after the last one', () => {
		const first = appendBoundedEvent<{ sequence: number; atMs: number }>([], { atMs: 0 });
		const second = appendBoundedEvent(first, { atMs: 200 });
		expect(second.map((e) => e.sequence)).toEqual([1, 2]);
	});

	it('drops the oldest event once the list exceeds MAX_TRACKED_WEAPON_EVENTS', () => {
		let events: { sequence: number; atMs: number }[] = [];
		for (let i = 0; i < MAX_TRACKED_WEAPON_EVENTS + 1; i++) {
			events = appendBoundedEvent(events, { atMs: i });
		}
		expect(events).toHaveLength(MAX_TRACKED_WEAPON_EVENTS);
		expect(events[0]!.sequence).toBe(2); // the very first (sequence 1) was dropped
	});
});
