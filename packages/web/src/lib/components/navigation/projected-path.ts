import type { NavigationState, Vector3 } from '@starship/engine';
import { advanceHeading, advancePosition } from '@starship/engine';

/**
 * Predicts the ship's future track by repeatedly applying the same physics the engine itself
 * uses each tick — heading turning at its rate limit, then moving along the resulting heading —
 * over `totalSeconds` in `stepSeconds` increments. The result curves rather than running straight
 * whenever the ship is still turning toward its intended direction. Empty while stationary, since
 * there's nothing to project.
 */
export function projectedPath(nav: NavigationState, totalSeconds: number, stepSeconds: number): Vector3[] {
	if (nav.velocity.warpSpeed <= 0) return [];

	const stepMs = stepSeconds * 1000;
	const steps = Math.round(totalSeconds / stepSeconds);
	let current: NavigationState = nav;
	const points: Vector3[] = [current.position];

	for (let i = 0; i < steps; i++) {
		const velocity = advanceHeading(current, stepMs);
		current = { ...current, velocity };
		const position = advancePosition(current, stepMs);
		current = { ...current, position };
		points.push(position);
	}

	return points;
}
