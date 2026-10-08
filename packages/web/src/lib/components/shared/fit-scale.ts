export interface FitScaleRequest {
	availableWidth: number;
	availableHeight: number;
	/** Lays the content out at the given width in unscaled pixels and reports its resulting height. */
	measureContentHeightAtWidth: (layoutWidth: number) => number;
	minimumScale: number;
	maximumScale: number;
}

const BISECTION_STEPS = 12;

export function findFitScale(request: FitScaleRequest): number {
	const { availableWidth, availableHeight, measureContentHeightAtWidth, minimumScale, maximumScale } = request;

	const fitsAtScale = (scale: number) =>
		measureContentHeightAtWidth(availableWidth / scale) * scale <= availableHeight;

	if (fitsAtScale(maximumScale)) return maximumScale;
	if (!fitsAtScale(minimumScale)) return minimumScale;

	let fittingScale = minimumScale;
	let overflowingScale = maximumScale;
	for (let step = 0; step < BISECTION_STEPS; step++) {
		const middleScale = (fittingScale + overflowingScale) / 2;
		if (fitsAtScale(middleScale)) fittingScale = middleScale;
		else overflowingScale = middleScale;
	}
	return fittingScale;
}
