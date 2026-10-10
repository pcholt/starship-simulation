import { describe, expect, it } from 'vitest';
import { createInitialCrewStatus } from '../../src/domain/crew-status.js';
import { CREW_ROSTER } from '../../src/domain/crew-roster-data.js';
import { createInitialWorldState } from '../../src/domain/world-state.js';

describe('createInitialCrewStatus', () => {
	it('has a status for every crew member aboard', () => {
		expect(createInitialCrewStatus().map((status) => status.id)).toEqual(CREW_ROSTER.map((profile) => profile.id));
	});

	it('starts everyone in full health', () => {
		expect(createInitialCrewStatus().every((status) => status.health === 10)).toBe(true);
	});

	it('puts the captain on the bridge', () => {
		const captain = CREW_ROSTER.find((profile) => profile.rank === 'captain')!;

		const status = createInitialCrewStatus().find((candidate) => candidate.id === captain.id)!;

		expect(status.location).toEqual({ kind: 'shipStation', station: 'bridge' });
	});

	it('puts an on-duty engineer in engineering', () => {
		const engineer = CREW_ROSTER.find((profile) => profile.speciality === 'engineering' && profile.id % 3 !== 0)!;

		const status = createInitialCrewStatus().find((candidate) => candidate.id === engineer.id)!;

		expect(status.location).toEqual({ kind: 'shipStation', station: 'engineering' });
	});

	it('puts every third crew member off duty in their quarters', () => {
		const status = createInitialCrewStatus().find((candidate) => candidate.id === 3)!;

		expect(status.location).toEqual({ kind: 'shipStation', station: 'crewQuarters' });
	});

	it('puts flight operations crew in the shuttle bay', () => {
		const pilot = CREW_ROSTER.find((profile) => profile.speciality === 'flightOps' && profile.id % 3 !== 0)!;

		const status = createInitialCrewStatus().find((candidate) => candidate.id === pilot.id)!;

		expect(status.location).toEqual({ kind: 'shipStation', station: 'shuttleBay' });
	});

	it('is part of the initial world state', () => {
		expect(createInitialWorldState().crewStatus).toHaveLength(200);
	});
});
