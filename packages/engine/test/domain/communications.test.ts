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
