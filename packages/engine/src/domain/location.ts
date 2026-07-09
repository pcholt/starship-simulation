/**
 * Where a person, cargo, or object currently is. Modeled as a discriminated
 * union rather than the book's flat numeric location-code range (0-4000+)
 * so each module can pattern-match on `kind` instead of a giant switch over
 * numeric ranges. The book's numeric codes are not reproduced here; they were
 * a BASIC-era serialization concern, not a domain concept.
 */
export type ShipStation =
	| 'bridge'
	| 'sciencesLab'
	| 'engineering'
	| 'brig'
	| 'security'
	| 'navigationComputer'
	| 'medicalResearchLab'
	| 'medicalComputer'
	| 'turboElevatorComputer'
	| 'tractorBeam'
	| 'foodProcessing'
	| 'oxygenDistRecycling'
	| 'waterDistRecycling'
	| 'energySupply'
	| 'intensiveCareUnit'
	| 'sensorStations'
	| 'crewQuarters'
	| 'shuttleBay';

export type CraftClass = 'enterprise' | 'enemy' | 'federation' | 'shuttlecraft';

export type Location =
	| { kind: 'shipStation'; station: ShipStation }
	| { kind: 'transporterStation'; id: number }
	| { kind: 'turboElevatorStation'; id: number }
	| { kind: 'photonTorpedoTube'; id: number }
	| { kind: 'phaserStation'; id: number }
	| { kind: 'deflectorShield'; id: number }
	| { kind: 'celestialObject'; id: number }
	| { kind: 'craft'; craftClass: CraftClass; id: number }
	| { kind: 'coordinates'; x: number; y: number; z: number };

export function shipStation(station: ShipStation): Location {
	return { kind: 'shipStation', station };
}

export function celestialObjectLocation(id: number): Location {
	return { kind: 'celestialObject', id };
}

export function craftLocation(craftClass: CraftClass, id: number): Location {
	return { kind: 'craft', craftClass, id };
}

export function locationsEqual(a: Location, b: Location): boolean {
	if (a.kind !== b.kind) return false;
	switch (a.kind) {
		case 'shipStation':
			return a.station === (b as typeof a).station;
		case 'transporterStation':
		case 'turboElevatorStation':
		case 'photonTorpedoTube':
		case 'phaserStation':
		case 'deflectorShield':
		case 'celestialObject':
			return a.id === (b as typeof a).id;
		case 'craft':
			return a.craftClass === (b as typeof a).craftClass && a.id === (b as typeof a).id;
		case 'coordinates':
			return a.x === (b as typeof a).x && a.y === (b as typeof a).y && a.z === (b as typeof a).z;
	}
}
