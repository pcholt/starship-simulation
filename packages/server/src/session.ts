import { createEngine, type Engine, type EngineDeps, type ClientMessage, type ServerMessage } from '@starship/engine';

/** The minimal shape a session needs from a connected transport — satisfied by a `ws` WebSocket, or a fake in tests. */
export interface SessionSocket {
	send(data: string): void;
}

export interface Session {
	engine: Engine;
	addClient(socket: SessionSocket): void;
	removeClient(socket: SessionSocket): void;
	handleMessage(socket: SessionSocket, raw: string): void;
	tick(deltaMs: number): void;
}

/**
 * One shared game session: one `Engine` instance plus the set of connected
 * clients watching it. All connected clients see the same state — this is
 * the server-side half of the client/server split the `EngineClient`
 * interface was designed for; a networked `ws-engine-client.ts` on the web
 * side talks to this over the wire using the `ClientMessage`/`ServerMessage`
 * protocol, with no change needed to the engine itself.
 */
export function createSession(deps?: EngineDeps): Session {
	const engine = createEngine(deps);
	const clients = new Set<SessionSocket>();

	function send(socket: SessionSocket, message: ServerMessage): void {
		socket.send(JSON.stringify(message));
	}

	function broadcast(message: ServerMessage): void {
		for (const client of clients) send(client, message);
	}

	function broadcastState(): void {
		broadcast({ type: 'state', state: engine.getState() });
	}

	engine.subscribe((event) => {
		broadcast({ type: 'event', event });
	});

	return {
		engine,
		addClient(socket) {
			clients.add(socket);
			send(socket, { type: 'init', state: engine.getState() });
		},
		removeClient(socket) {
			clients.delete(socket);
		},
		handleMessage(socket, raw) {
			const message = JSON.parse(raw) as ClientMessage;
			if (message.type === 'dispatch') {
				const result = engine.dispatch(message.command);
				send(socket, { type: 'dispatchResult', requestId: message.requestId, result });
				broadcastState();
				return;
			}
			if (message.type === 'loadScenario') {
				engine.loadScenario(message.script);
				send(socket, { type: 'dispatchResult', requestId: message.requestId, result: { ok: true } });
				broadcastState();
			}
		},
		tick(deltaMs) {
			engine.tick(deltaMs);
			broadcastState();
		}
	};
}
