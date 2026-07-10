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
