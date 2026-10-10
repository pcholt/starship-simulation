import type { Tone } from './tone-sequences.js';

export interface TonePlayer {
	play(tones: Tone[]): void;
}

export interface AudioParamLike {
	setValueAtTime(value: number, startTimeSeconds: number): void;
	linearRampToValueAtTime(value: number, endTimeSeconds: number): void;
	exponentialRampToValueAtTime(value: number, endTimeSeconds: number): void;
}

export interface AudioNodeLike {
	connect(destination: AudioNodeLike): void;
}

export interface OscillatorLike extends AudioNodeLike {
	type: string;
	frequency: AudioParamLike;
	start(startTimeSeconds: number): void;
	stop(stopTimeSeconds: number): void;
}

export interface GainLike extends AudioNodeLike {
	gain: AudioParamLike;
}

export interface AudioContextLike {
	readonly currentTime: number;
	readonly destination: AudioNodeLike;
	readonly state: string;
	resume(): Promise<void>;
	createOscillator(): OscillatorLike;
	createGain(): GainLike;
}

const ATTACK_SECONDS = 0.005;
const SILENT_GAIN = 0.0001;

export class WebAudioTonePlayer implements TonePlayer {
	#createAudioContext: () => AudioContextLike;
	#masterGain: number;
	#audioContext: AudioContextLike | null = null;

	constructor(createAudioContext: () => AudioContextLike, masterGain: number) {
		this.#createAudioContext = createAudioContext;
		this.#masterGain = masterGain;
	}

	play(tones: Tone[]): void {
		const audioContext = this.#audioContextReadyToPlay();
		for (const tone of tones) this.#schedule(audioContext, tone);
	}

	#audioContextReadyToPlay(): AudioContextLike {
		this.#audioContext ??= this.#createAudioContext();
		if (this.#audioContext.state === 'suspended') void this.#audioContext.resume();
		return this.#audioContext;
	}

	#schedule(audioContext: AudioContextLike, tone: Tone): void {
		const startSeconds = audioContext.currentTime + tone.delayMs / 1000;
		const endSeconds = startSeconds + tone.durationMs / 1000;
		const peakGain = tone.peakGain * this.#masterGain;

		const oscillator = audioContext.createOscillator();
		oscillator.type = tone.waveform;
		oscillator.frequency.setValueAtTime(tone.startFrequencyHz, startSeconds);
		oscillator.frequency.linearRampToValueAtTime(tone.endFrequencyHz, endSeconds);

		const envelope = audioContext.createGain();
		envelope.gain.setValueAtTime(SILENT_GAIN, startSeconds);
		envelope.gain.linearRampToValueAtTime(peakGain, startSeconds + ATTACK_SECONDS);
		envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, endSeconds);

		oscillator.connect(envelope);
		envelope.connect(audioContext.destination);
		oscillator.start(startSeconds);
		oscillator.stop(endSeconds + ATTACK_SECONDS);
	}
}
