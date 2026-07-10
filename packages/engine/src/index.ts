export { createEngine } from './engine.js';
export type { Engine, EngineDeps } from './engine.js';
export type { Command, CommandResult, ModuleTarget } from './commands.js';
export type { EngineEvent, Unsubscribe } from './events.js';
export type { ScenarioScript, ScenarioStep, ScenarioRuntimeState, ScenarioRunState } from './scenario/scenario.js';
export type { ClientMessage, ServerMessage } from './protocol.js';

export type { WorldState } from './domain/world-state.js';
export { createInitialWorldState } from './domain/world-state.js';
export type { ModuleName, ModuleRunState } from './domain/module.js';
export { ALL_MODULE_NAMES } from './domain/module.js';
export type { Location, ShipStation, CraftClass } from './domain/location.js';
export { SHIP_STATIONS } from './domain/location.js';
export { shipStation, celestialObjectLocation, craftLocation, locationsEqual } from './domain/location.js';
export type { DeviceStatus, RepairOptions } from './domain/device.js';
export { createDeviceStatus, damageDevice, repairDevice } from './domain/device.js';
export type { Vector3 } from './domain/vector.js';
export type { CelestialObject } from './domain/celestial-object.js';
export type { Craft } from './domain/craft.js';
export type { NavigationState, Velocity } from './domain/navigation.js';
export { createNavigationState, headingVector, advancePosition } from './domain/navigation.js';
export type { LifeSupportState, ScanResult, ScanQuality } from './domain/sciences.js';
export {
	createLifeSupportState,
	distanceBetween,
	scanQualityForDistance,
	scanCelestialObject,
	scanCraft,
	FULL_SCAN_RANGE,
	PARTIAL_SCAN_RANGE
} from './domain/sciences.js';
export type { EngineeringState, Shuttlecraft, ShuttlecraftMission, BankLocation } from './domain/engineering.js';
export { createEngineeringState, allocateEnergy, DEVICE_IDS, BANK_LOCATIONS } from './domain/engineering.js';
export {
	bankLocationForRelativePosition,
	computePhaserDamage,
	computeTorpedoDamage,
	PHASER_RANGE_HALF_LIFE
} from './domain/combat.js';
export type { WeaponTarget } from './commands.js';
export type { Patient, MedicalState, AdmitResult, RecoveryOptions } from './domain/medical.js';
export { createMedicalState, admitPatient, dischargePatient, recoverPatient, ICU_CAPACITY } from './domain/medical.js';
export type { Message, CommunicationsState } from './domain/communications.js';
export { createCommunicationsState, enqueueMessage, displayNextMessage } from './domain/communications.js';
