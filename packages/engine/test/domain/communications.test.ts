import { communicationsRange } from '../../src/domain/communications.js';
import { createDeviceStatus } from '../../src/domain/device.js';
import { describe, expect, it } from 'vitest';
import { createCommunicationsState, enqueueMessage, displayNextMessage } from '../../src/domain/communications.js';

describe('createCommunicationsState', () => {
	it('starts with an empty message queue and no last-displayed message', () => {
		const state = createCommunicationsState();
		expect(state.messageQueue).toEqual([]);
		expect(state.lastDisplayedMessage).toBeNull();
	});
});

describe('enqueueMessage', () => {
	it('appends a message to the back of the queue', () => {
		const state = enqueueMessage(createCommunicationsState(), 'Starbase 12', 'Report your status');
		expect(state.messageQueue).toHaveLength(1);
		expect(state.messageQueue[0]).toMatchObject({ from: 'Starbase 12', text: 'Report your status' });
	});
});

describe('displayNextMessage', () => {
	it('dequeues the oldest message first (FIFO)', () => {
		let state = createCommunicationsState();
		state = enqueueMessage(state, 'A', 'first');
		state = enqueueMessage(state, 'B', 'second');
		const { state: next, message } = displayNextMessage(state);
		expect(message).toMatchObject({ from: 'A', text: 'first' });
		expect(next.messageQueue).toHaveLength(1);
		expect(next.messageQueue[0]).toMatchObject({ from: 'B', text: 'second' });
	});

	it('sets lastDisplayedMessage to the dequeued message', () => {
		const state = enqueueMessage(createCommunicationsState(), 'A', 'hello');
		const { state: next } = displayNextMessage(state);
		expect(next.lastDisplayedMessage).toMatchObject({ from: 'A', text: 'hello' });
	});

	it('returns a null message and unchanged state when the queue is empty', () => {
		const state = createCommunicationsState();
		const { state: next, message } = displayNextMessage(state);
		expect(message).toBeNull();
		expect(next).toBe(state);
	});
});

describe('communicationsRange', () => {
	const computer = (overrides: Parameters<typeof createDeviceStatus>[0]) => ({ commsComputer: createDeviceStatus(overrides) });

	it('is a full 1000 units with an undamaged, fully powered computer', () => {
		expect(communicationsRange(computer({ energyAssigned: 200 }))).toBe(1000);
	});

	it('does not grow when the computer is overdriven', () => {
		expect(communicationsRange(computer({ energyAssigned: 220 }))).toBe(1000);
	});

	it('shrinks in proportion to missing power', () => {
		expect(communicationsRange(computer({ energyAssigned: 100 }))).toBe(500);
	});

	it('shrinks in proportion to damage', () => {
		expect(communicationsRange(computer({ energyAssigned: 200, functionalStatus: 40 }))).toBe(400);
	});

	it('combines damage and missing power', () => {
		expect(communicationsRange(computer({ energyAssigned: 100, functionalStatus: 50 }))).toBe(250);
	});

	it('is zero with no power', () => {
		expect(communicationsRange(computer({ energyAssigned: 0 }))).toBe(0);
	});

	it('is zero for a destroyed computer', () => {
		expect(communicationsRange(computer({ energyAssigned: 200, functionalStatus: 0 }))).toBe(0);
	});
});
