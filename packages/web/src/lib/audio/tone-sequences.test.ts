import { describe, expect, it } from 'vitest';
import { toneSequenceFor, type UiSoundName } from './tone-sequences';

const ALL_SOUNDS: UiSoundName[] = ['button', 'navigate', 'slider', 'select', 'toggleOn', 'toggleOff', 'plotSelect', 'plotDrag', 'error', 'overdriveWarning', 'belowMinimumWarning'];

describe('toneSequenceFor', () => {
	it.each(ALL_SOUNDS)('gives %s at least one tone', (sound) => {
		expect(toneSequenceFor(sound).length).toBeGreaterThan(0);
	});

	it.each(ALL_SOUNDS)('keeps %s under half a second so interactions feel immediate', (sound) => {
		const tones = toneSequenceFor(sound);
		const endMs = Math.max(...tones.map((tone) => tone.delayMs + tone.durationMs));

		expect(endMs).toBeLessThan(500);
	});

	it.each(ALL_SOUNDS)('keeps every tone of %s quiet enough to be a UI cue', (sound) => {
		for (const tone of toneSequenceFor(sound)) expect(tone.peakGain).toBeLessThanOrEqual(0.5);
	});

	it('raises the slider pitch as the slider moves up its range', () => {
		const low = toneSequenceFor('slider', 0)[0]!.startFrequencyHz;
		const high = toneSequenceFor('slider', 1)[0]!.startFrequencyHz;

		expect(high).toBeGreaterThan(low);
	});

	it('clamps slider pitch ratios outside 0 to 1', () => {
		expect(toneSequenceFor('slider', 5)[0]!.startFrequencyHz).toBe(toneSequenceFor('slider', 1)[0]!.startFrequencyHz);
		expect(toneSequenceFor('slider', -5)[0]!.startFrequencyHz).toBe(toneSequenceFor('slider', 0)[0]!.startFrequencyHz);
	});

	it('sweeps upward for toggleOn and downward for toggleOff', () => {
		const on = toneSequenceFor('toggleOn')[0]!;
		const off = toneSequenceFor('toggleOff')[0]!;

		expect(on.endFrequencyHz).toBeGreaterThan(on.startFrequencyHz);
		expect(off.endFrequencyHz).toBeLessThan(off.startFrequencyHz);
	});

	it('uses a harsher waveform for error than for an ordinary button press', () => {
		expect(toneSequenceFor('error')[0]!.waveform).toBe('square');
		expect(toneSequenceFor('button')[0]!.waveform).toBe('sine');
	});

	it('makes the two slider warnings distinguishable by pitch', () => {
		const overdrive = toneSequenceFor('overdriveWarning')[0]!.startFrequencyHz;
		const belowMinimum = toneSequenceFor('belowMinimumWarning')[0]!.startFrequencyHz;

		expect(overdrive).toBeGreaterThan(belowMinimum * 2);
	});

	it('beeps the overdrive warning more than once so it cannot be mistaken for a tick', () => {
		expect(toneSequenceFor('overdriveWarning').length).toBeGreaterThanOrEqual(2);
	});
});
