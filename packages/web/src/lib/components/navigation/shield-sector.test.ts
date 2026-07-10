import { describe, expect, it } from 'vitest';
import { BANK_ANGLE_OFFSET_DEG, sectorPolygonPoints } from './shield-sector.js';

describe('BANK_ANGLE_OFFSET_DEG', () => {
	it('has fore pointing straight ahead (no offset from heading)', () => {
		expect(BANK_ANGLE_OFFSET_DEG.fore).toBe(0);
	});

	it('has aft directly opposite fore', () => {
		expect(BANK_ANGLE_OFFSET_DEG.aft).toBe(180);
	});

	it('has port and starboard on opposite sides, 90 degrees from fore', () => {
		expect(Math.abs(BANK_ANGLE_OFFSET_DEG.port)).toBe(90);
		expect(Math.abs(BANK_ANGLE_OFFSET_DEG.starboard)).toBe(90);
		expect(BANK_ANGLE_OFFSET_DEG.port).toBe(-BANK_ANGLE_OFFSET_DEG.starboard);
	});
});

describe('sectorPolygonPoints', () => {
	it('starts at the center (the wedge apex)', () => {
		const points = sectorPolygonPoints(0, 90, 10);
		expect(points[0]).toEqual({ x: 0, y: 0 });
	});

	it('spans the requested angular width, symmetric about the center angle', () => {
		const points = sectorPolygonPoints(0, 90, 10);
		const first = points[1]!;
		const last = points.at(-1)!;
		// -45deg and +45deg around a center of 0deg, at radius 10.
		expect(first.x).toBeCloseTo(10 * Math.cos((-45 * Math.PI) / 180));
		expect(first.y).toBeCloseTo(-10 * Math.sin((-45 * Math.PI) / 180));
		expect(last.x).toBeCloseTo(10 * Math.cos((45 * Math.PI) / 180));
		expect(last.y).toBeCloseTo(-10 * Math.sin((45 * Math.PI) / 180));
	});

	it('scales with the given radius', () => {
		const small = sectorPolygonPoints(0, 90, 5);
		const large = sectorPolygonPoints(0, 90, 10);
		expect(large[1]!.x).toBeCloseTo(small[1]!.x * 2);
	});

	it('rotates with the center angle', () => {
		const facingForward = sectorPolygonPoints(0, 90, 10);
		const facingAft = sectorPolygonPoints(180, 90, 10);
		expect(facingAft[1]!.x).toBeCloseTo(-facingForward[1]!.x);
	});
});
