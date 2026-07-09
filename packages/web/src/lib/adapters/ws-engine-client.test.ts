import { describe, expect, it, vi } from 'vitest';
import type { ServerMessage } from '@starship/engine';
import { createWsEngineClient } from './ws-engine-client.js';

/** A fake WebSocket the test drives manually — no real network I/O. */
class FakeWebSocket {
	static OPEN = 1;
	static instances: FakeWebSocket[] = [];
	sent: string[] = [];
	listeners: Record<string, ((event: unknown) => void)[]> = {};
	readyState = 0; // CONNECTING

	constructor(public url: string) {
		FakeWebSocket.instances.push(this);
	}

	addEventListener(type: string, listener: (event: unknown) => void) {
		(this.listeners[type] ??= []).push(listener);
	}

	send(data: string) {
		this.sent.push(data);
	}

	// Test helpers, not part of the real WebSocket API.
	simulateOpen() {
		this.readyState = 1; // OPEN
		for (const listener of this.listeners.open ?? []) listener({});
	}

	simulateMessage(message: ServerMessage) {
		for (const listener of this.listeners.message ?? []) listener({ data: JSON.stringify(message) });
	}
}

function setup() {
	FakeWebSocket.instances = [];
	const client = createWsEngineClient('ws://example.invalid', { WebSocketImpl: FakeWebSocket as unknown as typeof WebSocket });
	const socket = FakeWebSocket.instances[0]!;
	return { client, socket };
}

describe('createWsEngineClient — connection lifecycle', () => {
	it('returns a usable default state before the server sends "init"', () => {
		const { client } = setup();
		expect(client.getState().simulatedTimeMs).toBe(0);
	});

	it('adopts the server state once "init" arrives, and notifies subscribers', () => {
		const { client, socket } = setup();
		const listener = vi.fn();
		client.subscribe(listener);

		socket.simulateOpen();
		socket.simulateMessage({ type: 'init', state: { ...client.getState(), simulatedTimeMs: 999 } });

		expect(client.getState().simulatedTimeMs).toBe(999);
		expect(listener).toHaveBeenCalled();
	});

	it('adopts state from a later "state" broadcast, and notifies subscribers', () => {
		const { client, socket } = setup();
		socket.simulateOpen();
		socket.simulateMessage({ type: 'init', state: client.getState() });
		const listener = vi.fn();
		client.subscribe(listener);

		socket.simulateMessage({ type: 'state', state: { ...client.getState(), simulatedTimeMs: 42 } });

		expect(client.getState().simulatedTimeMs).toBe(42);
		expect(listener).toHaveBeenCalled();
	});

	it('forwards a relayed "event" message to subscribers unchanged', () => {
		const { client, socket } = setup();
		const listener = vi.fn();
		client.subscribe(listener);

		socket.simulateMessage({ type: 'event', event: { type: 'AlertRaised', module: 'communications', severity: 'critical', message: 'Distress' } });

		expect(listener).toHaveBeenCalledWith({ type: 'AlertRaised', module: 'communications', severity: 'critical', message: 'Distress' });
	});
});

describe('createWsEngineClient — dispatch', () => {
	it('sends a dispatch message and resolves with the matching dispatchResult', async () => {
		const { client, socket } = setup();
		socket.simulateOpen();

		const pending = client.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 5 });
		const sentMessage = JSON.parse(socket.sent[0]!);
		expect(sentMessage).toMatchObject({ type: 'dispatch', command: { module: 'navigation', type: 'SetSpeed', warpSpeed: 5 } });

		socket.simulateMessage({ type: 'dispatchResult', requestId: sentMessage.requestId, result: { ok: true } });

		expect(await pending).toEqual({ ok: true });
	});

	it('correlates concurrent dispatches by requestId, not arrival order', async () => {
		const { client, socket } = setup();
		socket.simulateOpen();

		const first = client.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 1 });
		const second = client.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 2 });
		const [firstSent, secondSent] = socket.sent.map((s) => JSON.parse(s));

		// Reply out of order.
		socket.simulateMessage({ type: 'dispatchResult', requestId: secondSent.requestId, result: { ok: true } });
		socket.simulateMessage({ type: 'dispatchResult', requestId: firstSent.requestId, result: { ok: false, reason: 'nope' } });

		expect(await first).toEqual({ ok: false, reason: 'nope' });
		expect(await second).toEqual({ ok: true });
	});

	it('queues a dispatch sent before the socket is open, and delivers it once open', async () => {
		const { client, socket } = setup();

		const pending = client.dispatch({ module: 'navigation', type: 'SetSpeed', warpSpeed: 3 });
		expect(socket.sent).toHaveLength(0);

		socket.simulateOpen();
		expect(socket.sent).toHaveLength(1);

		const sentMessage = JSON.parse(socket.sent[0]!);
		socket.simulateMessage({ type: 'dispatchResult', requestId: sentMessage.requestId, result: { ok: true } });
		expect(await pending).toEqual({ ok: true });
	});
});

describe('createWsEngineClient — loadScenario', () => {
	it('sends a loadScenario message and resolves once acknowledged', async () => {
		const { client, socket } = setup();
		socket.simulateOpen();

		const pending = client.loadScenario({ steps: [] });
		const sentMessage = JSON.parse(socket.sent[0]!);
		expect(sentMessage).toMatchObject({ type: 'loadScenario', script: { steps: [] } });

		socket.simulateMessage({ type: 'dispatchResult', requestId: sentMessage.requestId, result: { ok: true } });
		await expect(pending).resolves.toBeUndefined();
	});
});

describe('createWsEngineClient — tick', () => {
	it('is a no-op, since the server owns ticking for networked play', () => {
		const { client } = setup();
		expect(() => client.tick(200)).not.toThrow();
	});
});
