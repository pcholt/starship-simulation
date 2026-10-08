import { describe, expect, it, vi } from 'vitest';
import { createSession } from '../src/session.js';
import type { ClientMessage, ServerMessage } from '@starship/engine';

function fakeSocket() {
	return { send: vi.fn<(data: string) => void>() };
}

function sentMessages(socket: ReturnType<typeof fakeSocket>): ServerMessage[] {
	return socket.send.mock.calls.map(([raw]) => JSON.parse(raw) as ServerMessage);
}

describe('createSession — client lifecycle', () => {
	it('sends the current state to a newly connected client', () => {
		const session = createSession();
		const socket = fakeSocket();

		session.addClient(socket);

		const messages = sentMessages(socket);
		expect(messages).toHaveLength(1);
		expect(messages[0]).toMatchObject({ type: 'init' });
	});

	it('stops sending to a client after it is removed', () => {
		const session = createSession();
		const socket = fakeSocket();
		session.addClient(socket);
		session.removeClient(socket);

		session.tick(200);

		expect(socket.send).toHaveBeenCalledTimes(1); // only the initial "init"
	});
});

describe('createSession — dispatch', () => {
	it('applies a dispatched command to the shared engine and replies with the result, correlated by requestId', () => {
		const session = createSession();
		const socket = fakeSocket();
		session.addClient(socket);

		const message: ClientMessage = {
			type: 'dispatch',
			requestId: 'abc123',
			command: { module: 'navigation', type: 'SetSpeed', warpSpeed: 5 }
		};
		session.handleMessage(socket, JSON.stringify(message));

		const messages = sentMessages(socket);
		const reply = messages.find((m) => m.type === 'dispatchResult');
		expect(reply).toEqual({ type: 'dispatchResult', requestId: 'abc123', result: { ok: true } });
		expect(session.engine.getState().enterpriseNavigation.intendedWarpSpeed).toBe(5);
	});

	it('broadcasts the updated state to every connected client after a dispatch', () => {
		const session = createSession();
		const socketA = fakeSocket();
		const socketB = fakeSocket();
		session.addClient(socketA);
		session.addClient(socketB);

		session.handleMessage(socketA, JSON.stringify({ type: 'dispatch', requestId: '1', command: { module: 'navigation', type: 'SetSpeed', warpSpeed: 7 } }));

		const messagesB = sentMessages(socketB);
		const stateMessage = messagesB.find((m) => m.type === 'state');
		expect(stateMessage).toBeDefined();
		expect((stateMessage as { state: { enterpriseNavigation: { intendedWarpSpeed: number } } }).state.enterpriseNavigation.intendedWarpSpeed).toBe(7);
	});

	it('relays engine alert events to every connected client', () => {
		const session = createSession();
		const socket = fakeSocket();
		session.addClient(socket);

		session.handleMessage(socket, JSON.stringify({ type: 'dispatch', requestId: '1', command: { module: 'communications', type: 'SendDistressMessage' } }));

		const messages = sentMessages(socket);
		expect(messages.some((m) => m.type === 'event' && m.event.type === 'AlertRaised')).toBe(true);
	});
});

describe('createSession — loadScenario', () => {
	it('loads a scenario on the shared engine and replies with ok', () => {
		const session = createSession();
		const socket = fakeSocket();
		session.addClient(socket);

		session.handleMessage(socket, JSON.stringify({ type: 'loadScenario', requestId: 'xyz', script: { steps: [] } }));

		const reply = sentMessages(socket).find((m) => m.type === 'dispatchResult');
		expect(reply).toEqual({ type: 'dispatchResult', requestId: 'xyz', result: { ok: true } });
		expect(session.engine.getState().scenario).not.toBeNull();
	});
});

describe('createSession — tick', () => {
	it('advances the shared engine clock and broadcasts the resulting state', () => {
		const session = createSession();
		const socket = fakeSocket();
		session.addClient(socket);

		session.tick(500);

		expect(session.engine.getState().simulatedTimeMs).toBe(500);
		const messages = sentMessages(socket);
		const stateMessage = messages.find((m) => m.type === 'state');
		expect((stateMessage as { state: { simulatedTimeMs: number } }).state.simulatedTimeMs).toBe(500);
	});
});
