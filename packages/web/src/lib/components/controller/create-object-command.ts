import type { Command } from '@starship/engine';

export type CreatableKind = 'enemyCraft' | 'federationCraft' | 'starbase' | 'celestialObject';

export interface CreateObjectForm {
	kind: CreatableKind;
	name: string;
	mission: string;
	x: number | null;
	y: number | null;
	radius: number | null;
	mass: number | null;
}

export type CreateObjectResult = { ok: true; command: Command } | { ok: false; reason: string };

export const CREATABLE_KIND_LABELS: Record<CreatableKind, string> = {
	enemyCraft: 'Enemy craft',
	federationCraft: 'Federation craft',
	starbase: 'Starbase',
	celestialObject: 'Celestial object'
};

export const SUGGESTED_MISSIONS: Record<'enemyCraft' | 'federationCraft', string[]> = {
	enemyCraft: ['unconditionalAttack', 'patrol'],
	federationCraft: ['exploration', 'patrol', 'distress']
};

export function createEmptyObjectForm(): CreateObjectForm {
	return { kind: 'enemyCraft', name: '', mission: '', x: 0, y: 0, radius: 1000, mass: 1e20 };
}

export function buildCreateObjectCommand(form: CreateObjectForm): CreateObjectResult {
	const name = form.name.trim();
	if (!name) return { ok: false, reason: 'Enter a name for the new object' };
	if (form.x === null || form.y === null) {
		return { ok: false, reason: 'Enter X and Y coordinates for the new object' };
	}
	const position = { x: form.x, y: form.y, z: 0 };

	if (form.kind === 'celestialObject') {
		if (form.radius === null || form.radius <= 0) return { ok: false, reason: 'Enter a radius greater than zero' };
		if (form.mass === null || form.mass <= 0) return { ok: false, reason: 'Enter a mass greater than zero' };
		return { ok: true, command: { module: 'controller', type: 'CreateCelestialObject', name, position, radius: form.radius, mass: form.mass } };
	}

	if (form.kind === 'starbase') {
		return { ok: true, command: { module: 'controller', type: 'CreateFederationCraft', name, mission: 'none', position, kind: 'starbase' } };
	}

	const mission = form.mission.trim();
	if (!mission) return { ok: false, reason: 'Enter a mission for the new craft' };
	const type = form.kind === 'enemyCraft' ? 'CreateEnemyCraft' : 'CreateFederationCraft';
	return { ok: true, command: { module: 'controller', type, name, mission, position } };
}
