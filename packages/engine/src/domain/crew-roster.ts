export type Rank =
	| 'captain'
	| 'commander'
	| 'lieutenantCommander'
	| 'lieutenant'
	| 'lieutenantJuniorGrade'
	| 'ensign'
	| 'masterChiefPettyOfficer'
	| 'seniorChiefPettyOfficer'
	| 'chiefPettyOfficer'
	| 'pettyOfficerFirstClass'
	| 'pettyOfficerSecondClass'
	| 'pettyOfficerThirdClass'
	| 'crewman'
	| 'crewmanApprentice'
	| 'crewmanRecruit';

/** Highest rank first, so a rank's position in this list is its seniority. */
export const RANKS_BY_SENIORITY: readonly Rank[] = [
	'captain',
	'commander',
	'lieutenantCommander',
	'lieutenant',
	'lieutenantJuniorGrade',
	'ensign',
	'masterChiefPettyOfficer',
	'seniorChiefPettyOfficer',
	'chiefPettyOfficer',
	'pettyOfficerFirstClass',
	'pettyOfficerSecondClass',
	'pettyOfficerThirdClass',
	'crewman',
	'crewmanApprentice',
	'crewmanRecruit'
];

export const RANK_LABELS: Record<Rank, string> = {
	captain: 'Captain',
	commander: 'Commander',
	lieutenantCommander: 'Lt. Commander',
	lieutenant: 'Lieutenant',
	lieutenantJuniorGrade: 'Lt. Junior Grade',
	ensign: 'Ensign',
	masterChiefPettyOfficer: 'Master Chief Petty Officer',
	seniorChiefPettyOfficer: 'Senior Chief Petty Officer',
	chiefPettyOfficer: 'Chief Petty Officer',
	pettyOfficerFirstClass: 'Petty Officer 1st Class',
	pettyOfficerSecondClass: 'Petty Officer 2nd Class',
	pettyOfficerThirdClass: 'Petty Officer 3rd Class',
	crewman: 'Crewman',
	crewmanApprentice: 'Crewman Apprentice',
	crewmanRecruit: 'Crewman Recruit'
};

export function isOfficer(rank: Rank): boolean {
	return RANKS_BY_SENIORITY.indexOf(rank) <= RANKS_BY_SENIORITY.indexOf('ensign');
}

export type Speciality =
	| 'command'
	| 'operations'
	| 'engineering'
	| 'damageControl'
	| 'security'
	| 'medical'
	| 'sciences'
	| 'flightOps'
	| 'supply'
	| 'administration';

export const SPECIALITY_LABELS: Record<Speciality, string> = {
	command: 'Command',
	operations: 'Operations',
	engineering: 'Engineering',
	damageControl: 'Damage Control',
	security: 'Security',
	medical: 'Medical',
	sciences: 'Sciences',
	flightOps: 'Flight Ops',
	supply: 'Supply',
	administration: 'Administration'
};

export const ALL_SPECIALITIES = Object.keys(SPECIALITY_LABELS) as Speciality[];

/** Who a crew member is. Authored once at build time and never changes during play, so it is not part of the world state. */
export interface CrewProfile {
	id: number;
	name: string;
	rank: Rank;
	speciality: Speciality;
}
