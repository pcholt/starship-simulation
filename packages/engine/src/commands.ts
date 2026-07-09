import type { ModuleName } from './domain/module.js';
import type { Location } from './domain/location.js';
import type { Vector3 } from './domain/vector.js';
import type { BankLocation } from './domain/engineering.js';

export type WeaponTarget = { kind: 'object'; name: string } | { kind: 'coordinates'; position: Vector3 };

export type ModuleTarget = ModuleName | 'all';

/**
 * Every command a player or a scenario step can dispatch. Text parsing of the
 * book's terse per-module syntax (e.g. `F P O <name>`) happens in the web
 * package, not here — the engine only ever accepts these typed commands.
 */
export type Command =
	| { module: 'controller'; type: 'Initialize'; target: ModuleTarget }
	| { module: 'controller'; type: 'Execute'; target: ModuleTarget }
	| { module: 'controller'; type: 'Halt'; target: ModuleTarget }
	| { module: 'controller'; type: 'CreateEnemyCraft'; name: string; mission: string; position: Vector3 }
	| { module: 'controller'; type: 'CreateFederationCraft'; name: string; mission: string; position: Vector3 }
	| {
			module: 'controller';
			type: 'CreateCelestialObject';
			name: string;
			position: Vector3;
			radius: number;
			mass: number;
	  }
	| { module: 'controller'; type: 'RunScenario' }
	| { module: 'controller'; type: 'HaltScenario' }
	| { module: 'navigation'; type: 'SetCourse'; destination: Location }
	| { module: 'navigation'; type: 'SetDirection'; xyAngleDeg: number; xzAngleDeg: number }
	| { module: 'navigation'; type: 'SetSpeed'; warpSpeed: number }
	| { module: 'sciences'; type: 'ScanObject'; name: string }
	| { module: 'sciences'; type: 'ScanArea'; position: Vector3 }
	| { module: 'sciences'; type: 'ScanRandom' }
	| { module: 'engineering'; type: 'SetEnergyAllocation'; deviceId: string; amount: number }
	| {
			module: 'engineering';
			type: 'SetShuttlecraftMission';
			shuttlecraftId: number;
			mission: 'none' | 'deliverCargo' | 'seekSensorData' | 'transportPersonnel' | 'seekEnterprise';
			destination?: Location;
	  }
	| { module: 'helm'; type: 'FirePhasers'; target: WeaponTarget }
	| { module: 'helm'; type: 'FireTorpedo'; target: WeaponTarget }
	| { module: 'helm'; type: 'SetShieldLevel'; location: BankLocation; level: number }
	| { module: 'medical'; type: 'AdmitPatient'; personnelId: number; name: string; health: number }
	| { module: 'communications'; type: 'ReceiveMessage'; from: string; text: string }
	| { module: 'communications'; type: 'DisplayNextMessage' }
	| { module: 'communications'; type: 'SendDistressMessage' }
	| { module: 'communications'; type: 'RequestPersonnelMovement'; personnelName: string; destination: Location }
	| { module: 'communications'; type: 'RequestCargoMovement'; cargoType: string; destination: Location }
	| { module: 'communications'; type: 'RequestAid'; federationCraftName: string }
	| { module: 'communications'; type: 'SendPeaceOffer'; craftName: string }
	| { module: 'communications'; type: 'AcceptPeaceOffer'; craftName: string }
	| { module: 'communications'; type: 'RejectPeaceOffer'; craftName: string };

export type CommandResult = { ok: true } | { ok: false; reason: string };
