import { describe, expect, it } from 'vitest';
import type { CrewProfile, CrewStatus } from '@starship/engine';
import { buildCrewRows, describeLocation, filterCrewRows, sortCrewRows, summarizeCrew, type CrewRow } from './crew-roster-view';

const roster: CrewProfile[] = [
	{ id: 1, name: 'Aiko Bianchi', rank: 'captain', speciality: 'command' },
	{ id: 2, name: 'Bruno Costa', rank: 'ensign', speciality: 'engineering' },
	{ id: 3, name: 'Carmen Dalgaard', rank: 'crewman', speciality: 'medical' },
	{ id: 4, name: 'Darius Eriksen', rank: 'lieutenant', speciality: 'engineering' }
];

const statuses: CrewStatus[] = [
	{ id: 1, health: 10, location: { kind: 'shipStation', station: 'bridge' } },
	{ id: 2, health: 6, location: { kind: 'shipStation', station: 'engineering' } },
	{ id: 3, health: 0, location: { kind: 'shipStation', station: 'intensiveCareUnit' } },
	{ id: 4, health: 10, location: { kind: 'craft', craftClass: 'shuttlecraft', id: 2 } }
];

const rows = (): CrewRow[] => buildCrewRows(roster, statuses);

describe('describeLocation', () => {
	it('names a ship station', () => {
		expect(describeLocation({ kind: 'shipStation', station: 'medicalResearchLab' })).toBe('Medical Research Lab');
	});

	it('names a transporter station', () => {
		expect(describeLocation({ kind: 'transporterStation', id: 1 })).toBe('Transporter 1');
	});

	it('says which shuttle a crew member is aboard', () => {
		expect(describeLocation({ kind: 'craft', craftClass: 'shuttlecraft', id: 3 })).toBe('Shuttle 3');
	});

	it('gives rounded coordinates for a crew member away from the ship', () => {
		expect(describeLocation({ kind: 'coordinates', x: 10.4, y: -3.6, z: 0 })).toBe('Away at 10, -4');
	});
});

describe('buildCrewRows', () => {
	it('has a row for each crew member', () => {
		expect(rows()).toHaveLength(4);
	});

	it('combines who someone is with where they are and how they are', () => {
		expect(rows()[1]).toEqual({
			id: 2,
			name: 'Bruno Costa',
			rank: 'ensign',
			rankLabel: 'Ensign',
			speciality: 'engineering',
			specialityLabel: 'Engineering',
			locationLabel: 'Engineering',
			health: 6
		});
	});

	it('leaves out people who have no status, such as reserve crew not yet aboard', () => {
		expect(buildCrewRows(roster, statuses.slice(0, 2))).toHaveLength(2);
	});
});

describe('filterCrewRows', () => {
	it('keeps everyone when nothing is filtered', () => {
		expect(filterCrewRows(rows(), { speciality: 'all', search: '' })).toHaveLength(4);
	});

	it('keeps only the chosen speciality', () => {
		const names = filterCrewRows(rows(), { speciality: 'engineering', search: '' }).map((row) => row.name);

		expect(names).toEqual(['Bruno Costa', 'Darius Eriksen']);
	});

	it('matches a name search without regard to case', () => {
		const names = filterCrewRows(rows(), { speciality: 'all', search: 'carMEN' }).map((row) => row.name);

		expect(names).toEqual(['Carmen Dalgaard']);
	});

	it('matches part of a name', () => {
		expect(filterCrewRows(rows(), { speciality: 'all', search: 'eri' }).map((row) => row.id)).toEqual([4]);
	});

	it('ignores spaces around the search text', () => {
		expect(filterCrewRows(rows(), { speciality: 'all', search: '  Aiko  ' })).toHaveLength(1);
	});

	it('combines the speciality and the search', () => {
		expect(filterCrewRows(rows(), { speciality: 'engineering', search: 'bruno' })).toHaveLength(1);
		expect(filterCrewRows(rows(), { speciality: 'medical', search: 'bruno' })).toHaveLength(0);
	});
});

describe('sortCrewRows', () => {
	it('puts the most senior rank first when sorting by rank ascending', () => {
		expect(sortCrewRows(rows(), 'rank', 'ascending').map((row) => row.rank)).toEqual(['captain', 'lieutenant', 'ensign', 'crewman']);
	});

	it('puts the most junior rank first when sorting by rank descending', () => {
		expect(sortCrewRows(rows(), 'rank', 'descending').map((row) => row.rank)).toEqual(['crewman', 'ensign', 'lieutenant', 'captain']);
	});

	it('sorts by name alphabetically', () => {
		expect(sortCrewRows(rows(), 'name', 'ascending').map((row) => row.name)).toEqual([
			'Aiko Bianchi',
			'Bruno Costa',
			'Carmen Dalgaard',
			'Darius Eriksen'
		]);
	});

	it('sorts by health with the least healthy first when ascending', () => {
		expect(sortCrewRows(rows(), 'health', 'ascending').map((row) => row.health)).toEqual([0, 6, 10, 10]);
	});

	it('breaks ties by name', () => {
		expect(sortCrewRows(rows(), 'health', 'descending').map((row) => row.name).slice(0, 2)).toEqual(['Aiko Bianchi', 'Darius Eriksen']);
	});

	it('sorts by location name', () => {
		expect(sortCrewRows(rows(), 'location', 'ascending').map((row) => row.locationLabel)[0]).toBe('Bridge');
	});

	it('sorts by speciality name', () => {
		expect(sortCrewRows(rows(), 'speciality', 'ascending').map((row) => row.specialityLabel)[0]).toBe('Command');
	});

	it('leaves the original list untouched', () => {
		const original = rows();

		sortCrewRows(original, 'name', 'descending');

		expect(original[0]!.name).toBe('Aiko Bianchi');
	});
});

describe('summarizeCrew', () => {
	it('counts everyone, the injured and the dead', () => {
		expect(summarizeCrew(rows())).toEqual({ total: 4, injured: 1, dead: 1 });
	});

	it('counts nobody as injured when everyone is well', () => {
		expect(summarizeCrew(buildCrewRows(roster, statuses.map((status) => ({ ...status, health: 10 }))))).toEqual({ total: 4, injured: 0, dead: 0 });
	});
});
