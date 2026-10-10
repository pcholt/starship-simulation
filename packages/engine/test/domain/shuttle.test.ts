import { describe, expect, it } from 'vitest';
import { createShuttles, isOnRadar, launchedBeside, returnedToBay } from '../../src/domain/shuttle.js';

describe('createShuttles', () => {
	it('creates six shuttles numbered 1 to 6', () => {
		expect(createShuttles().map((shuttle) => shuttle.id)).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('names each shuttle after its number', () => {
		expect(createShuttles().map((shuttle) => shuttle.name)).toEqual(['Shuttle 1', 'Shuttle 2', 'Shuttle 3', 'Shuttle 4', 'Shuttle 5', 'Shuttle 6']);
	});

	it('starts every shuttle in the shuttle bay with no mission', () => {
		for (const shuttle of createShuttles()) {
			expect(shuttle.status).toBe('inShuttleBay');
			expect(shuttle.mission).toBe('none');
			expect(shuttle.destination).toBeNull();
		}
	});

	it('starts every shuttle undamaged, fully fuelled and with a low-power shield', () => {
		for (const shuttle of createShuttles()) {
			expect(shuttle.hullIntegrity).toBe(100);
			expect(shuttle.fuel).toBe(100);
			expect(shuttle.shieldFunctional).toBe(20);
		}
	});
});

describe('isOnRadar', () => {
	it('hides a shuttle that is in the shuttle bay', () => {
		expect(isOnRadar(createShuttles()[0]!)).toBe(false);
	});

	it('shows a shuttle that is in flight', () => {
		const flying = launchedBeside(createShuttles()[0]!, { x: 0, y: 0, z: 0 });

		expect(isOnRadar(flying)).toBe(true);
	});
});

describe('launchedBeside', () => {
	it('places the shuttle next to the Enterprise', () => {
		const flying = launchedBeside(createShuttles()[0]!, { x: 100, y: 50, z: 0 });

		expect(flying.position).toEqual({ x: 110, y: 50, z: 0 });
	});

	it('leaves the original shuttle untouched', () => {
		const docked = createShuttles()[0]!;

		launchedBeside(docked, { x: 0, y: 0, z: 0 });

		expect(docked.status).toBe('inShuttleBay');
	});
});

describe('returnedToBay', () => {
	it('puts a flying shuttle back in the bay and clears its mission', () => {
		const flying = { ...launchedBeside(createShuttles()[0]!, { x: 0, y: 0, z: 0 }), mission: 'deliverCargo' as const, speed: 4 };

		const docked = returnedToBay(flying);

		expect(docked.status).toBe('inShuttleBay');
		expect(docked.mission).toBe('none');
		expect(docked.speed).toBe(0);
	});
});
