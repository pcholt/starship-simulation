import { describe, expect, it } from 'vitest';
import { formatChronometer, formatCoordinate } from './format.js';

describe('formatChronometer', () => {
	it('formats zero as 00:00:00.0', () => {
		expect(formatChronometer(0)).toBe('00:00:00.0');
	});

	it('formats sub-second values as tenths', () => {
		expect(formatChronometer(500)).toBe('00:00:00.5');
	});

	it('formats whole seconds', () => {
		expect(formatChronometer(5000)).toBe('00:00:05.0');
	});

	it('rolls seconds over into minutes at 60', () => {
		expect(formatChronometer(60_000)).toBe('00:01:00.0');
	});

	it('rolls minutes over into hours at 60', () => {
		expect(formatChronometer(3_600_000)).toBe('01:00:00.0');
	});

	it('formats a mixed hours/minutes/seconds/tenths value', () => {
		// 1h 2m 3.4s = 3600000 + 120000 + 3400 = 3723400ms
		expect(formatChronometer(3_723_400)).toBe('01:02:03.4');
	});

	it('zero-pads hours, minutes, and seconds to two digits', () => {
		expect(formatChronometer(9_000)).toBe('00:00:09.0');
	});

	it('truncates rather than rounds fractional tenths', () => {
		expect(formatChronometer(1_949)).toBe('00:00:01.9');
	});
});

describe('formatCoordinate', () => {
	it('rounds a long floating-point coordinate to one decimal place', () => {
		expect(formatCoordinate(60.001999999880795)).toBe('60.0');
	});

	it('pads a whole number with a trailing .0', () => {
		expect(formatCoordinate(0)).toBe('0.0');
	});

	it('preserves the sign of a negative coordinate', () => {
		expect(formatCoordinate(-42.37)).toBe('-42.4');
	});
});
