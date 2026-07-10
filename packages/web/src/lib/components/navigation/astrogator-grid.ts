/**
 * Rounds a raw grid spacing to a "nice" 1/2/5-times-a-power-of-ten value,
 * the way chart axes do, so grid labels read as round world-coordinate numbers
 * (e.g. 200, 500) rather than an arbitrary fraction of the current zoom range.
 */
export function niceGridStep(range: number, targetDivisions: number): number {
	const rawStep = range / targetDivisions;
	const magnitude = 10 ** Math.floor(Math.log10(rawStep));
	const residual = rawStep / magnitude;

	let niceResidual: number;
	if (residual < 1.5) niceResidual = 1;
	else if (residual < 3.5) niceResidual = 2;
	else if (residual < 7.5) niceResidual = 5;
	else niceResidual = 10;

	return niceResidual * magnitude;
}

/** Positive world-coordinate offsets at which to draw grid lines, mirrored for the negative axis by the caller. */
export function gridLineValues(zoomRange: number, targetDivisions: number): number[] {
	const step = niceGridStep(zoomRange, targetDivisions);
	const values: number[] = [];
	for (let v = step; v <= zoomRange + step / 2; v += step) {
		values.push(Math.round(v * 1e6) / 1e6);
	}
	return values;
}

/**
 * Absolute universe-coordinate values (multiples of the grid step) visible within
 * `zoomRange` of `centerCoord`. Unlike `gridLineValues`, these are anchored to fixed
 * points in universe space rather than to the ship's current position — as the ship
 * moves, these lines stay put and the ship moves across them.
 */
export function universeGridLineValues(centerCoord: number, zoomRange: number, targetDivisions: number): number[] {
	const step = niceGridStep(zoomRange, targetDivisions);
	const min = centerCoord - zoomRange;
	const max = centerCoord + zoomRange;
	const start = Math.ceil(min / step) * step;
	const end = Math.floor(max / step) * step;

	const values: number[] = [];
	for (let v = start; v <= end + step / 1e6; v += step) {
		values.push(Math.round(v * 1e6) / 1e6);
	}
	return values;
}
