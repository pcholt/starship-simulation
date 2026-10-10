import { describe, expect, it } from 'vitest';
import { bankLocationForRelativePosition, computePhaserDamage, computeTorpedoDamage, damageAfterShield, resolvePhaserHit, resolveTorpedoHit } from '../../src/domain/combat.js';

describe('bankLocationForRelativePosition', () => {
	it('is "fore" when the target is ahead along +x', () => {
		expect(bankLocationForRelativePosition({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 })).toBe('fore');
	});

	it('is "aft" when the target is behind along -x', () => {
		expect(bankLocationForRelativePosition({ x: 0, y: 0, z: 0 }, { x: -10, y: 0, z: 0 })).toBe('aft');
	});

	it('is "port" when the target is along +y', () => {
		expect(bankLocationForRelativePosition({ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 })).toBe('port');
	});

	it('is "starboard" when the target is along -y', () => {
		expect(bankLocationForRelativePosition({ x: 0, y: 0, z: 0 }, { x: 0, y: -10, z: 0 })).toBe('starboard');
	});

	it('ignores z displacement, since there is no top/bottom bank', () => {
		expect(bankLocationForRelativePosition({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 500 })).toBe('fore');
	});
});

describe('computePhaserDamage', () => {
	it('does more damage at close range than long range', () => {
		const close = computePhaserDamage(10, 0);
		const far = computePhaserDamage(900, 0);
		expect(close).toBeGreaterThan(far);
	});

	it('does less damage against a fully-functional target shield than an unshielded target', () => {
		const unshielded = computePhaserDamage(100, 0);
		const shielded = computePhaserDamage(100, 100);
		expect(shielded).toBeLessThan(unshielded);
		expect(shielded).toBeCloseTo(0);
	});

	it('never returns a negative amount', () => {
		expect(computePhaserDamage(100000, 0)).toBeGreaterThanOrEqual(0);
	});
});

describe('computeTorpedoDamage', () => {
	it('does full base damage against an unshielded target regardless of distance', () => {
		expect(computeTorpedoDamage(0)).toBeGreaterThan(0);
	});

	it('does less damage against a shielded target', () => {
		expect(computeTorpedoDamage(100)).toBeLessThan(computeTorpedoDamage(0));
	});
});

describe('resolveTorpedoHit', () => {
	it('always hits a target moving at warp 5 or slower, regardless of the coin flip', () => {
		expect(resolveTorpedoHit(5, () => 0)).toBe(true);
		expect(resolveTorpedoHit(0, () => 0)).toBe(true);
	});

	it('misses a target moving faster than warp 5 when the coin flip goes against it', () => {
		expect(resolveTorpedoHit(6, () => 0)).toBe(false);
	});

	it('hits a target moving faster than warp 5 when the coin flip favors it', () => {
		expect(resolveTorpedoHit(6, () => 0.99)).toBe(true);
	});
});

describe('resolveTorpedoHit for a nimble target', () => {
	it('hits a slow nimble target when the roll is under 35 percent', () => {
		expect(resolveTorpedoHit(0, () => 0.34, true)).toBe(true);
	});

	it('misses a slow nimble target when the roll is 35 percent or more', () => {
		expect(resolveTorpedoHit(0, () => 0.35, true)).toBe(false);
	});

	it('is harder to hit than an ordinary slow target, which is a certain hit', () => {
		expect(resolveTorpedoHit(0, () => 0.9, false)).toBe(true);
		expect(resolveTorpedoHit(0, () => 0.9, true)).toBe(false);
	});
});

describe('resolvePhaserHit', () => {
	it('always hits an ordinary target', () => {
		expect(resolvePhaserHit(false, () => 0)).toBe(true);
	});

	it('is evaded by a nimble target when the roll is under 40 percent', () => {
		expect(resolvePhaserHit(true, () => 0.39)).toBe(false);
	});

	it('hits a nimble target when the roll is 40 percent or more', () => {
		expect(resolvePhaserHit(true, () => 0.4)).toBe(true);
	});
});

describe('damageAfterShield', () => {
	it('leaves damage unchanged with no shield', () => {
		expect(damageAfterShield(50, 0)).toBe(50);
	});

	it('removes the shield percentage of the damage', () => {
		expect(damageAfterShield(50, 20)).toBeCloseTo(40);
	});

	it('removes all damage with a full shield', () => {
		expect(damageAfterShield(50, 100)).toBe(0);
	});
});
