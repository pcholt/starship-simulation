import { describe, expect, it } from 'vitest';
import { WebAudioTonePlayer, type AudioContextLike, type AudioParamLike, type GainLike, type OscillatorLike } from './tone-player';
import type { Tone } from './tone-sequences';

class FakeParam implements AudioParamLike {
	setValues: Array<[number, number]> = [];
	linearRamps: Array<[number, number]> = [];
	exponentialRamps: Array<[number, number]> = [];
	setValueAtTime(value: number, time: number) {
		this.setValues.push([value, time]);
	}
	linearRampToValueAtTime(value: number, time: number) {
		this.linearRamps.push([value, time]);
	}
	exponentialRampToValueAtTime(value: number, time: number) {
		this.exponentialRamps.push([value, time]);
	}
}

class FakeNode {
	connections: unknown[] = [];
	connect(destination: unknown) {
		this.connections.push(destination);
	}
}

class FakeOscillator extends FakeNode implements OscillatorLike {
	type = '';
	frequency = new FakeParam();
	startedAt: number | null = null;
	stoppedAt: number | null = null;
	start(time: number) {
		this.startedAt = time;
	}
	stop(time: number) {
		this.stoppedAt = time;
	}
}

class FakeGain extends FakeNode implements GainLike {
	gain = new FakeParam();
}

class FakeAudioContext implements AudioContextLike {
	currentTime = 10;
	destination = new FakeNode();
	state = 'running';
	resumeCalls = 0;
	oscillators: FakeOscillator[] = [];
	gains: FakeGain[] = [];
	async resume() {
		this.resumeCalls += 1;
	}
	createOscillator() {
		const oscillator = new FakeOscillator();
		this.oscillators.push(oscillator);
		return oscillator;
	}
	createGain() {
		const gain = new FakeGain();
		this.gains.push(gain);
		return gain;
	}
}

const sineTone: Tone = { startFrequencyHz: 440, endFrequencyHz: 880, delayMs: 100, durationMs: 200, waveform: 'sine', peakGain: 0.5 };

function playerWith(audioContext: FakeAudioContext, masterGain = 0.2) {
	let created = 0;
	const player = new WebAudioTonePlayer(() => {
		created += 1;
		return audioContext;
	}, masterGain);
	return { player, contextsCreated: () => created };
}

describe('WebAudioTonePlayer', () => {
	it('does not create an audio context until something is played', () => {
		const { contextsCreated } = playerWith(new FakeAudioContext());

		expect(contextsCreated()).toBe(0);
	});

	it('creates the audio context once and reuses it', () => {
		const { player, contextsCreated } = playerWith(new FakeAudioContext());

		player.play([sineTone]);
		player.play([sineTone]);

		expect(contextsCreated()).toBe(1);
	});

	it('plays each tone on its own oscillator', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([sineTone, sineTone]);

		expect(audioContext.oscillators).toHaveLength(2);
	});

	it('sets the oscillator waveform from the tone', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([{ ...sineTone, waveform: 'square' }]);

		expect(audioContext.oscillators[0]!.type).toBe('square');
	});

	it('starts the tone after its delay and ends it after its duration', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([sineTone]);

		expect(audioContext.oscillators[0]!.startedAt).toBeCloseTo(10.1);
		expect(audioContext.oscillators[0]!.stoppedAt).toBeGreaterThanOrEqual(10.3);
	});

	it('sweeps the frequency from the start to the end frequency', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([sineTone]);

		const frequency = audioContext.oscillators[0]!.frequency;
		expect(frequency.setValues[0]![0]).toBe(440);
		expect(frequency.linearRamps[0]![0]).toBe(880);
	});

	it('scales the tone peak gain by the master gain', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext, 0.2);

		player.play([sineTone]);

		const peak = audioContext.gains[0]!.gain.linearRamps[0]![0];
		expect(peak).toBeCloseTo(0.1);
	});

	it('fades each tone out to silence rather than cutting it off', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([sineTone]);

		expect(audioContext.gains[0]!.gain.exponentialRamps[0]![0]).toBeLessThan(0.001);
	});

	it('routes the oscillator through its gain into the audio output', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([sineTone]);

		expect(audioContext.oscillators[0]!.connections).toEqual([audioContext.gains[0]]);
		expect(audioContext.gains[0]!.connections).toEqual([audioContext.destination]);
	});

	it('resumes an audio context the browser left suspended', () => {
		const audioContext = new FakeAudioContext();
		audioContext.state = 'suspended';
		const { player } = playerWith(audioContext);

		player.play([sineTone]);

		expect(audioContext.resumeCalls).toBe(1);
	});

	it('does not resume an audio context that is already running', () => {
		const audioContext = new FakeAudioContext();
		const { player } = playerWith(audioContext);

		player.play([sineTone]);

		expect(audioContext.resumeCalls).toBe(0);
	});
});
