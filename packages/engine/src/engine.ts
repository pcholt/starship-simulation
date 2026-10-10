import { produce } from 'immer';
import type { Command, CommandResult, WeaponTarget } from './commands.js';
import { ALL_MODULE_NAMES } from './domain/module.js';
import { FULL_HEALTH } from './domain/crew-status.js';
import { shipStation } from './domain/location.js';
import { createInitialWorldState, appendBoundedEvent, type WorldState } from './domain/world-state.js';
import { advancePosition, advanceHeading, advanceWarpSpeed, bearingTo, maximumWarpSpeed } from './domain/navigation.js';
import type { Location } from './domain/location.js';
import { scanCelestialObject, scanCraft, distanceBetween, scanQualityForDistance, type ScanResult } from './domain/sciences.js';
import { advancePhaserCharges, dischargePhaserBank, isWeaponCoverLifted, setWeaponCoverLifted } from './domain/helm.js';
import { DEVICE_GROUP_IDS } from './domain/device-groups.js';
import { advanceEnergyLevels, totalWarpDriveEnergy, allocateEnergy, allocateMinimumEnergyToGroup, setGroupLocked } from './domain/engineering.js';
import { bankLocationForRelativePosition, computePhaserDamage, computeTorpedoDamage } from './domain/combat.js';
import { admitPatient, recoveredHealth } from './domain/medical.js';
import { enqueueMessage, displayNextMessage } from './domain/communications.js';
import { launchTorpedo, advanceTorpedoes, resolveExplosionDamage, TORPEDO_MAX_RANGE, type DamageAssignment } from './domain/torpedo.js';
import type { Craft, Fleet } from './domain/craft.js';
import type { Vector3 } from './domain/vector.js';
import type { EngineEvent, Unsubscribe } from './events.js';
import { createScenarioRuntimeState, dueSteps, type ScenarioScript } from './scenario/scenario.js';

export interface EngineDeps {
	/** Injectable clock; unused by the synchronous engine today but reserved for time-stamped alerts/logging. */
	now?: () => number;
	/** Injectable PRNG, for deterministic tests once modules with randomness (scans, malfunctions) land. */
	rng?: () => number;
	initialState?: WorldState;
}

export interface Engine {
	dispatch(command: Command): CommandResult;
	getState(): Readonly<WorldState>;
	subscribe(listener: (event: EngineEvent) => void): Unsubscribe;
	/** Advances the simulated clock by `deltaMs` and executes any scenario steps that are now due. */
	tick(deltaMs: number): void;
	loadScenario(script: ScenarioScript): void;
	destroy(): void;
}

