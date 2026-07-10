import { describe, expect, it } from 'vitest';
import { isActiveStation, STATION_NAV_ITEMS } from './station-nav-items.js';

describe('STATION_NAV_ITEMS', () => {
	it('includes exactly the seven bridge stations', () => {
		expect(STATION_NAV_ITEMS.map((s) => s.id)).toEqual([
			'controller',
			'navigation',
			'sciences',
			'engineering',
			'helm',
			'medical',
			'communications'
		]);
	});

	it('gives every station a distinct accent variable', () => {
		const accentVars = STATION_NAV_ITEMS.map((s) => s.accentVar);
		expect(new Set(accentVars).size).toBe(accentVars.length);
	});
});

describe('isActiveStation', () => {
	it('matches the exact station route', () => {
		expect(isActiveStation('/station/navigation', 'navigation')).toBe(true);
	});

	it('matches a nested station route', () => {
		expect(isActiveStation('/station/navigation/detail', 'navigation')).toBe(true);
	});

	it('does not match a different station', () => {
		expect(isActiveStation('/station/navigation', 'helm')).toBe(false);
	});

	it('does not match a station whose id is a prefix of another (no false positive)', () => {
		expect(isActiveStation('/station/helm', 'he')).toBe(false);
	});

	it('does not match the home page', () => {
		expect(isActiveStation('/', 'navigation')).toBe(false);
	});
});
