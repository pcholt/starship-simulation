import { createDeviceStatus, type DeviceStatus } from './device.js';
import { MAXIMUM_ENERGY_UNITS_CHANGE_PER_SECOND, groupIdForDevice, minimumOperationalEnergy, nominalMaximumEnergy, overdriveEnergyLimit, type DeviceGroupId } from './device-groups.js';
import type { Location } from './location.js';

const TORPEDO_TUBES = [1, 2, 3, 4, 5, 6];
/** Phaser banks and deflector shields both come in four directional units that pair up — the ship has no top/bottom banks. */
export const BANK_LOCATIONS = ['fore', 'aft', 'port', 'starboard'] as const;
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
	/** Groups whose requested energy is protected from being reduced or raised by changes to other devices. */
	lockedGroups: DeviceGroupId[];
	/** Energy in the pool that no device is currently drawing; the radiators bleed it off. */
	radiatedEnergy: number;
	shuttlecraft: Shuttlecraft[];
}

const DEFAULT_TOTAL_ENERGY = 6000;
const SHUTTLECRAFT_COUNT = 6;

export function createEngineeringState(): EngineeringState {
	const initialEnergy = distributeEnergyWithinLimits(
		DEVICE_IDS.map((id) => ({ id, weight: 1, limit: nominalMaximumEnergy(id) })),
		DEFAULT_TOTAL_ENERGY
	);
	const devices = Object.fromEntries(DEVICE_IDS.map((id) => [id, createDeviceStatus({ energyAssigned: initialEnergy[id]! })]));
	const shuttlecraft = Array.from({ length: SHUTTLECRAFT_COUNT }, (_, i) => ({
		id: i + 1,
		mission: 'none' as ShuttlecraftMission,
		destination: null
	}));
	return { devices, totalEnergy: DEFAULT_TOTAL_ENERGY, lockedGroups: [], radiatedEnergy: 0, shuttlecraft };
}

interface EnergyClaimant {
	id: string;
	weight: number;
	limit: number;
}

/**
 * Shares `energy` between the claimants in proportion to their weights, never giving one
 * more than its limit; what a capped claimant cannot take is re-shared among the rest.
 * Energy nobody can take (every claimant at its limit) is left unassigned.
 */
function distributeEnergyWithinLimits(claimants: EnergyClaimant[], energy: number): Record<string, number> {
	const shares: Record<string, number> = Object.fromEntries(claimants.map(({ id }) => [id, 0]));
	let uncapped = claimants;
	let remaining = energy;
	while (uncapped.length > 0 && remaining > 0) {
		const totalWeight = sumOf(uncapped.map(({ weight }) => weight));
		const proposedShare = (claimant: EnergyClaimant) =>
			totalWeight > 0 ? (claimant.weight / totalWeight) * remaining : remaining / uncapped.length;
		const overflowing = uncapped.filter((claimant) => proposedShare(claimant) >= claimant.limit);
		if (overflowing.length === 0) {
			for (const claimant of uncapped) shares[claimant.id] = proposedShare(claimant);
			return shares;
		}
		for (const claimant of overflowing) {
			shares[claimant.id] = claimant.limit;
			remaining -= claimant.limit;
		}
		uncapped = uncapped.filter((claimant) => !overflowing.includes(claimant));
	}
	return shares;
}

/** Floating-point shortfall below which a device counts as having reached its requested energy. */
const ENERGY_REACHED_TOLERANCE = 1e-6;

function sumOf(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0);
}

/**
 * Requests the given energy for each device in `requestedAmounts` and rescales the other
 * adjustable devices' requests by a common factor so the requested total stays at
 * `state.totalEnergy` and they keep their positions relative to each other (matches the
 * book's "boosting one device proportionally reduces all others"). A device is only
 * ever put into overdrive by an explicit request for it: rebalancing never raises another device
 * above its nominal maximum (or above an overdrive request already made for it), and energy
 * the adjustable devices cannot absorb goes unassigned (and is radiated). Devices in locked
 * groups are never adjusted, nor are the other devices in the same group as a requested device,
 * so the requests are capped at what those leave free (scaled down together if they cannot all
 * be met). If the adjustable devices request no energy to
 * scale, the remainder is shared equally between them. Only requests change here;
 * `advanceEnergyLevels` moves the actual levels toward them.
 */
