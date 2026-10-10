const SECONDS_TO_FULL_CHARGE_AT_FULL_POWER = 6;
const MINIMUM_POWER_FRACTION_TO_KEEP_CHARGE = 0.1;
const MINIMUM_CHARGE = 0;
const MAXIMUM_CHARGE = 1;

/**
 * Moves a phaser bank's charge (0 to 1) over `deltaMs` given the bank's power as a fraction of its
 * nominal maximum. At full power the charge fills in 6 seconds, and proportionally slower at lower
 * power. Below 10% power the charge cannot be kept and drains at the same rate a full-power bank fills.
 */
export function advancePhaserCharge(charge: number, powerFraction: number, deltaMs: number): number {
	const seconds = deltaMs / 1000;
	const fullPowerChargePerSecond = 1 / SECONDS_TO_FULL_CHARGE_AT_FULL_POWER;
	const chargeKept = powerFraction >= MINIMUM_POWER_FRACTION_TO_KEEP_CHARGE;
	const chargeChange = chargeKept ? powerFraction * fullPowerChargePerSecond * seconds : -fullPowerChargePerSecond * seconds;
	return Math.min(MAXIMUM_CHARGE, Math.max(MINIMUM_CHARGE, charge + chargeChange));
}
