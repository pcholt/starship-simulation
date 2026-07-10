import { describe, expect, it } from 'vitest';
import { sliderPosToZoomRange, zoomRangeToSliderPos } from './zoom-math.js';

const MIN = 100;
const MAX = 4000;
const STEPS = 200;

describe('sliderPosToZoomRange', () => {
	it('maps slider position 0 to the minimum zoom range', () => {
		expect(sliderPosToZoomRange(0, MIN, MAX, STEPS)).toBeCloseTo(MIN);
	});

	it('maps the maximum slider position to the maximum zoom range', () => {
		expect(sliderPosToZoomRange(STEPS, MIN, MAX, STEPS)).toBeCloseTo(MAX);
	});

	it('is monotonically increasing', () => {
		const a = sliderPosToZoomRange(50, MIN, MAX, STEPS);
		const b = sliderPosToZoomRange(100, MIN, MAX, STEPS);
		const c = sliderPosToZoomRange(150, MIN, MAX, STEPS);
		expect(a).toBeLessThan(b);
		expect(b).toBeLessThan(c);
	});

	it('spends equal slider distance per order-of-magnitude change (log scale, not linear)', () => {
		// Going from pos 0 to STEPS/2 should multiply the range by sqrt(MAX/MIN), same
		// ratio as going from STEPS/2 to STEPS — a linear mapping would not have this property.
		const start = sliderPosToZoomRange(0, MIN, MAX, STEPS);
		const mid = sliderPosToZoomRange(STEPS / 2, MIN, MAX, STEPS);
		const end = sliderPosToZoomRange(STEPS, MIN, MAX, STEPS);
		expect(mid / start).toBeCloseTo(end / mid, 5);
	});
});

describe('zoomRangeToSliderPos', () => {
	it('is the inverse of sliderPosToZoomRange', () => {
		for (const pos of [0, 25, 50, 100, 150, 200]) {
			const zoomRange = sliderPosToZoomRange(pos, MIN, MAX, STEPS);
			expect(zoomRangeToSliderPos(zoomRange, MIN, MAX, STEPS)).toBeCloseTo(pos, 5);
		}
	});
});
