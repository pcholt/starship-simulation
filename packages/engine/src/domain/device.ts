/**
 * Shared status schema for every piece of ship hardware in the book
 * (phasers, torpedo tubes, shields, engines, computers, life-support
 * devices, etc). Percentages are clamped to [0, 100].
 */
export interface DeviceStatus {
	/** How intact the device is (0 = destroyed, 100 = pristine). Damage lowers this; repair raises it. */
	functionalStatus: number;
	/** How well the device is currently performing, independent of damage (e.g. throttled by low energy). */
	operationalStatus: number;
	/** How likely the device is to work correctly when used; also governs repair speed. */
	reliabilityFactor: number;
	/** Energy currently allocated to this device by Engineering's distribution. */
	energyAssigned: number;
}

export function createDeviceStatus(overrides: Partial<DeviceStatus> = {}): DeviceStatus {
	return {
		functionalStatus: 100,
		operationalStatus: 100,
		reliabilityFactor: 100,
		energyAssigned: 0,
		...overrides
	};
}

function clampPercent(value: number): number {
	return Math.min(100, Math.max(0, value));
}

export function damageDevice(device: DeviceStatus, amount: number): DeviceStatus {
	return { ...device, functionalStatus: clampPercent(device.functionalStatus - amount) };
}

export interface RepairOptions {
	/** Functional-status points recovered per unit of assigned energy, at 100% reliability. */
	repairRatePerEnergyUnit: number;
}

export function repairDevice(device: DeviceStatus, options: RepairOptions): DeviceStatus {
	const recovered = device.energyAssigned * options.repairRatePerEnergyUnit * (device.reliabilityFactor / 100);
	return { ...device, functionalStatus: clampPercent(device.functionalStatus + recovered) };
}
