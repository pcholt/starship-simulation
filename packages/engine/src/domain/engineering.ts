import { createDeviceStatus, type DeviceStatus } from './device.js';
import type { Location } from './location.js';

const TORPEDO_TUBES = [1, 2, 3, 4, 5, 6];
/** Per the book, phaser banks and deflector shields both come in six directional units that pair up. */
export const BANK_LOCATIONS = ['fore', 'aft', 'port', 'starboard', 'top', 'bottom'] as const;
export type BankLocation = (typeof BANK_LOCATIONS)[number];
const WARP_ENGINES = [1, 2];
const IMPULSE_ENGINES = [1, 2, 3, 4];

/** Every piece of hardware Engineering tracks, per the book's device-code table (Figure 3.13). */
export const DEVICE_IDS: readonly string[] = [
	...BANK_LOCATIONS.map((loc) => `phaser-${loc}`),
	...TORPEDO_TUBES.map((n) => `torpedoTube-${n}`),
	...BANK_LOCATIONS.map((loc) => `shield-${loc}`),
	...WARP_ENGINES.map((n) => `warpEngine-${n}`),
	...IMPULSE_ENGINES.map((n) => `impulseEngine-${n}`),
	'navigationComputer',
	'sciencesComputer',
	'medicalComputer',
	'intensiveCareUnit',
	'medicalResearchLab',
	'commsComputer',
	'tractorBeam',
	'oxygenDistribution',
	'waterDistribution'
];

export type ShuttlecraftMission = 'none' | 'deliverCargo' | 'seekSensorData' | 'transportPersonnel' | 'seekEnterprise';

export interface Shuttlecraft {
	id: number;
	mission: ShuttlecraftMission;
	destination: Location | null;
}

export interface EngineeringState {
	devices: Record<string, DeviceStatus>;
	totalEnergy: number;
	shuttlecraft: Shuttlecraft[];
}

const DEFAULT_TOTAL_ENERGY = 6000;
const SHUTTLECRAFT_COUNT = 6;

export function createEngineeringState(): EngineeringState {
	const share = DEFAULT_TOTAL_ENERGY / DEVICE_IDS.length;
	const devices = Object.fromEntries(DEVICE_IDS.map((id) => [id, createDeviceStatus({ energyAssigned: share })]));
	const shuttlecraft = Array.from({ length: SHUTTLECRAFT_COUNT }, (_, i) => ({
		id: i + 1,
		mission: 'none' as ShuttlecraftMission,
		destination: null
	}));
	return { devices, totalEnergy: DEFAULT_TOTAL_ENERGY, shuttlecraft };
}

/**
 * Zero-sum energy reallocation: assigning `amount` to `deviceId` takes it from
 * every other device equally, so the total stays fixed at `state.totalEnergy`
 * (matches the book's "boosting one device proportionally reduces all others").
 */
export function allocateEnergy(state: EngineeringState, deviceId: string, amount: number): EngineeringState {
	const clamped = Math.min(state.totalEnergy, Math.max(0, amount));
	const otherIds = Object.keys(state.devices).filter((id) => id !== deviceId);
	const remainingShare = otherIds.length > 0 ? (state.totalEnergy - clamped) / otherIds.length : 0;
	const devices: Record<string, DeviceStatus> = {};
	for (const id of Object.keys(state.devices)) {
		const device = state.devices[id]!;
		devices[id] = { ...device, energyAssigned: id === deviceId ? clamped : remainingShare };
	}
	return { ...state, devices };
}
