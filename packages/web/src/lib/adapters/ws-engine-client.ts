import {
	createInitialWorldState,
	type Command,
	type CommandResult,
	type ClientMessage,
	type EngineEvent,
	type ScenarioScript,
	type ServerMessage,
	type WorldState
} from '@starship/engine';
import type { EngineClient } from './engine-client.js';

export interface WsEngineClientDeps {
	/** Injectable WebSocket constructor, so this can be unit-tested with a fake instead of a real connection. */
	WebSocketImpl?: typeof WebSocket;
}

/**
 * `EngineClient` implementation over a WebSocket, talking to `@starship/server`'s
 * session protocol. State lives on the server; this client keeps a local cache
 * (seeded with a default state until the server's "init" message arrives) and
 * synthesizes a `StateChanged` event whenever that cache is replaced, so
 * `WorldStateStore`'s existing subscribe-based refresh works unchanged for
 * both local and networked play.
 */
export function createWsEngineClient(url: string, deps: WsEngineClientDeps = {}): EngineClient {
	const WebSocketImpl = deps.WebSocketImpl ?? WebSocket;
	let state: WorldState = createInitialWorldState();
	const listeners = new Set<(event: EngineEvent) => void>();
	const pendingRequests = new Map<string, (result: CommandResult) => void>();
	let nextRequestId = 1;
	const queuedSends: string[] = [];

	const socket = new WebSocketImpl(url);

	function notify(event: EngineEvent): void {
		for (const listener of listeners) listener(event);
	}

	function adoptState(nextState: WorldState): void {
		state = nextState;
		notify({ type: 'StateChanged', paths: ['*'] });
	}

	socket.addEventListener('open', () => {
		for (const raw of queuedSends.splice(0)) socket.send(raw);
	});

	socket.addEventListener('message', (rawEvent) => {
		const message = JSON.parse((rawEvent as { data: string }).data) as ServerMessage;
		if (message.type === 'init' || message.type === 'state') {
			adoptState(message.state);
			return;
		}
		if (message.type === 'event') {
			notify(message.event);
			return;
		}
		if (message.type === 'dispatchResult') {
			const resolve = pendingRequests.get(message.requestId);
			if (resolve) {
				pendingRequests.delete(message.requestId);
				resolve(message.result);
			}
		}
	});

	function send(message: ClientMessage): void {
		const raw = JSON.stringify(message);
		if (socket.readyState === WebSocketImpl.OPEN) {
			socket.send(raw);
		} else {
			queuedSends.push(raw);
		}
	}

	function nextRequest(): string {
		return String(nextRequestId++);
	}

	return {
		dispatch(command: Command) {
			const requestId = nextRequest();
			const result = new Promise<CommandResult>((resolve) => pendingRequests.set(requestId, resolve));
			send({ type: 'dispatch', requestId, command });
			return result;
		},
		getState() {
			return state;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		loadScenario(script: ScenarioScript) {
			const requestId = nextRequest();
			const result = new Promise<void>((resolve) => pendingRequests.set(requestId, () => resolve()));
			send({ type: 'loadScenario', requestId, script });
			return result;
		},
		tick() {
			// No-op: the server owns the tick loop for networked play.
		}
	};
}