export function createEngine(deps: EngineDeps = {}): Engine {
	// Routed through `produce` so immer's auto-freeze applies even to the untouched initial
	// state, keeping `getState()` snapshots honestly readonly at runtime, not just by type.
	let state: WorldState = produce(deps.initialState ?? createInitialWorldState(), () => {});
	let nextCraftId = 1;
	let nextTorpedoId = 1;
	const rng = deps.rng ?? Math.random;
	const listeners = new Set<(event: EngineEvent) => void>();

	function scannableEntries(): { name: string; scan: (fromPosition: Vector3) => ScanResult }[] {
		return [
			...state.celestialObjects.map((object) => ({
				name: object.name,
				scan: (fromPosition: Vector3) => scanCelestialObject(object, fromPosition)
			})),
			...state.enemyCraft.map((craft) => ({ name: craft.name, scan: (fromPosition: Vector3) => scanCraft(craft, fromPosition) })),
			...state.federationCraft.map((craft) => ({
				name: craft.name,
				scan: (fromPosition: Vector3) => scanCraft(craft, fromPosition)
			}))
		];
	}

	function emit(event: EngineEvent): void {
		for (const listener of listeners) listener(event);
	}

	function findCraftByName(name: string): { craft: Craft; fleet: Fleet } | undefined {
		const enemy = state.enemyCraft.find((c) => c.name === name);
		if (enemy) return { craft: enemy, fleet: 'enemyCraft' };
		const federation = state.federationCraft.find((c) => c.name === name);
		if (federation) return { craft: federation, fleet: 'federationCraft' };
		return undefined;
	}

	/** Resolves a `Location` to a concrete point, when it names something with a position — used so SetCourse can steer toward it. */
	function resolveDestinationPosition(destination: Location): Vector3 | null {
		if (destination.kind === 'coordinates') return { x: destination.x, y: destination.y, z: destination.z };
		if (destination.kind === 'celestialObject') {
			return state.celestialObjects.find((o) => o.id === destination.id)?.position ?? null;
		}
		if (destination.kind === 'craft') {
			const fleet = destination.craftClass === 'enemy' ? state.enemyCraft : destination.craftClass === 'federation' ? state.federationCraft : null;
			return fleet?.find((c) => c.id === destination.id)?.position ?? null;
		}
		return null;
	}

	const WEAPON_HIT_RADIUS = 5;

	function findCraftNear(position: { x: number; y: number; z: number }): { craft: Craft; fleet: Fleet } | undefined {
		for (const fleet of ['enemyCraft', 'federationCraft'] as const) {
			const craft = state[fleet].find((c) => distanceBetween(c.position, position) <= WEAPON_HIT_RADIUS);
			if (craft) return { craft, fleet };
		}
		return undefined;
	}

	function resolveWeaponTarget(
		target: WeaponTarget
	): { craft: Craft; fleet: Fleet } | { ok: false; reason: string } {
		if (target.kind === 'object') {
			const found = findCraftByName(target.name);
			if (!found) return { ok: false, reason: `No object or craft named "${target.name}"` };
			return found;
		}
		const found = findCraftNear(target.position);
		if (!found) return { ok: false, reason: 'Nothing at those coordinates' };
		return found;
	}

	/** `resolveWeaponTarget` plus the sensor-range gate every weapon (phasers, torpedoes) shares — shared by both `FirePhasers` and `FireTorpedo` so they can't drift apart on it. */
	function resolveInRangeTarget(
		target: WeaponTarget
	): { craft: Craft; fleet: Fleet; distance: number } | { ok: false; reason: string } {
		const resolved = resolveWeaponTarget(target);
		if ('reason' in resolved) return resolved;
		const distance = distanceBetween(state.enterpriseNavigation.position, resolved.craft.position);
		if (scanQualityForDistance(distance) === 'none') return { ok: false, reason: 'Target out of sensor range' };
		return { ...resolved, distance };
	}

	function weaponCoverRefusal(fleet: Fleet, craft: Craft): string | null {
		if (fleet !== 'federationCraft' || isWeaponCoverLifted(state.helm, craft.id)) return null;
		return `The weapons safety cover over ${craft.name} is closed`;
	}

	function closeWeaponCover(craftId: number): void {
		state = produce(state, (draft) => {
			draft.helm = setWeaponCoverLifted(draft.helm, craftId, false);
		});
	}

	function applyDamage(fleet: Fleet, craftId: number, damage: number): void {
		state = produce(state, (draft) => {
			const list = draft[fleet];
			const index = list.findIndex((c) => c.id === craftId);
			if (index === -1) return;
			const nextIntegrity = Math.max(0, list[index]!.hullIntegrity - damage);
			if (nextIntegrity <= 0) {
				list.splice(index, 1);
				draft.helm = setWeaponCoverLifted(draft.helm, craftId, false);
			} else {
				list[index]!.hullIntegrity = nextIntegrity;
			}
		});
		emit({ type: 'StateChanged', paths: [fleet] });
	}

	/** Every craft in both fleets, flattened for `resolveExplosionDamage`'s "who's nearby" check. */
	function allCraft(): { fleet: Fleet; id: number; position: Vector3 }[] {
		return [
			...state.enemyCraft.map((c) => ({ fleet: 'enemyCraft' as const, id: c.id, position: c.position })),
			...state.federationCraft.map((c) => ({ fleet: 'federationCraft' as const, id: c.id, position: c.position }))
		];
	}

	function applyDamageAssignments(assignments: DamageAssignment[]): void {
		for (const assignment of assignments) applyDamage(assignment.fleet, assignment.craftId, assignment.amount);
	}

	// A single tick can resolve several torpedo explosions/weapon fires at once, so these push onto
	// a short bounded history (see appendBoundedEvent) rather than overwrite a single "last event"
	// slot — a singleton would silently lose every event but the final one from the same tick.
	function recordWeaponFire(weapon: 'phaser' | 'torpedo', from: Vector3, to: Vector3): void {
		state = produce(state, (draft) => {
			draft.weaponFireEvents = appendBoundedEvent(draft.weaponFireEvents, { weapon, from, to, atMs: draft.simulatedTimeMs });
		});
		emit({ type: 'StateChanged', paths: ['weaponFireEvents'] });
	}

	function recordTorpedoExplosion(position: Vector3): void {
		state = produce(state, (draft) => {
			draft.torpedoExplosionEvents = appendBoundedEvent(draft.torpedoExplosionEvents, { position, atMs: draft.simulatedTimeMs });
		});
		emit({ type: 'StateChanged', paths: ['torpedoExplosionEvents'] });
	}

	function applyCommand(command: Command): CommandResult {
		switch (command.type) {
			case 'Initialize':
			case 'Execute':
			case 'Halt': {
				const runState = command.type === 'Execute' ? 'running' : 'halted';
				const targets = command.target === 'all' ? ALL_MODULE_NAMES : [command.target];
				state = produce(state, (draft) => {
					for (const name of targets) draft.modules[name] = runState;
				});
				emit({ type: 'StateChanged', paths: targets.map((name) => `modules.${name}`) });
				return { ok: true };
			}
			case 'CreateEnemyCraft': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.enemyCraft.push({
						id,
						name: command.name,
						mission: command.mission,
						position: command.position,
						hullIntegrity: 100,
						speed: command.speed ?? 0
					});
				});
				emit({ type: 'StateChanged', paths: ['enemyCraft'] });
				return { ok: true };
			}
			case 'CreateFederationCraft': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.federationCraft.push({
						id,
						name: command.name,
						mission: command.mission,
						position: command.position,
						hullIntegrity: 100,
						speed: command.speed ?? 0
					});
				});
				emit({ type: 'StateChanged', paths: ['federationCraft'] });
				return { ok: true };
			}
			case 'CreateCelestialObject': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.celestialObjects.push({
						id,
						name: command.name,
						position: command.position,
						radius: command.radius,
						mass: command.mass
					});
				});
				emit({ type: 'StateChanged', paths: ['celestialObjects'] });
				return { ok: true };
			}
			case 'RunScenario': {
				if (!state.scenario) return { ok: false, reason: 'No scenario loaded' };
				state = produce(state, (draft) => {
					draft.scenario!.runState = 'running';
				});
				emit({ type: 'StateChanged', paths: ['scenario.runState'] });
				return { ok: true };
			}
			case 'HaltScenario': {
				if (!state.scenario) return { ok: false, reason: 'No scenario loaded' };
				state = produce(state, (draft) => {
					draft.scenario!.runState = 'halted';
				});
				emit({ type: 'StateChanged', paths: ['scenario.runState'] });
				return { ok: true };
			}
			case 'SetDirection': {
				// Sets the *intended* heading only — velocity's actual angles turn toward it over
				// time in tick(), at a rate that depends on speed, rather than snapping instantly. The ship
				// only steers in the x/y plane, so the x/z (pitch) angle is always held at 0.
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.intendedDirection = { xyAngleDeg: command.xyAngleDeg, xzAngleDeg: 0 };
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.intendedDirection'] });
				return { ok: true };
			}
			case 'SetSpeed': {
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.intendedWarpSpeed = command.warpSpeed;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.intendedWarpSpeed'] });
				return { ok: true };
			}
			case 'SetCourse': {
				// Setting a course also turns the ship toward it — resolved once, at dispatch time,
				// rather than continuously re-aiming at a moving target on every tick.
				const targetPosition = resolveDestinationPosition(command.destination);
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.destination = command.destination;
					if (targetPosition) {
						draft.enterpriseNavigation.intendedDirection = {
							xyAngleDeg: bearingTo(draft.enterpriseNavigation.position, targetPosition).xyAngleDeg,
							xzAngleDeg: 0
						};
					}
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.destination', 'enterpriseNavigation.intendedDirection'] });
				return { ok: true };
			}
			case 'ScanObject': {
				const entry = scannableEntries().find((e) => e.name === command.name);
				if (!entry) return { ok: false, reason: `No object or craft named "${command.name}"` };
				const result = entry.scan(state.enterpriseNavigation.position);
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult'] });
				return { ok: true };
			}
			case 'ScanArea': {
				const entries = scannableEntries();
				if (entries.length === 0) return { ok: false, reason: 'Nothing detected in this area' };
				const nearest = entries
					.map((e) => ({ entry: e, distance: distanceBetween(e.scan(command.position).position, command.position) }))
					.sort((a, b) => a.distance - b.distance)[0]!.entry;
				const result = nearest.scan(state.enterpriseNavigation.position);
				const sequence = (state.lastScanAreaEvent?.sequence ?? 0) + 1;
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
					draft.lastScanAreaEvent = { position: command.position, sequence, atMs: state.simulatedTimeMs };
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult', 'lastScanAreaEvent'] });
				return { ok: true };
			}
			case 'ScanRandom': {
				const entries = scannableEntries();
				if (entries.length === 0) return { ok: false, reason: 'Nothing detected in this area' };
				const entry = entries[Math.floor(rng() * entries.length)]!;
				const result = entry.scan(state.enterpriseNavigation.position);
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult'] });
				return { ok: true };
			}
			case 'SetEnergyAllocation': {
				if (!(command.deviceId in state.engineering.devices)) {
					return { ok: false, reason: `No device named "${command.deviceId}"` };
				}
				const nextEngineering = allocateEnergy(state.engineering, command.deviceId, command.amount);
				state = produce(state, (draft) => {
					draft.engineering = nextEngineering;
				});
				emit({ type: 'StateChanged', paths: ['engineering.devices'] });
				return { ok: true };
			}
			case 'SetGroupToMinimumEnergy': {
				if (!DEVICE_GROUP_IDS.includes(command.group)) {
					return { ok: false, reason: `No device group named "${command.group}"` };
				}
				const nextEngineering = allocateMinimumEnergyToGroup(state.engineering, command.group);
				state = produce(state, (draft) => {
					draft.engineering = nextEngineering;
				});
				emit({ type: 'StateChanged', paths: ['engineering.devices'] });
				return { ok: true };
			}
			case 'SetEnergyGroupLocked': {
				if (!DEVICE_GROUP_IDS.includes(command.group)) {
					return { ok: false, reason: `No device group named "${command.group}"` };
				}
				const nextEngineering = setGroupLocked(state.engineering, command.group, command.locked);
				state = produce(state, (draft) => {
					draft.engineering = nextEngineering;
				});
				emit({ type: 'StateChanged', paths: ['engineering.lockedGroups'] });
				return { ok: true };
			}
			case 'FirePhasers': {
				const resolved = resolveInRangeTarget(command.target);
				if ('reason' in resolved) return { ok: false, reason: resolved.reason };
				const { craft, fleet, distance } = resolved;
				const refusal = weaponCoverRefusal(fleet, craft);
				if (refusal) return { ok: false, reason: refusal };
				const bank = bankLocationForRelativePosition(state.enterpriseNavigation.position, craft.position);
				const phaserBank = state.engineering.devices[`phaser-${bank}`];
				if (!phaserBank || phaserBank.functionalStatus <= 0) {
					return { ok: false, reason: `Phaser bank (${bank}) is not operational` };
				}
				// The target's own shields aren't modeled yet (only the Enterprise's device catalogue is) — treat non-Enterprise craft as unshielded.
				const charge = state.helm.phaserCharge[bank];
				if (charge <= 0) return { ok: false, reason: `Phaser bank (${bank}) has no charge` };
				const damage = computePhaserDamage(distance, 0) * charge;
				applyDamage(fleet, craft.id, damage);
				state = produce(state, (draft) => {
					draft.helm = dischargePhaserBank(draft.helm, bank);
				});
				closeWeaponCover(craft.id);
				recordWeaponFire('phaser', state.enterpriseNavigation.position, craft.position);
				return { ok: true };
			}
			case 'FireTorpedo': {
				const resolved = resolveInRangeTarget(command.target);
				if ('reason' in resolved) return { ok: false, reason: resolved.reason };
				const { craft, fleet, distance } = resolved;
				const refusal = weaponCoverRefusal(fleet, craft);
				if (refusal) return { ok: false, reason: refusal };
				if (distance > TORPEDO_MAX_RANGE) return { ok: false, reason: 'Target out of torpedo range' };
				const hasFunctionalTube = Object.entries(state.engineering.devices).some(
					([id, device]) => id.startsWith('torpedoTube-') && device.functionalStatus > 0
				);
				if (!hasFunctionalTube) return { ok: false, reason: 'No functional torpedo tubes' };
				const torpedo = launchTorpedo(
					state.enterpriseNavigation.velocity,
					state.enterpriseNavigation.position,
					{ fleet, id: craft.id },
					state.simulatedTimeMs,
					nextTorpedoId++
				);
				state = produce(state, (draft) => {
					draft.torpedoes.push(torpedo);
				});
				closeWeaponCover(craft.id);
				emit({ type: 'StateChanged', paths: ['torpedoes'] });
				recordWeaponFire('torpedo', state.enterpriseNavigation.position, craft.position);
				return { ok: true };
			}
			case 'SetWeaponCover': {
				if (!state.federationCraft.some((craft) => craft.id === command.craftId)) {
					return { ok: false, reason: `No Federation craft with id ${command.craftId}` };
				}
				state = produce(state, (draft) => {
					draft.helm = setWeaponCoverLifted(draft.helm, command.craftId, command.lifted);
				});
				emit({ type: 'StateChanged', paths: ['helm'] });
				return { ok: true };
			}
			case 'SetShieldLevel': {
				const deviceId = `shield-${command.location}`;
				const level = Math.min(100, Math.max(0, command.level));
				state = produce(state, (draft) => {
					draft.engineering.devices[deviceId]!.operationalStatus = level;
				});
				emit({ type: 'StateChanged', paths: [`engineering.devices.${deviceId}`] });
				return { ok: true };
			}
			case 'AdmitPatient': {
				if (!state.crewStatus.some((member) => member.id === command.personnelId)) {
					return { ok: false, reason: `No crew member with id ${command.personnelId}` };
				}
				const result = admitPatient(state.medical, { personnelId: command.personnelId });
				if (!result.ok) return { ok: false, reason: result.reason };
				state = produce(state, (draft) => {
					draft.medical = result.state;
					const member = draft.crewStatus.find((candidate) => candidate.id === command.personnelId)!;
					member.location = shipStation('intensiveCareUnit');
					if (command.health !== undefined) member.health = command.health;
				});
				emit({ type: 'StateChanged', paths: ['medical.icu', 'crewStatus'] });
				return { ok: true };
			}
			case 'ReceiveMessage': {
				state = produce(state, (draft) => {
					draft.communications = enqueueMessage(draft.communications, command.from, command.text);
				});
				emit({ type: 'StateChanged', paths: ['communications.messageQueue'] });
				return { ok: true };
			}
			case 'DisplayNextMessage': {
				const { state: nextComms } = displayNextMessage(state.communications);
				state = produce(state, (draft) => {
					draft.communications = nextComms;
				});
				emit({ type: 'StateChanged', paths: ['communications'] });
				return { ok: true };
			}
			case 'SendDistressMessage': {
				state = produce(state, (draft) => {
					draft.communications.log.push('Distress message sent');
				});
				emit({ type: 'AlertRaised', module: 'communications', severity: 'critical', message: 'Distress message sent' });
				emit({ type: 'StateChanged', paths: ['communications.log'] });
				return { ok: true };
			}
			case 'RequestPersonnelMovement': {
				state = produce(state, (draft) => {
					draft.communications.log.push(`Requested movement of ${command.personnelName} to ${command.destination.kind}`);
				});
				emit({ type: 'StateChanged', paths: ['communications.log'] });
				return { ok: true };
			}
			case 'RequestCargoMovement': {
				state = produce(state, (draft) => {
					draft.communications.log.push(`Requested movement of ${command.cargoType} to ${command.destination.kind}`);
				});
				emit({ type: 'StateChanged', paths: ['communications.log'] });
				return { ok: true };
			}
			case 'RequestAid': {
				const craft = state.federationCraft.find((c) => c.name === command.federationCraftName);
				if (!craft) return { ok: false, reason: `No Federation craft named "${command.federationCraftName}"` };
				state = produce(state, (draft) => {
					draft.communications.log.push(`Requested aid from ${command.federationCraftName}`);
				});
				emit({ type: 'StateChanged', paths: ['communications.log'] });
				return { ok: true };
			}
			case 'SendPeaceOffer': {
				const craft = state.enemyCraft.find((c) => c.name === command.craftName);
				if (!craft) return { ok: false, reason: `No enemy craft named "${command.craftName}"` };
				state = produce(state, (draft) => {
					draft.communications.log.push(`Peace offer sent to ${command.craftName}`);
				});
				emit({ type: 'StateChanged', paths: ['communications.log'] });
				return { ok: true };
			}
			case 'AcceptPeaceOffer': {
				const craft = state.enemyCraft.find((c) => c.name === command.craftName);
				if (!craft) return { ok: false, reason: `No enemy craft named "${command.craftName}"` };
				state = produce(state, (draft) => {
					draft.enemyCraft.find((c) => c.name === command.craftName)!.mission = 'peace';
					draft.communications.log.push(`Peace offer from ${command.craftName} accepted`);
				});
				emit({ type: 'StateChanged', paths: ['enemyCraft', 'communications.log'] });
				return { ok: true };
			}
			case 'RejectPeaceOffer': {
				const craft = state.enemyCraft.find((c) => c.name === command.craftName);
				if (!craft) return { ok: false, reason: `No enemy craft named "${command.craftName}"` };
				state = produce(state, (draft) => {
					draft.communications.log.push(`Peace offer from ${command.craftName} rejected`);
				});
				emit({ type: 'StateChanged', paths: ['communications.log'] });
				return { ok: true };
			}
			case 'SetShuttlecraftMission': {
				const shuttle = state.engineering.shuttlecraft.find((s) => s.id === command.shuttlecraftId);
				if (!shuttle) return { ok: false, reason: `No shuttlecraft numbered ${command.shuttlecraftId}` };
				state = produce(state, (draft) => {
					const draftShuttle = draft.engineering.shuttlecraft.find((s) => s.id === command.shuttlecraftId)!;
					draftShuttle.mission = command.mission;
					draftShuttle.destination = command.destination ?? null;
				});
				emit({ type: 'StateChanged', paths: ['engineering.shuttlecraft'] });
				return { ok: true };
			}
		}
	}

	return {
		dispatch(command) {
			return applyCommand(command);
		},
		getState() {
			return state;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		tick(deltaMs) {
			let torpedoExplosions: ReturnType<typeof advanceTorpedoes>['explosions'] = [];
			state = produce(state, (draft) => {
				draft.simulatedTimeMs += deltaMs;
				draft.engineering = advanceEnergyLevels(draft.engineering, deltaMs);
				draft.helm = advancePhaserCharges(draft.helm, draft.engineering.devices, deltaMs);
				if (draft.modules.navigation === 'running') {
					draft.enterpriseNavigation.velocity.warpSpeed = advanceWarpSpeed(
						draft.enterpriseNavigation.velocity.warpSpeed,
						Math.min(draft.enterpriseNavigation.intendedWarpSpeed, maximumWarpSpeed(totalWarpDriveEnergy(draft.engineering.devices))),
						deltaMs
					);
					draft.enterpriseNavigation.velocity = advanceHeading(draft.enterpriseNavigation, deltaMs);
					draft.enterpriseNavigation.position = advancePosition(draft.enterpriseNavigation, deltaMs);
				}
				if (draft.modules.medical === 'running') {
					const icuFunctionalStatus = draft.engineering.devices.intensiveCareUnit!.functionalStatus;
					draft.medical.icu = draft.medical.icu.map((patient) => {
						if (!patient) return null;
						const member = draft.crewStatus.find((candidate) => candidate.id === patient.personnelId)!;
						member.health = recoveredHealth(member.health, { icuFunctionalStatus, deltaMs });
						if (member.health >= FULL_HEALTH) member.location = shipStation('crewQuarters');
						return member.health <= 0 || member.health >= FULL_HEALTH ? null : patient;
					});
				}
				if (draft.scenario?.runState === 'running') {
					draft.scenario.elapsedMs += deltaMs;
				}
				// Looking up a torpedo's target by fleet/id off `draft` here (rather than passing `draft`
				// itself into torpedo.ts) keeps the batch-advance logic a pure, engine-independent
				// function, testable without an Engine or Immer.
				const findTarget = (fleet: Fleet, id: number) => {
					const craft = draft[fleet].find((c) => c.id === id);
					return craft ? { position: { x: craft.position.x, y: craft.position.y, z: craft.position.z }, speed: craft.speed } : undefined;
				};
				const result = advanceTorpedoes(draft.torpedoes, findTarget, deltaMs, draft.simulatedTimeMs, rng);
				draft.torpedoes = result.torpedoes;
				torpedoExplosions = result.explosions;
			});
			if (torpedoExplosions.length > 0) {
				const directHitDamage = computeTorpedoDamage(0);
				const nearbyCraft = allCraft();
				for (const explosion of torpedoExplosions) {
					applyDamageAssignments(resolveExplosionDamage(explosion, nearbyCraft, directHitDamage));
					recordTorpedoExplosion(explosion.position);
				}
			}
			if (!state.scenario) return;
			const steps = dueSteps(state.scenario);
			if (steps.length === 0) return;
			state = produce(state, (draft) => {
				draft.scenario!.nextStepIndex += steps.length;
			});
			for (const step of steps) {
				applyCommand(step.command);
				emit({ type: 'ScenarioStepExecuted', atMs: step.atMs, command: step.command });
			}
		},
		loadScenario(script) {
			state = produce(state, (draft) => {
				draft.scenario = createScenarioRuntimeState(script);
			});
			emit({ type: 'StateChanged', paths: ['scenario'] });
		},
		destroy() {
			listeners.clear();
		}
	};
}
