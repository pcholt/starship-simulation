import type { Craft } from './craft.js';
import type { Location } from './location.js';
import type { Vector3 } from './vector.js';

export type ShuttlecraftMission = 'none' | 'deliverCargo' | 'seekSensorData' | 'transportPersonnel' | 'seekEnterprise';

export type ShuttleStatus = 'inShuttleBay' | 'inFlight';

export interface Shuttle extends Craft {
	status: ShuttleStatus;
	destination: Location | null;
	/** 0-100 strength of the shuttle's low-power shield; it absorbs that percentage of incoming damage. */
	shieldFunctional: number;
	fuel: number;
}

const SHUTTLECRAFT_COUNT = 6;
const SHUTTLE_SHIELD_FUNCTIONAL = 20;
const FULL_FUEL = 100;
const LAUNCH_OFFSET_FROM_ENTERPRISE: Vector3 = { x: 10, y: 0, z: 0 };

export function createShuttles(): Shuttle[] {
	return Array.from({ length: SHUTTLECRAFT_COUNT }, (_, index) => ({
		id: index + 1,
		name: `Shuttle ${index + 1}`,
		mission: 'none',
		position: { x: 0, y: 0, z: 0 },
		hullIntegrity: 100,
		cargo: [],
		speed: 0,
		status: 'inShuttleBay',
		destination: null,
		shieldFunctional: SHUTTLE_SHIELD_FUNCTIONAL,
		fuel: FULL_FUEL
	}));
}

export function isOnRadar(shuttle: Shuttle): boolean {
	return shuttle.status === 'inFlight';
}

export function launchedBeside(shuttle: Shuttle, enterprisePosition: Vector3): Shuttle {
	const position = {
		x: enterprisePosition.x + LAUNCH_OFFSET_FROM_ENTERPRISE.x,
		y: enterprisePosition.y + LAUNCH_OFFSET_FROM_ENTERPRISE.y,
		z: enterprisePosition.z + LAUNCH_OFFSET_FROM_ENTERPRISE.z
	};
	return { ...shuttle, status: 'inFlight', position };
}

export function returnedToBay(shuttle: Shuttle): Shuttle {
	return { ...shuttle, status: 'inShuttleBay', destination: null, mission: 'none', speed: 0 };
}
