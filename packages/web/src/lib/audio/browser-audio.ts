import { WebAudioTonePlayer, type AudioContextLike } from './tone-player.js';
import { ToneSequenceSoundPlayer, type UiSoundPlayer } from './ui-sound-player.js';
import type { SettingsStorage } from './sound-settings.svelte.js';

const MASTER_GAIN = 0.2;

function createInMemoryStorage(): SettingsStorage {
	const values = new Map<string, string>();
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => void values.set(key, value)
	};
}

export function browserSettingsStorage(): SettingsStorage {
	try {
		return window.localStorage;
	} catch {
		return createInMemoryStorage();
	}
}

export function createBrowserSoundPlayer(): UiSoundPlayer {
	const tonePlayer = new WebAudioTonePlayer(() => new AudioContext() as unknown as AudioContextLike, MASTER_GAIN);
	return new ToneSequenceSoundPlayer(tonePlayer);
}
