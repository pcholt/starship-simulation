import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

const healthOf = (engine: ReturnType<typeof createEngine>, id: number) =>
	engine.getState().crewStatus.find((member) => member.id === id)!.health;
const locationOf = (engine: ReturnType<typeof createEngine>, id: number) =>
	engine.getState().crewStatus.find((member) => member.id === id)!.location;

describe('medical commands', () => {
	it('AdmitPatient places the crew member in the first empty ICU slot', () => {
		const engine = createEngine();

		const result = engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

		expect(result).toEqual({ ok: true });
		expect(engine.getState().medical.icu[0]).toEqual({ personnelId: 12 });
	});

	it('AdmitPatient sets the crew member health when one is given', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

		expect(healthOf(engine, 12)).toBe(4);
	});

	it('AdmitPatient keeps the crew member current health when none is given', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12 });

		expect(healthOf(engine, 12)).toBe(10);
	});

	it('AdmitPatient moves the crew member to the Intensive Care Unit', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

		expect(locationOf(engine, 12)).toEqual({ kind: 'shipStation', station: 'intensiveCareUnit' });
	});

	it('AdmitPatient fails for an id that is not aboard', () => {
		const engine = createEngine();

		const result = engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 9999, health: 4 });

		expect(result).toEqual({ ok: false, reason: 'No crew member with id 9999' });
	});

	it('AdmitPatient fails once the ICU is full', () => {
		const engine = createEngine();
		for (let id = 1; id <= 4; id++) engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: id, health: 5 });

		const result = engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 99, health: 5 });

		expect(result.ok).toBe(false);
	});

	it('AdmitPatient leaves the crew member where they were when the ICU is full', () => {
		const engine = createEngine();
		for (let id = 1; id <= 4; id++) engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: id, health: 5 });
		const before = locationOf(engine, 99);

		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 99, health: 5 });

		expect(locationOf(engine, 99)).toEqual(before);
	});
});

describe('medical recovery during tick', () => {
	it('does not change patient health while the medical module is halted', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'controller', type: 'Halt', target: 'medical' });
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

		engine.tick(5000);

		expect(healthOf(engine, 12)).toBe(4);
	});

	it('improves patient health over time once the medical module is running (full ICU function by default)', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

		engine.tick(5000);

		expect(healthOf(engine, 12)).toBeGreaterThan(4);
	});

	it('discharges a patient from the ICU once fully recovered', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 9.9 });

		engine.tick(60000);

		expect(engine.getState().medical.icu[0]).toBeNull();
	});

	it('sends a recovered patient back to their quarters', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 9.9 });

		engine.tick(60000);

		expect(locationOf(engine, 12)).toEqual({ kind: 'shipStation', station: 'crewQuarters' });
	});
});
