export interface Message {
	id: number;
	from: string;
	text: string;
}

export interface CommunicationsState {
	messageQueue: Message[];
	lastDisplayedMessage: Message | null;
	log: string[];
	nextMessageId: number;
}

export function createCommunicationsState(): CommunicationsState {
	return { messageQueue: [], lastDisplayedMessage: null, log: [], nextMessageId: 1 };
}

/** Incoming messages are a FIFO queue, per the book — displaying one removes it and makes room for another. */
export function enqueueMessage(state: CommunicationsState, from: string, text: string): CommunicationsState {
	const message: Message = { id: state.nextMessageId, from, text };
	return { ...state, messageQueue: [...state.messageQueue, message], nextMessageId: state.nextMessageId + 1 };
}

export function displayNextMessage(state: CommunicationsState): { state: CommunicationsState; message: Message | null } {
	if (state.messageQueue.length === 0) return { state, message: null };
	const [message, ...rest] = state.messageQueue;
	return { state: { ...state, messageQueue: rest, lastDisplayedMessage: message! }, message: message! };
}

export function appendLog(state: CommunicationsState, entry: string): CommunicationsState {
	return { ...state, log: [...state.log, entry] };
}
