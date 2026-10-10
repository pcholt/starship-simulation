import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

type TestEngine = ReturnType<typeof createEngine>;

const launch = (engine: TestEngine, shuttleId: number) => engine.dispatch({ module: 'controller', type: 'LaunchShuttle', shuttleId });
const recall = (engine: TestEngine, shuttleId: number) => engine.dispatch({ module: 'controller', type: 'RecallShuttle', shuttleId });
const shuttle = (engine: TestEngine, id: number) => engine.getState().shuttlecraft.find((candidate) => candidate.id === id)!;

describe('shuttle launch and recall', () => {
	it('starts with all six shuttles in the shuttle bay', () => {
		expect(createEngine().getState().shuttlecraft.every((candidate) => candidate.status === 'inShuttleBay')).toBe(true);
	});

	it('puts a launched shuttle in flight beside the Enterprise', () => {
		const engine = createEngine();

		launch(engine, 1);

		expect(shuttle(engine, 1).status).toBe('inFlight');
		expect(shuttle(engine, 1).position).toEqual({ x: 10, y: 0, z: 0 });
	});

	it('leaves the other shuttles in the bay when one launches', () => {
		const engine = createEngine();

		launch(engine, 1);

		expect(shuttle(engine, 2).status).toBe('inShuttleBay');
	});

	it('refuses to launch a shuttle that is already in flight', () => {
		const engine = createEngine();
		launch(engine, 1);

		expect(launch(engine, 1)).toEqual({ ok: false, reason: 'Shuttle 1 is already in flight' });
	});

	it('refuses to launch a shuttle that does not exist', () => {
		expect(launch(createEngine(), 99)).toEqual({ ok: false, reason: 'No shuttlecraft numbered 99' });
	});

	it('returns a recalled shuttle to the bay', () => {
		const engine = createEngine();
		launch(engine, 1);

		recall(engine, 1);

		expect(shuttle(engine, 1).status).toBe('inShuttleBay');
	});

	it('refuses to recall a shuttle that is already in the bay', () => {
		expect(recall(createEngine(), 1)).toEqual({ ok: false, reason: 'Shuttle 1 is already in the shuttle bay' });
	});

	it('refuses to recall a shuttle that does not exist', () => {
		expect(recall(createEngine(), 99)).toEqual({ ok: false, reason: 'No shuttlecraft numbered 99' });
	});
});

describe('shuttles on radar', () => {
	it('cannot be scanned by name while in the shuttle bay', () => {
		const engine = createEngine();

		const result = engine.dispatch({ module: 'sciences', type: 'ScanObject', name: 'Shuttle 1' });

		expect(result.ok).toBe(false);
	});

	it('can be scanned by name once in flight', () => {
		const engine = createEngine();
		launch(engine, 1);

		const result = engine.dispatch({ module: 'sciences', type: 'ScanObject', name: 'Shuttle 1' });

		expect(result.ok).toBe(true);
		expect(engine.getState().lastScanResult?.identity).toBe('Shuttle 1');
	});

	it('cannot be targeted by name while in the shuttle bay', () => {
		const engine = createEngine();

		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Shuttle 1' } });

		expect(result.ok).toBe(false);
	});

	it('cannot be targeted by coordinates while in the shuttle bay', () => {
		const engine = createEngine();

		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position: { x: 0, y: 0, z: 0 } } });

		expect(result.ok).toBe(false);
	});

	it('cannot be targeted again once recalled to the bay', () => {
		const engine = createEngine();
		launch(engine, 1);
		recall(engine, 1);

		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Shuttle 1' } });

		expect(result.ok).toBe(false);
	});

	it('can be a navigation destination once in flight', () => {
		const engine = createEngine();
		launch(engine, 1);

		engine.dispatch({ module: 'navigation', type: 'SetCourse', destination: { kind: 'craft', craftClass: 'shuttlecraft', id: 1 } });

		expect(engine.getState().enterpriseNavigation.intendedDirection.xyAngleDeg).toBe(0);
		expect(engine.getState().enterpriseNavigation.destination).toEqual({ kind: 'craft', craftClass: 'shuttlecraft', id: 1 });
	});
});

describe('shuttle ids', () => {
	it('gives craft created later ids that do not clash with the shuttles', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'patrol', position: { x: 0, y: 0, z: 0 } });

		expect(engine.getState().enemyCraft[0]!.id).toBeGreaterThan(6);
	});
});

describe('weapons safety cover over shuttles', () => {
	it('refuses to fire at a shuttle in flight while its cover is closed', () => {
		const engine = createEngine();
		launch(engine, 1);

		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Shuttle 1' } });

		expect(result).toEqual({ ok: false, reason: 'The weapons safety cover over Shuttle 1 is closed' });
	});

	it('fires at a shuttle in flight once its cover is lifted', () => {
		const engine = createEngine();
		launch(engine, 1);
		engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: 1, lifted: true });

		const result = engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Shuttle 1' } });

		expect(result.ok).toBe(true);
	});

	it('closes the cover again when the shuttle is recalled', () => {
		const engine = createEngine();
		launch(engine, 1);
		engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: 1, lifted: true });

		recall(engine, 1);

		expect(engine.getState().helm.liftedWeaponCoverCraftIds).toEqual([]);
	});
});

describe('destroyed shuttles', () => {
	function engineWithDoomedShuttle() {
		const engine = createEngine();
		launch(engine, 1);
		return engine;
	}

	it('is removed from the fleet when its hull is gone', () => {
		const engine = engineWithDoomedShuttle();
		for (let shot = 0; shot < 60 && engine.getState().shuttlecraft.some((candidate) => candidate.id === 1); shot++) {
			engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: 1, lifted: true });
			engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Shuttle 1' } });
			engine.tick(20_000);
		}

		expect(engine.getState().shuttlecraft.some((candidate) => candidate.id === 1)).toBe(false);
	});
});
