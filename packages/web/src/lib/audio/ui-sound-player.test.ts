import { describe, expect, it } from 'vitest';
import type { TonePlayer } from './tone-player';
import type { Tone } from './tone-sequences';
import { ToneSequenceSoundPlayer } from './ui-sound-player';

class RecordingTonePlayer implements TonePlayer {
	played: Tone[][] = [];
	play(tones: Tone[]) {
		this.played.push(tones);
	}
}

describe('ToneSequenceSoundPlayer', () => {
	it('plays the tones that belong to the named sound', () => {
		const tonePlayer = new RecordingTonePlayer();

		new ToneSequenceSoundPlayer(tonePlayer).play('toggleOn');

		expect(tonePlayer.played).toHaveLength(1);
		expect(tonePlayer.played[0]![0]!.endFrequencyHz).toBeGreaterThan(tonePlayer.played[0]![0]!.startFrequencyHz);
	});

	it('passes the pitch ratio through to the sound', () => {
		const lowPlayer = new RecordingTonePlayer();
		const highPlayer = new RecordingTonePlayer();

		new ToneSequenceSoundPlayer(lowPlayer).play('slider', 0);
		new ToneSequenceSoundPlayer(highPlayer).play('slider', 1);

		expect(highPlayer.played[0]![0]!.startFrequencyHz).toBeGreaterThan(lowPlayer.played[0]![0]!.startFrequencyHz);
	});
});
