export interface StationNavItem {
	id: string;
	label: string;
	/** CSS custom property name (without `--`) holding this station's LCARS accent color. */
	accentVar: string;
}

export const STATION_NAV_ITEMS: StationNavItem[] = [
	{ id: 'controller', label: 'Controller', accentVar: 'chrome-controller' },
	{ id: 'navigation', label: 'Navigation', accentVar: 'chrome-navigation' },
	{ id: 'sciences', label: 'Sciences', accentVar: 'chrome-sciences' },
	{ id: 'engineering', label: 'Engineering', accentVar: 'chrome-engineering' },
	{ id: 'helm', label: 'Helm', accentVar: 'chrome-helm' },
	{ id: 'medical', label: 'Medical', accentVar: 'chrome-medical' },
	{ id: 'communications', label: 'Communications', accentVar: 'chrome-communications' }
];

/** Whether `pathname` corresponds to the given station's route (`/station/<id>`). */
export function isActiveStation(pathname: string, stationId: string): boolean {
	return pathname === `/station/${stationId}` || pathname.startsWith(`/station/${stationId}/`);
}
