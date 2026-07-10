/**
 * Converts a pointer position relative to the compass center (standard
 * screen coordinates: +x right, +y down) into a heading in degrees using
 * the book's convention (0° = +x, sweeping toward +y). Screen y is flipped
 * since it increases downward while the heading's +y is "up" on the dial —
 * the same convention the Astrogator plot uses.
 */
export function angleFromPointer(dx: number, dy: number): number {
	const deg = (Math.atan2(-dy, dx) * 180) / Math.PI;
	return deg < 0 ? deg + 360 : deg;
}

/** The inverse: where on the dial (relative to center, screen coordinates) a given heading's indicator should sit. */
export function pointerFromAngle(angleDeg: number, radius: number): { x: number; y: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return { x: Math.cos(rad) * radius, y: -Math.sin(rad) * radius };
}
