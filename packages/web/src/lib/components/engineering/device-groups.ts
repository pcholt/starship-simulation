import { groupIdForDevice, type DeviceGroupId } from '@starship/engine';

export { groupIdForDevice, type DeviceGroupId };

export interface DeviceGroup {
	id: DeviceGroupId;
	title: string;
	accentVar: string;
}

export const DEVICE_GROUPS: readonly DeviceGroup[] = [
	{ id: 'weapons', title: 'Weapons', accentVar: 'chrome-helm' },
	{ id: 'shields', title: 'Shields', accentVar: 'chrome-navigation' },
	{ id: 'propulsion', title: 'Propulsion', accentVar: 'chrome-engineering' },
	{ id: 'computers', title: 'Computers', accentVar: 'chrome-sciences' },
	{ id: 'lifeSupport', title: 'Life Support & Utilities', accentVar: 'chrome-medical' }
];

export function humanizeDeviceId(deviceId: string): string {
	return deviceId
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export interface HealthReadings {
	functionalStatus: number;
	operationalStatus: number;
	reliabilityFactor: number;
}

export type DeviceHealth = 'ok' | 'warning' | 'critical';

const HEALTHY_AT_OR_ABOVE = 90;
const WARNING_AT_OR_ABOVE = 50;

export function deviceHealth(readings: HealthReadings): DeviceHealth {
	const weakest = Math.min(readings.functionalStatus, readings.operationalStatus, readings.reliabilityFactor);
	if (weakest >= HEALTHY_AT_OR_ABOVE) return 'ok';
	if (weakest >= WARNING_AT_OR_ABOVE) return 'warning';
	return 'critical';
}

export interface GroupEnergyShare {
	group: DeviceGroup;
	energy: number;
	percentOfTotal: number;
}

export function summarizeGroupEnergy(
	devices: ReadonlyArray<readonly [string, { energyAssigned: number }]>,
	totalEnergy: number
): GroupEnergyShare[] {
	return DEVICE_GROUPS.map((group) => {
		const energy = devices
			.filter(([id]) => groupIdForDevice(id) === group.id)
			.reduce((sum, [, device]) => sum + device.energyAssigned, 0);
		return { group, energy, percentOfTotal: totalEnergy > 0 ? (energy / totalEnergy) * 100 : 0 };
	});
}
