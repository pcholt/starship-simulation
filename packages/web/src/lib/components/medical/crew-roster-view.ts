import {
	RANKS_BY_SENIORITY,
	RANK_LABELS,
	SPECIALITY_LABELS,
	type CrewProfile,
	type CrewStatus,
	type Location,
	type Rank,
	type ShipStation,
	type Speciality
} from '@starship/engine';

export interface CrewRow {
	id: number;
	name: string;
	rank: Rank;
	rankLabel: string;
	speciality: Speciality;
	specialityLabel: string;
	locationLabel: string;
	health: number;
}

export type CrewSortKey = 'rank' | 'name' | 'speciality' | 'location' | 'health';
export type SortDirection = 'ascending' | 'descending';

export interface CrewFilter {
	speciality: Speciality | 'all';
	search: string;
}

export interface CrewSummary {
	total: number;
	injured: number;
	dead: number;
}

const STATION_LABELS: Record<ShipStation, string> = {
	bridge: 'Bridge',
	sciencesLab: 'Sciences Lab',
	engineering: 'Engineering',
	brig: 'Brig',
	security: 'Security',
	navigationComputer: 'Navigation Computer',
	medicalResearchLab: 'Medical Research Lab',
	medicalComputer: 'Medical Computer',
	turboElevatorComputer: 'Turbo Elevator',
	tractorBeam: 'Tractor Beam',
	foodProcessing: 'Food Processing',
	oxygenDistRecycling: 'Oxygen Recycling',
	waterDistRecycling: 'Water Recycling',
	energySupply: 'Energy Supply',
	intensiveCareUnit: 'Intensive Care Unit',
	sensorStations: 'Sensor Stations',
	crewQuarters: 'Crew Quarters',
	shuttleBay: 'Shuttle Bay'
};

const FULL_HEALTH = 10;

export function describeLocation(location: Location): string {
	switch (location.kind) {
		case 'shipStation':
			return STATION_LABELS[location.station];
		case 'transporterStation':
			return `Transporter ${location.id}`;
		case 'turboElevatorStation':
			return `Turbo Elevator ${location.id}`;
		case 'photonTorpedoTube':
			return `Torpedo Tube ${location.id}`;
		case 'phaserStation':
			return `Phaser Station ${location.id}`;
		case 'deflectorShield':
			return `Deflector Station ${location.id}`;
		case 'celestialObject':
			return `Celestial Object ${location.id}`;
		case 'craft':
			return location.craftClass === 'shuttlecraft' ? `Shuttle ${location.id}` : `Craft ${location.id}`;
		case 'coordinates':
			return `Away at ${Math.round(location.x)}, ${Math.round(location.y)}`;
	}
}

export function buildCrewRows(roster: readonly CrewProfile[], statuses: readonly CrewStatus[]): CrewRow[] {
	const statusById = new Map(statuses.map((status) => [status.id, status]));
	return roster.flatMap((profile) => {
		const status = statusById.get(profile.id);
		if (!status) return [];
		return [
			{
				id: profile.id,
				name: profile.name,
				rank: profile.rank,
				rankLabel: RANK_LABELS[profile.rank],
				speciality: profile.speciality,
				specialityLabel: SPECIALITY_LABELS[profile.speciality],
				locationLabel: describeLocation(status.location),
				health: status.health
			}
		];
	});
}

export function filterCrewRows(rows: readonly CrewRow[], filter: CrewFilter): CrewRow[] {
	const search = filter.search.trim().toLowerCase();
	return rows.filter((row) => {
		const matchesSpeciality = filter.speciality === 'all' || row.speciality === filter.speciality;
		const matchesSearch = search === '' || row.name.toLowerCase().includes(search);
		return matchesSpeciality && matchesSearch;
	});
}

function compareRows(key: CrewSortKey, first: CrewRow, second: CrewRow): number {
	switch (key) {
		case 'rank':
			return RANKS_BY_SENIORITY.indexOf(first.rank) - RANKS_BY_SENIORITY.indexOf(second.rank);
		case 'name':
			return first.name.localeCompare(second.name);
		case 'speciality':
			return first.specialityLabel.localeCompare(second.specialityLabel);
		case 'location':
			return first.locationLabel.localeCompare(second.locationLabel);
		case 'health':
			return first.health - second.health;
	}
}

export function sortCrewRows(rows: readonly CrewRow[], key: CrewSortKey, direction: SortDirection): CrewRow[] {
	const directionFactor = direction === 'ascending' ? 1 : -1;
	return [...rows].sort((first, second) => {
		const byKey = compareRows(key, first, second) * directionFactor;
		return byKey !== 0 ? byKey : first.name.localeCompare(second.name);
	});
}

export function summarizeCrew(rows: readonly CrewRow[]): CrewSummary {
	const dead = rows.filter((row) => row.health <= 0).length;
	const injured = rows.filter((row) => row.health > 0 && row.health < FULL_HEALTH).length;
	return { total: rows.length, injured, dead };
}
