import { WebSocketServer } from 'ws';
import { createSession } from './session.js';

const PORT = Number(process.env.PORT ?? 8080);
const TICK_INTERVAL_MS = 200;

const session = createSession();
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
	session.addClient(socket);
	socket.on('message', (raw) => session.handleMessage(socket, raw.toString()));
	socket.on('close', () => session.removeClient(socket));
});

let last = Date.now();
setInterval(() => {
	const now = Date.now();
	session.tick(now - last);
	last = now;
}, TICK_INTERVAL_MS);

console.log(`@starship/server listening on ws://localhost:${PORT}`);
