/**
 * Logarithmic mapping between a linear slider position and the zoom range it
 * represents — a linear slider over a range spanning min..max (often
 * 10x-100x) spends most of its travel on values nobody wants; log scale gives
 * even control across the whole span instead of cramming "useful" zoom
 * levels into the first few pixels.
 */
export function sliderPosToZoomRange(pos: number, min: number, max: number, steps: number): number {
	return min * Math.pow(max / min, pos / steps);
}

export function zoomRangeToSliderPos(zoomRange: number, min: number, max: number, steps: number): number {
	return (steps * Math.log(zoomRange / min)) / Math.log(max / min);
}
