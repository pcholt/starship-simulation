export type DeviceGroupId = 'weapons' | 'shields' | 'propulsion' | 'computers' | 'lifeSupport';

export const DEVICE_GROUP_IDS: readonly DeviceGroupId[] = ['weapons', 'shields', 'propulsion', 'computers', 'lifeSupport'];

export interface EnergyChangeRate {
	up: number;
	down: number;
}

/** Most energy units a single device in the group can gain (`up`) or shed (`down`) each second. */
export const MAXIMUM_ENERGY_UNITS_CHANGE_PER_SECOND: Readonly<Record<DeviceGroupId, EnergyChangeRate>> = {
	weapons: { up: 300, down: 500 },
	shields: { up: 200, down: 1000 },
	computers: { up: 1000, down: 2000 },
	propulsion: { up: 200, down: 200 },
	lifeSupport: { up: 100, down: 100 }
};

const GROUP_BY_DEVICE_ID_PATTERN: ReadonlyArray<readonly [RegExp, DeviceGroupId]> = [
	[/^(phaser|torpedoTube)-/, 'weapons'],
	[/^shield-/, 'shields'],
	[/^(warpEngine|impulseEngine)-/, 'propulsion'],
	[/Computer$/, 'computers']
];

export function groupIdForDevice(deviceId: string): DeviceGroupId {
	const match = GROUP_BY_DEVICE_ID_PATTERN.find(([pattern]) => pattern.test(deviceId));
	return match ? match[1] : 'lifeSupport';
}

const MINIMUM_OPERATIONAL_ENERGY_UNITS_BY_DEVICE_ID_PATTERN: ReadonlyArray<readonly [RegExp, number]> = [
	[/^warpEngine-/, 100],
	[/^impulseEngine-/, 10],
	[/^(intensiveCareUnit|medicalResearchLab|oxygenDistribution|waterDistribution)$/, 10],
	[/^tractorBeam$/, 100],
	[/^transporter-/, 50],
	[/Computer$/, 30],
	[/^shield-/, 100]
];

/** Energy a device must be receiving to operate; devices not listed (the weapons) have no minimum. */
export function minimumOperationalEnergy(deviceId: string): number {
	const match = MINIMUM_OPERATIONAL_ENERGY_UNITS_BY_DEVICE_ID_PATTERN.find(([pattern]) => pattern.test(deviceId));
	return match ? match[1] : 0;
}

const NOMINAL_MAXIMUM_ENERGY_UNITS_BY_DEVICE_ID_PATTERN: ReadonlyArray<readonly [RegExp, number]> = [
	[/^phaser-/, 1000],
	[/^torpedoTube-/, 100],
	[/^warpEngine-/, 1000],
	[/^impulseEngine-/, 500],
	[/^(intensiveCareUnit|medicalResearchLab|oxygenDistribution|waterDistribution)$/, 20],
	[/^tractorBeam$/, 1000],
	[/^transporter-/, 500],
	[/Computer$/, 200],
	[/^shield-/, 1000]
];

export const OVERDRIVE_PERCENT_OF_NOMINAL_MAXIMUM = 110;

/** Most energy a device can run on continuously; more than this is overdrive. */
export function nominalMaximumEnergy(deviceId: string): number {
	const match = NOMINAL_MAXIMUM_ENERGY_UNITS_BY_DEVICE_ID_PATTERN.find(([pattern]) => pattern.test(deviceId));
	if (!match) throw new Error(`No nominal maximum energy is defined for device "${deviceId}"`);
	return match[1];
}

/** Absolute ceiling for a device: its nominal maximum plus the overdrive margin. */
export function overdriveEnergyLimit(deviceId: string): number {
	return Math.round(nominalMaximumEnergy(deviceId) * OVERDRIVE_PERCENT_OF_NOMINAL_MAXIMUM) / 100;
}
