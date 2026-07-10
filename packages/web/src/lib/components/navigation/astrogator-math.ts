import type { Vector3 } from '@starship/engine';

/**
 * Inverse of the Astrogator's world-to-plot projection: given a click point
 * in the SVG's viewBox coordinates, resolves the world-space position it
 * corresponds to (on the same x/y plane as `center`, i.e. same z).
 */
export function plotPointToWorld(
	svgPoint: { x: number; y: number },
	center: Vector3,
	zoomRange: number,
	viewSize: number,
	plotRadiusPct: number
): Vector3 {
	const dx = ((svgPoint.x - viewSize / 2) / plotRadiusPct) * zoomRange;
	const dy = -((svgPoint.y - viewSize / 2) / plotRadiusPct) * zoomRange;
	return { x: center.x + dx, y: center.y + dy, z: center.z };
}
