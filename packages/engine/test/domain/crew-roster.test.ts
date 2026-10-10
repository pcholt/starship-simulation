import { describe, expect, it } from 'vitest';
import { RANK_LABELS, RANKS_BY_SENIORITY, SPECIALITY_LABELS, isOfficer, type Rank, type Speciality } from '../../src/domain/crew-roster.js';
import { CREW_ROSTER, RESERVE_CREW } from '../../src/domain/crew-roster-data.js';

const countBy = <T extends string>(values: T[]) =>
	values.reduce<Record<string, number>>((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {});

const rosterRanks = () => countBy(CREW_ROSTER.map((profile) => profile.rank));
const rosterSpecialities = () => countBy(CREW_ROSTER.map((profile) => profile.speciality));

describe('CREW_ROSTER', () => {
	it('has 200 people aboard', () => {
		expect(CREW_ROSTER).toHaveLength(200);
	});

	it('numbers its crew 1 to 200 in order', () => {
		expect(CREW_ROSTER.map((profile) => profile.id)).toEqual(Array.from({ length: 200 }, (_, index) => index + 1));
	});

	it('gives every crew member a different full name', () => {
		expect(new Set(CREW_ROSTER.map((profile) => profile.name)).size).toBe(200);
	});

	it('never gives a crew member an empty name', () => {
		expect(CREW_ROSTER.every((profile) => profile.name.trim().length > 0)).toBe(true);
	});

	it('has one captain', () => {
		expect(rosterRanks()['captain']).toBe(1);
	});

	it('has the officer ranks in a pyramid, with more junior officers than senior ones', () => {
		const ranks = rosterRanks();

		expect([ranks['commander'], ranks['lieutenantCommander'], ranks['lieutenant'], ranks['lieutenantJuniorGrade'], ranks['ensign']]).toEqual([2, 4, 8, 9, 10]);
	});

	it('has the enlisted ranks in a pyramid, with most crew in the middle grades', () => {
		const ranks = rosterRanks();

		expect([
			ranks['masterChiefPettyOfficer'],
			ranks['seniorChiefPettyOfficer'],
			ranks['chiefPettyOfficer'],
			ranks['pettyOfficerFirstClass'],
			ranks['pettyOfficerSecondClass'],
			ranks['pettyOfficerThirdClass'],
			ranks['crewman'],
			ranks['crewmanApprentice'],
			ranks['crewmanRecruit']
		]).toEqual([2, 3, 11, 24, 32, 36, 30, 16, 12]);
	});

	it('is about 17 percent officers, as on a navy ship', () => {
		const officers = CREW_ROSTER.filter((profile) => isOfficer(profile.rank)).length;

		expect(officers).toBe(34);
	});

	it('has the number of people in each speciality', () => {
		expect(rosterSpecialities()).toEqual({
			command: 12,
			engineering: 52,
			damageControl: 20,
			operations: 26,
			security: 14,
			medical: 12,
			sciences: 14,
			flightOps: 12,
			supply: 24,
			administration: 14
		});
	});

	it('puts engineering and damage control together at about a third of the crew', () => {
		const specialities = rosterSpecialities();

		expect((specialities['engineering']! + specialities['damageControl']!) / 200).toBeCloseTo(0.36, 2);
	});

	it('makes every command speciality member an officer', () => {
		const commandRanks = CREW_ROSTER.filter((profile) => profile.speciality === 'command').map((profile) => profile.rank);

		expect(commandRanks.every(isOfficer)).toBe(true);
	});

	it('makes the captain a command officer', () => {
		const captain = CREW_ROSTER.find((profile) => profile.rank === 'captain')!;

		expect(captain.speciality).toBe('command');
	});

	it('uses only known ranks and specialities', () => {
		for (const profile of CREW_ROSTER) {
			expect(RANKS_BY_SENIORITY).toContain(profile.rank as Rank);
			expect(Object.keys(SPECIALITY_LABELS)).toContain(profile.speciality as Speciality);
		}
	});
});

describe('RESERVE_CREW', () => {
	it('has 100 more named people', () => {
		expect(RESERVE_CREW).toHaveLength(100);
	});

	it('numbers its people from 201 so they never clash with the crew aboard', () => {
		expect(RESERVE_CREW[0]!.id).toBe(201);
		expect(RESERVE_CREW[99]!.id).toBe(300);
	});

	it('shares no name with the crew aboard or with each other', () => {
		const names = [...CREW_ROSTER, ...RESERVE_CREW].map((profile) => profile.name);

		expect(new Set(names).size).toBe(300);
	});
});

describe('RANK_LABELS', () => {
	it('names every rank', () => {
		expect(Object.keys(RANK_LABELS).sort()).toEqual([...RANKS_BY_SENIORITY].sort());
	});
});

describe('isOfficer', () => {
	it('treats an ensign as an officer', () => {
		expect(isOfficer('ensign')).toBe(true);
	});

	it('treats a master chief petty officer as enlisted', () => {
		expect(isOfficer('masterChiefPettyOfficer')).toBe(false);
	});

	it('treats a crewman recruit as enlisted', () => {
		expect(isOfficer('crewmanRecruit')).toBe(false);
	});
});
