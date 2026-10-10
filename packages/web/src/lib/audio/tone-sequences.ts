export type UiSoundName = 'button' | 'navigate' | 'slider' | 'select' | 'toggleOn' | 'toggleOff' | 'plotSelect' | 'plotDrag' | 'error' | 'overdriveWarning' | 'belowMinimumWarning';

export type Waveform = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface Tone {
	startFrequencyHz: number;
	endFrequencyHz: number;
	delayMs: number;
	durationMs: number;
	waveform: Waveform;
	peakGain: number;
}

const DEFAULT_PITCH_RATIO = 0.5;
const SLIDER_LOWEST_FREQUENCY_HZ = 330;
const SLIDER_FREQUENCY_SPAN_HZ = 990;

function tone(startFrequencyHz: number, endFrequencyHz: number, delayMs: number, durationMs: number, waveform: Waveform, peakGain: number): Tone {
	return { startFrequencyHz, endFrequencyHz, delayMs, durationMs, waveform, peakGain };
}

function frequencyForPitchRatio(pitchRatio: number): number {
	const clampedRatio = Math.min(1, Math.max(0, pitchRatio));
	return SLIDER_LOWEST_FREQUENCY_HZ + clampedRatio * SLIDER_FREQUENCY_SPAN_HZ;
}

export function toneSequenceFor(sound: UiSoundName, pitchRatio: number = DEFAULT_PITCH_RATIO): Tone[] {
	switch (sound) {
		case 'button':
			return [tone(880, 880, 0, 45, 'sine', 0.5), tone(1320, 1320, 45, 70, 'sine', 0.45)];
		case 'navigate':
			return [tone(300, 1200, 0, 170, 'sawtooth', 0.12), tone(1200, 1800, 150, 90, 'sine', 0.3)];
		case 'slider': {
			const frequencyHz = frequencyForPitchRatio(pitchRatio);
			return [tone(frequencyHz, frequencyHz, 0, 28, 'triangle', 0.35)];
		}
		case 'select':
			return [tone(740, 740, 0, 40, 'sine', 0.45), tone(988, 988, 40, 60, 'sine', 0.4)];
		case 'toggleOn':
			return [tone(660, 990, 0, 110, 'sine', 0.45)];
		case 'toggleOff':
			return [tone(990, 660, 0, 110, 'sine', 0.45)];
		case 'plotSelect':
			return [tone(1760, 1760, 0, 160, 'sine', 0.4), tone(1320, 1320, 90, 200, 'sine', 0.2)];
		case 'plotDrag':
			return [tone(1500, 1500, 0, 20, 'triangle', 0.2)];
		case 'overdriveWarning':
			return [tone(1600, 1600, 0, 70, 'square', 0.2), tone(1600, 1600, 110, 70, 'square', 0.2), tone(1900, 1900, 220, 90, 'square', 0.2)];
		case 'belowMinimumWarning':
			return [tone(520, 380, 0, 180, 'sawtooth', 0.18), tone(520, 380, 220, 180, 'sawtooth', 0.18)];
		case 'error':
			return [tone(220, 200, 0, 110, 'square', 0.18), tone(180, 160, 150, 160, 'square', 0.18)];
	}
}