export function allocateEnergyToDevices(state: EngineeringState, requestedAmounts: Record<string, number>): EngineeringState {
	const isRequested = (id: string) => id in requestedAmounts;
	const requestedGroups = new Set(Object.keys(requestedAmounts).map(groupIdForDevice));
	const isHeldInPlace = (id: string) =>
		!isRequested(id) && (state.lockedGroups.includes(groupIdForDevice(id)) || requestedGroups.has(groupIdForDevice(id)));
	const ids = Object.keys(state.devices);
	const heldIds = ids.filter(isHeldInPlace);
	const adjustableIds = ids.filter((id) => !isRequested(id) && !isHeldInPlace(id));

	const energyHeldInPlace = sumOf(heldIds.map((id) => state.devices[id]!.energyRequested));
	const energyAvailableToRequest = Math.max(0, state.totalEnergy - energyHeldInPlace);
	const wantedAmounts = Object.fromEntries(
		Object.entries(requestedAmounts).map(([id, amount]) => [id, Math.min(overdriveEnergyLimit(id), Math.max(0, amount))])
	);
	const totalWanted = sumOf(Object.values(wantedAmounts));
	const grantedFraction = totalWanted > energyAvailableToRequest ? energyAvailableToRequest / totalWanted : 1;
	const energyForAdjustableDevices = energyAvailableToRequest - totalWanted * grantedFraction;
	const energyRequestedFor = distributeEnergyWithinLimits(
		adjustableIds.map((id) => ({ id, weight: state.devices[id]!.energyRequested, limit: Math.max(nominalMaximumEnergy(id), state.devices[id]!.energyRequested) })),
		energyForAdjustableDevices
	);

	const devices: Record<string, DeviceStatus> = {};
	for (const id of ids) {
		const device = state.devices[id]!;
		if (isRequested(id)) devices[id] = { ...device, energyRequested: wantedAmounts[id]! * grantedFraction };
		else if (isHeldInPlace(id)) devices[id] = device;
		else devices[id] = { ...device, energyRequested: energyRequestedFor[id]! };
	}
	return { ...state, devices };
}

export function allocateEnergy(state: EngineeringState, deviceId: string, amount: number): EngineeringState {
	return allocateEnergyToDevices(state, { [deviceId]: amount });
}

/** Requests every device in the group to receive exactly its minimum operational energy. */
export function allocateMinimumEnergyToGroup(state: EngineeringState, group: DeviceGroupId): EngineeringState {
	const minimums = Object.fromEntries(
		Object.keys(state.devices)
			.filter((id) => groupIdForDevice(id) === group)
			.map((id) => [id, minimumOperationalEnergy(id)])
	);
	return allocateEnergyToDevices(state, minimums);
}

export function setGroupLocked(state: EngineeringState, group: DeviceGroupId, locked: boolean): EngineeringState {
	const others = state.lockedGroups.filter((lockedGroup) => lockedGroup !== group);
	return { ...state, lockedGroups: locked ? [...others, group] : others };
}

/**
 * Moves every device's actual energy toward its request, limited per device per second by
 * its group's maximum rates. Reductions happen first and free energy up; increases then draw
 * only from what is free in the pool, scaled back proportionally if they want more. Energy
 * the devices are not drawing is reported as `radiatedEnergy`.
 */
export function advanceEnergyLevels(state: EngineeringState, deltaMs: number): EngineeringState {
	const seconds = deltaMs / 1000;
	const ratesFor = (id: string) => MAXIMUM_ENERGY_UNITS_CHANGE_PER_SECOND[groupIdForDevice(id)];
	const ids = Object.keys(state.devices);

	const afterReductions: Record<string, number> = {};
	for (const id of ids) {
		const { energyAssigned, energyRequested } = state.devices[id]!;
		afterReductions[id] =
			energyAssigned > energyRequested
				? Math.max(energyRequested, energyAssigned - ratesFor(id).down * seconds)
				: energyAssigned;
	}

	const wantedIncrease = (id: string) =>
		Math.min(Math.max(0, state.devices[id]!.energyRequested - afterReductions[id]!), ratesFor(id).up * seconds);
	const totalWantedIncrease = sumOf(ids.map(wantedIncrease));
	const freeEnergy = Math.max(0, state.totalEnergy - sumOf(ids.map((id) => afterReductions[id]!)));
	const grantedFraction = totalWantedIncrease > freeEnergy ? freeEnergy / totalWantedIncrease : 1;

	const devices: Record<string, DeviceStatus> = {};
	for (const id of ids) {
		const device = state.devices[id]!;
		const advanced = afterReductions[id]! + wantedIncrease(id) * grantedFraction;
		const reachedRequest = Math.abs(device.energyRequested - advanced) < ENERGY_REACHED_TOLERANCE;
		devices[id] = { ...device, energyAssigned: reachedRequest ? device.energyRequested : advanced };
	}
	const radiatedEnergy = Math.max(0, state.totalEnergy - sumOf(ids.map((id) => devices[id]!.energyAssigned)));
	return { ...state, devices, radiatedEnergy };
}
