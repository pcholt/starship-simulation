import type { CelestialObject } from './celestial-object.js';
import type { Craft } from './craft.js';
import { ALL_MODULE_NAMES, type ModuleName, type ModuleRunState } from './module.js';
import { createNavigationState, type NavigationState } from './navigation.js';
import { createLifeSupportState, type LifeSupportState, type ScanResult } from './sciences.js';
import { createHelmState, type HelmState } from './helm.js';
import { createEngineeringState, type EngineeringState } from './engineering.js';
import { createMedicalState, type MedicalState } from './medical.js';
import { createCommunicationsState, type CommunicationsState } from './communications.js';
import type { ScenarioRuntimeState } from '../scenario/scenario.js';
import type { Vector3 } from './vector.js';
import type { Torpedo } from './torpedo.js';

/**
 * Records the last successful Scan Area, for a purely presentational purpose: letting other
 * stations (Navigation's Astrogator) flash a marker at the scanned point. `sequence` increments
 * on every event so it's a reliable "did a new one happen" signal even across a full state
 * broadcast/JSON round-trip, where object identity can't be used to detect change.
 */
export interface ScanAreaEvent {
	position: Vector3;
	sequence: number;
	/** `simulatedTimeMs` at the moment of the scan, so a UI that mounts later can tell how stale this event already is. */
	atMs: number;
}

/** Presentational event for a phaser/torpedo firing, so the Astrogator plot can flash a beam line — same `sequence`/`atMs` pattern as `ScanAreaEvent`. */
export interface WeaponFireEvent {
	weapon: 'phaser' | 'torpedo';
	from: Vector3;
	to: Vector3;
	sequence: number;
	atMs: number;
}

/** Presentational event for a torpedo detonating (hit or fuel-out), so the Astrogator plot can flash an impact marker. */
export interface TorpedoExplosionEvent {
	position: Vector3;
	sequence: number;
	atMs: number;
}

/** How many recent weapon-fire/torpedo-explosion events `WorldState` keeps — a torpedo tick can resolve several explosions at once, so a single "last event" slot would silently drop all but the final one; a short bounded history lets the UI notice every one by watching for sequences it hasn't rendered yet. */
export const MAX_TRACKED_WEAPON_EVENTS = 20;

/**
 * Appends a new event to a bounded, sequence-numbered event list — shared by every "recent events"
 * field (`weaponFireEvents`, `torpedoExplosionEvents`, ...) so they can't drift apart on
 * sequencing/capping. The sequence number is derived from the list's own last entry rather than
 * kept as separate state, so it survives being reset from a snapshot (e.g. a saved/resumed game).
 */
export function appendBoundedEvent<T extends { sequence: number }>(events: T[], event: Omit<T, 'sequence'>): T[] {
	const sequence = (events.at(-1)?.sequence ?? 0) + 1;
	const next = [...events, { ...event, sequence } as T];
	return next.length > MAX_TRACKED_WEAPON_EVENTS ? next.slice(next.length - MAX_TRACKED_WEAPON_EVENTS) : next;
}

/** The "common data area" from the book: the single shared state tree every module reads and writes. */
export interface WorldState {
	simulatedTimeMs: number;
	modules: Record<ModuleName, ModuleRunState>;
	enterpriseNavigation: NavigationState;
	lifeSupport: LifeSupportState;
	lastScanResult: ScanResult | null;
	lastScanAreaEvent: ScanAreaEvent | null;
	/** Most recent weapon-fire events, oldest first, capped at `MAX_TRACKED_WEAPON_EVENTS`. */
	weaponFireEvents: WeaponFireEvent[];
	/** Most recent torpedo-explosion events, oldest first, capped at `MAX_TRACKED_WEAPON_EVENTS`. */
	torpedoExplosionEvents: TorpedoExplosionEvent[];
	engineering: EngineeringState;
	helm: HelmState;
	medical: MedicalState;
	communications: CommunicationsState;
	celestialObjects: CelestialObject[];
	enemyCraft: Craft[];
	federationCraft: Craft[];
	torpedoes: Torpedo[];
	scenario: ScenarioRuntimeState | null;
}

export function createInitialWorldState(): WorldState {
	// Every station starts running, as on an active bridge — Halt models a station going offline
	// (damage, a Controller-scripted malfunction), not something the player must switch on to begin.
	const modules = Object.fromEntries(ALL_MODULE_NAMES.map((name) => [name, 'running'])) as Record<
		ModuleName,
		ModuleRunState
	>;
	return {
		simulatedTimeMs: 0,
		modules,
		enterpriseNavigation: createNavigationState(),
		lifeSupport: createLifeSupportState(),
		lastScanResult: null,
		lastScanAreaEvent: null,
		weaponFireEvents: [],
		torpedoExplosionEvents: [],
		engineering: createEngineeringState(),
		helm: createHelmState(),
		medical: createMedicalState(),
		communications: createCommunicationsState(),
		celestialObjects: [],
		enemyCraft: [],
		federationCraft: [],
		torpedoes: [],
		scenario: null
	};
}
