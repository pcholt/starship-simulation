export { createEngine } from './engine.js';
export type { Engine, EngineDeps } from './engine.js';
export type { Command, CommandResult, ModuleTarget } from './commands.js';
export type { EngineEvent, Unsubscribe } from './events.js';
export type { ScenarioScript, ScenarioStep, ScenarioRuntimeState, ScenarioRunState } from './scenario/scenario.js';

export type { WorldState } from './domain/world-state.js';
export { createInitialWorldState } from './domain/world-state.js';
export type { ModuleName, ModuleRunState } from './domain/module.js';
export { ALL_MODULE_NAMES } from './domain/module.js';
export type { Location, ShipStation, CraftClass } from './domain/location.js';
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
	scanCraft
} from './domain/sciences.js';
