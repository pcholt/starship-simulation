import { produce } from 'immer';
import type { Command, CommandResult, WeaponTarget } from './commands.js';
import { ALL_MODULE_NAMES } from './domain/module.js';
import { createInitialWorldState, type WorldState } from './domain/world-state.js';
import { advancePosition } from './domain/navigation.js';
import { scanCelestialObject, scanCraft, distanceBetween, scanQualityForDistance, type ScanResult } from './domain/sciences.js';
import { allocateEnergy } from './domain/engineering.js';
import { bankLocationForRelativePosition, computePhaserDamage, computeTorpedoDamage } from './domain/combat.js';
import { admitPatient, recoverPatient } from './domain/medical.js';
import { enqueueMessage, displayNextMessage } from './domain/communications.js';
import type { Craft } from './domain/craft.js';
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

	function findCraftByName(name: string): { craft: Craft; fleet: 'enemyCraft' | 'federationCraft' } | undefined {
		const enemy = state.enemyCraft.find((c) => c.name === name);
		if (enemy) return { craft: enemy, fleet: 'enemyCraft' };
		const federation = state.federationCraft.find((c) => c.name === name);
		if (federation) return { craft: federation, fleet: 'federationCraft' };
		return undefined;
	}

	const WEAPON_HIT_RADIUS = 5;

	function findCraftNear(position: { x: number; y: number; z: number }): { craft: Craft; fleet: 'enemyCraft' | 'federationCraft' } | undefined {
		for (const fleet of ['enemyCraft', 'federationCraft'] as const) {
			const craft = state[fleet].find((c) => distanceBetween(c.position, position) <= WEAPON_HIT_RADIUS);
			if (craft) return { craft, fleet };
		}
		return undefined;
	}

	function resolveWeaponTarget(
		target: WeaponTarget
	): { craft: Craft; fleet: 'enemyCraft' | 'federationCraft' } | { ok: false; reason: string } {
		if (target.kind === 'object') {
			const found = findCraftByName(target.name);
			if (!found) return { ok: false, reason: `No object or craft named "${target.name}"` };
			return found;
		}
		const found = findCraftNear(target.position);
		if (!found) return { ok: false, reason: 'Nothing at those coordinates' };
		return found;
	}

	function applyDamage(fleet: 'enemyCraft' | 'federationCraft', craftId: number, damage: number): void {
		state = produce(state, (draft) => {
			const list = draft[fleet];
			const index = list.findIndex((c) => c.id === craftId);
			if (index === -1) return;
			const nextIntegrity = Math.max(0, list[index]!.hullIntegrity - damage);
			if (nextIntegrity <= 0) {
				list.splice(index, 1);
			} else {
				list[index]!.hullIntegrity = nextIntegrity;
			}
		});
		emit({ type: 'StateChanged', paths: [fleet] });
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
					draft.enemyCraft.push({ id, name: command.name, mission: command.mission, position: command.position, hullIntegrity: 100 });
				});
				emit({ type: 'StateChanged', paths: ['enemyCraft'] });
				return { ok: true };
			}
			case 'CreateFederationCraft': {
				const id = nextCraftId++;
				state = produce(state, (draft) => {
					draft.federationCraft.push({ id, name: command.name, mission: command.mission, position: command.position, hullIntegrity: 100 });
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
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.velocity.xyAngleDeg = command.xyAngleDeg;
					draft.enterpriseNavigation.velocity.xzAngleDeg = command.xzAngleDeg;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.velocity'] });
				return { ok: true };
			}
			case 'SetSpeed': {
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.velocity.warpSpeed = command.warpSpeed;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.velocity'] });
				return { ok: true };
			}
			case 'SetCourse': {
				state = produce(state, (draft) => {
					draft.enterpriseNavigation.destination = command.destination;
				});
				emit({ type: 'StateChanged', paths: ['enterpriseNavigation.destination'] });
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
				state = produce(state, (draft) => {
					draft.lastScanResult = result;
				});
				emit({ type: 'StateChanged', paths: ['lastScanResult'] });
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
			case 'FirePhasers': {
				const resolved = resolveWeaponTarget(command.target);
				if ('reason' in resolved) return { ok: false, reason: resolved.reason };
				const { craft, fleet } = resolved;
				const distance = distanceBetween(state.enterpriseNavigation.position, craft.position);
				if (scanQualityForDistance(distance) === 'none') return { ok: false, reason: 'Target out of sensor range' };
				const bank = bankLocationForRelativePosition(state.enterpriseNavigation.position, craft.position);
				const phaserBank = state.engineering.devices[`phaser-${bank}`];
				if (!phaserBank || phaserBank.functionalStatus <= 0) {
					return { ok: false, reason: `Phaser bank (${bank}) is not operational` };
				}
				// The target's own shields aren't modeled yet (only the Enterprise's device catalogue is) — treat non-Enterprise craft as unshielded.
				const damage = computePhaserDamage(distance, 0);
				applyDamage(fleet, craft.id, damage);
				return { ok: true };
			}
			case 'FireTorpedo': {
				const resolved = resolveWeaponTarget(command.target);
				if ('reason' in resolved) return { ok: false, reason: resolved.reason };
				const { craft, fleet } = resolved;
				const distance = distanceBetween(state.enterpriseNavigation.position, craft.position);
				if (scanQualityForDistance(distance) === 'none') return { ok: false, reason: 'Target out of sensor range' };
				const hasFunctionalTube = Object.entries(state.engineering.devices).some(
					([id, device]) => id.startsWith('torpedoTube-') && device.functionalStatus > 0
				);
				if (!hasFunctionalTube) return { ok: false, reason: 'No functional torpedo tubes' };
				const damage = computeTorpedoDamage(0);
				applyDamage(fleet, craft.id, damage);
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
				const result = admitPatient(state.medical, {
					personnelId: command.personnelId,
					name: command.name,
					health: command.health
				});
				if (!result.ok) return { ok: false, reason: result.reason };
				state = produce(state, (draft) => {
					draft.medical = result.state;
				});
				emit({ type: 'StateChanged', paths: ['medical.icu'] });
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
			state = produce(state, (draft) => {
				draft.simulatedTimeMs += deltaMs;
				if (draft.modules.navigation === 'running') {
					draft.enterpriseNavigation.position = advancePosition(draft.enterpriseNavigation, deltaMs);
				}
				if (draft.modules.medical === 'running') {
					const icuFunctionalStatus = draft.engineering.devices.intensiveCareUnit!.functionalStatus;
					draft.medical.icu = draft.medical.icu.map((patient) => {
						if (!patient) return null;
						const recovered = recoverPatient(patient, { icuFunctionalStatus, deltaMs });
						return recovered.health <= 0 || recovered.health >= 10 ? null : recovered;
					});
				}
				if (draft.scenario?.runState === 'running') {
					draft.scenario.elapsedMs += deltaMs;
				}
			});
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
