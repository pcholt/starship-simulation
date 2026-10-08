export { createEngine } from './engine.js';
export type { Engine, EngineDeps } from './engine.js';
export type { Command, CommandResult, ModuleTarget } from './commands.js';
export type { EngineEvent, Unsubscribe } from './events.js';
export type { ScenarioScript, ScenarioStep, ScenarioRuntimeState, ScenarioRunState } from './scenario/scenario.js';
export type { ClientMessage, ServerMessage } from './protocol.js';

export type { WorldState, ScanAreaEvent, WeaponFireEvent, TorpedoExplosionEvent } from './domain/world-state.js';
export { createInitialWorldState, MAX_TRACKED_WEAPON_EVENTS } from './domain/world-state.js';
export type { ModuleName, ModuleRunState } from './domain/module.js';
export { ALL_MODULE_NAMES } from './domain/module.js';
export type { Location, ShipStation, CraftClass } from './domain/location.js';
export { SHIP_STATIONS } from './domain/location.js';
export { shipStation, celestialObjectLocation, craftLocation, locationsEqual } from './domain/location.js';
export type { DeviceStatus, RepairOptions } from './domain/device.js';
export { createDeviceStatus, damageDevice, repairDevice } from './domain/device.js';
export type { Vector3 } from './domain/vector.js';
export type { CelestialObject } from './domain/celestial-object.js';
export type { Craft, Fleet } from './domain/craft.js';
export type { Torpedo } from './domain/torpedo.js';
export { launchTorpedo, advanceTorpedo } from './domain/torpedo.js';
export type { NavigationState, Velocity, IntendedDirection } from './domain/navigation.js';
export {
	createNavigationState,
	headingVector,
	advancePosition,
	advanceHeading,
	advanceWarpSpeed,
	maximumWarpSpeed,
	MAXIMUM_WARP_DECELERATION_PER_SECOND,
	bearingTo,
	rotateToward,
	turnRateDegPerSecond
} from './domain/navigation.js';
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
export { createEngineeringState, allocateEnergy, totalWarpDriveEnergy, allocateEnergyToDevices, allocateMinimumEnergyToGroup, setGroupLocked, advanceEnergyLevels, DEVICE_IDS, BANK_LOCATIONS } from './domain/engineering.js';
export {
	bankLocationForRelativePosition,
	computePhaserDamage,
	computeTorpedoDamage,
	PHASER_RANGE_HALF_LIFE,
	TORPEDO_HIT_RADIUS,
	TORPEDO_SPLASH_RADIUS
} from './domain/combat.js';
export type { WeaponTarget } from './commands.js';
export type { Patient, MedicalState, AdmitResult, RecoveryOptions } from './domain/medical.js';
export { createMedicalState, admitPatient, dischargePatient, recoverPatient, ICU_CAPACITY } from './domain/medical.js';
export type { Message, CommunicationsState } from './domain/communications.js';
export { createCommunicationsState, enqueueMessage, displayNextMessage } from './domain/communications.js';
export type { DeviceGroupId, EnergyChangeRate } from './domain/device-groups.js';
export { DEVICE_GROUP_IDS, MAXIMUM_ENERGY_UNITS_CHANGE_PER_SECOND, groupIdForDevice, minimumOperationalEnergy, nominalMaximumEnergy, overdriveEnergyLimit, OVERDRIVE_PERCENT_OF_NOMINAL_MAXIMUM } from './domain/device-groups.js';
