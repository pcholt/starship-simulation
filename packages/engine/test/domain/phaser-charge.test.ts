import { describe, expect, it } from 'vitest';
import { advancePhaserCharge } from '../../src/domain/phaser-charge.js';

describe('advancePhaserCharge', () => {
	it('fills from empty to full in 6 seconds at full power', () => {
		expect(advancePhaserCharge(0, 1, 6000)).toBeCloseTo(1);
	});

	it('is half full after 3 seconds at full power', () => {
		expect(advancePhaserCharge(0, 1, 3000)).toBeCloseTo(0.5);
	});

	it('charges proportionally slower at half power', () => {
		expect(advancePhaserCharge(0, 0.5, 6000)).toBeCloseTo(0.5);
	});

	it('charges at the 10% power minimum, though slowly', () => {
		expect(advancePhaserCharge(0, 0.1, 6000)).toBeCloseTo(0.1);
	});

	it('charges faster than full rate when the bank is overdriven', () => {
		expect(advancePhaserCharge(0, 1.1, 3000)).toBeGreaterThan(0.5);
	});

	it('never exceeds a full charge', () => {
		expect(advancePhaserCharge(0.9, 1, 60_000)).toBe(1);
	});

	it('holds a full charge while power stays at or above 10%', () => {
		expect(advancePhaserCharge(1, 0.1, 10_000)).toBe(1);
	});

	it('drains below 10% power, at the rate a full-power bank would fill', () => {
		expect(advancePhaserCharge(1, 0.05, 3000)).toBeCloseTo(0.5);
	});

	it('never drains below empty', () => {
		expect(advancePhaserCharge(0.2, 0, 60_000)).toBe(0);
	});

	it('drains with no power at all', () => {
		expect(advancePhaserCharge(1, 0, 6000)).toBeCloseTo(0);
	});

	it('changes nothing when no time passes', () => {
		expect(advancePhaserCharge(0.4, 1, 0)).toBe(0.4);
	});
});
