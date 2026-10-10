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

describe('shuttle combat', () => {
	function engineWithShuttleInFlight(rollValue: number) {
		const engine = createEngine({ rng: () => rollValue });
		launch(engine, 1);
		engine.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: 1, lifted: true });
		return engine;
	}

	function engineWithEnemyAt(distance: number, rollValue: number) {
		const engine = createEngine({ rng: () => rollValue });
		engine.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'patrol', position: { x: distance, y: 0, z: 0 } });
		return engine;
	}

	const fire = (engine: TestEngine, name: string) => engine.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name } });

	it('lets a phaser shot miss a shuttle when it rolls an evasion', () => {
		const engine = engineWithShuttleInFlight(0.1);

		fire(engine, 'Shuttle 1');

		expect(shuttle(engine, 1).hullIntegrity).toBe(100);
	});

	it('still spends the phaser charge on a shot the shuttle evaded', () => {
		const engine = engineWithShuttleInFlight(0.1);

		fire(engine, 'Shuttle 1');

		expect(engine.getState().helm.phaserCharge.fore).toBe(0);
	});

	it('damages a shuttle when the shot is not evaded', () => {
		const engine = engineWithShuttleInFlight(0.9);

		fire(engine, 'Shuttle 1');

		expect(shuttle(engine, 1).hullIntegrity).toBeLessThan(100);
	});

	it('takes a fifth less phaser damage than an unshielded craft at the same range', () => {
		const shuttleEngine = engineWithShuttleInFlight(0.9);
		fire(shuttleEngine, 'Shuttle 1');
		const shuttleDamage = 100 - shuttle(shuttleEngine, 1).hullIntegrity;

		const enemyEngine = engineWithEnemyAt(10, 0.9);
		fire(enemyEngine, 'Raider');
		const enemyDamage = 100 - enemyEngine.getState().enemyCraft[0]!.hullIntegrity;

		expect(shuttleDamage).toBeCloseTo(enemyDamage * 0.8, 5);
	});

	it('never lets an enemy craft evade a phaser shot', () => {
		const engine = engineWithEnemyAt(10, 0);

		fire(engine, 'Raider');

		expect(engine.getState().enemyCraft[0]!.hullIntegrity).toBeLessThan(100);
	});

	it('hits a shuttle with a torpedo when the roll favours the torpedo', () => {
		const engine = engineWithShuttleInFlight(0.1);
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Shuttle 1' } });

		for (let step = 0; step < 100; step++) engine.tick(100);

		expect(shuttle(engine, 1).hullIntegrity).toBeLessThan(100);
	});

	it('misses a shuttle with a torpedo when the roll goes against the torpedo', () => {
		const engine = engineWithShuttleInFlight(0.9);
		engine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Shuttle 1' } });

		for (let step = 0; step < 100; step++) engine.tick(100);

		expect(shuttle(engine, 1).hullIntegrity).toBe(100);
	});

	it('takes a torpedo hit shielded: less than a torpedo does to an unshielded craft', () => {
		const shuttleEngine = engineWithShuttleInFlight(0.1);
		shuttleEngine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Shuttle 1' } });
		for (let step = 0; step < 100; step++) shuttleEngine.tick(100);
		const shuttleDamage = 100 - shuttle(shuttleEngine, 1).hullIntegrity;

		const enemyEngine = engineWithEnemyAt(10, 0.1);
		enemyEngine.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Raider' } });
		for (let step = 0; step < 100; step++) enemyEngine.tick(100);
		const enemyDamage = 100 - enemyEngine.getState().enemyCraft[0]!.hullIntegrity;

		expect(shuttleDamage).toBeLessThan(enemyDamage);
		expect(shuttleDamage).toBeGreaterThan(0);
	});
});

describe('crew aboard a destroyed shuttle', () => {
	it('die with it', () => {
		const engine = createEngine({ rng: () => 0.9 });
		engine.dispatch({ module: 'controller', type: 'LaunchShuttle', shuttleId: 1 });
		const aboard = { kind: 'craft' as const, craftClass: 'shuttlecraft' as const, id: 1 };
		const initial = engine.getState();
		const withCrewAboard = { ...initial, crewStatus: initial.crewStatus.map((member) => (member.id === 5 ? { ...member, location: aboard } : member)) };
		const rigged = createEngine({ rng: () => 0.9, initialState: withCrewAboard });
		for (let shot = 0; shot < 80 && rigged.getState().shuttlecraft.some((candidate) => candidate.id === 1); shot++) {
			rigged.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: 1, lifted: true });
			rigged.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Shuttle 1' } });
			rigged.tick(20_000);
		}

		expect(rigged.getState().crewStatus.find((member) => member.id === 5)!.health).toBe(0);
	});
});
