import { CREW_ROSTER } from './crew-roster-data.js';
import type { Speciality } from './crew-roster.js';
import { shipStation, type Location, type ShipStation } from './location.js';

export const FULL_HEALTH = 10;

export interface CrewStatus {
	id: number;
	/** 0 (dead) to 10 (fully well), the same scale the Intensive Care Unit uses. */
	health: number;
	location: Location;
}

const DUTY_STATION_BY_SPECIALITY: Record<Speciality, ShipStation> = {
	command: 'bridge',
	operations: 'sensorStations',
	engineering: 'engineering',
	damageControl: 'engineering',
	security: 'security',
	medical: 'medicalResearchLab',
	sciences: 'sciencesLab',
	flightOps: 'shuttleBay',
	supply: 'foodProcessing',
	administration: 'crewQuarters'
};

const EVERY_THIRD_CREW_MEMBER_IS_OFF_DUTY = 3;

export function createInitialCrewStatus(): CrewStatus[] {
	return CREW_ROSTER.map((profile) => {
		const isOffDuty = profile.id % EVERY_THIRD_CREW_MEMBER_IS_OFF_DUTY === 0;
		const station = isOffDuty ? 'crewQuarters' : DUTY_STATION_BY_SPECIALITY[profile.speciality];
		return { id: profile.id, health: FULL_HEALTH, location: shipStation(station) };
	});
}
