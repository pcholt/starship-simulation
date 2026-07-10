/** Formats simulated milliseconds as HH:MM:SS.T (hours:minutes:seconds.tenths), per the book's two-part CHRONOMETER readout. */
export function formatChronometer(simulatedTimeMs: number): string {
	const totalTenths = Math.floor(simulatedTimeMs / 100);
	const tenths = totalTenths % 10;
	const totalSeconds = Math.floor(totalTenths / 10);
	const seconds = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const hours = Math.floor(totalMinutes / 60);

	const pad2 = (n: number) => String(n).padStart(2, '0');
	return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${tenths}`;
}
