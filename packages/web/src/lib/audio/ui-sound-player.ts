import type { TonePlayer } from './tone-player.js';
import { toneSequenceFor, type UiSoundName } from './tone-sequences.js';

export interface UiSoundPlayer {
	/** `pitchRatio` (0 to 1) shifts the pitch of sounds that carry a value, such as a slider moving through its range. */
	play(sound: UiSoundName, pitchRatio?: number): void;
}

export class ToneSequenceSoundPlayer implements UiSoundPlayer {
	#tonePlayer: TonePlayer;

	constructor(tonePlayer: TonePlayer) {
		this.#tonePlayer = tonePlayer;
	}

	play(sound: UiSoundName, pitchRatio?: number): void {
		this.#tonePlayer.play(toneSequenceFor(sound, pitchRatio));
	}
}
