import { describe, expect, it } from 'vitest';
import { buildCreateObjectCommand, createEmptyObjectForm, type CreateObjectForm } from './create-object-command';

const form = (overrides: Partial<CreateObjectForm>): CreateObjectForm => ({ ...createEmptyObjectForm(), ...overrides });

describe('buildCreateObjectCommand', () => {
	it('builds a CreateEnemyCraft command', () => {
		const result = buildCreateObjectCommand(
			form({ kind: 'enemyCraft', name: 'Klingon Bird of Prey', mission: 'unconditionalAttack', x: 1, y: 2, z: 3 })
		);

		expect(result).toEqual({
			ok: true,
			command: {
				module: 'controller',
				type: 'CreateEnemyCraft',
				name: 'Klingon Bird of Prey',
				mission: 'unconditionalAttack',
				position: { x: 1, y: 2, z: 3 }
			}
		});
	});

	it('builds a CreateFederationCraft command', () => {
		const result = buildCreateObjectCommand(form({ kind: 'federationCraft', name: 'USS Excelsior', mission: 'patrol', x: -5, y: 0, z: 9 }));

		expect(result).toMatchObject({ ok: true, command: { type: 'CreateFederationCraft', name: 'USS Excelsior', position: { x: -5, y: 0, z: 9 } } });
	});

	it('builds a CreateCelestialObject command without needing a mission', () => {
		const result = buildCreateObjectCommand(
			form({ kind: 'celestialObject', name: 'Rigel VII', mission: '', x: 10, y: 0, z: 0, radius: 6000, mass: 5.9e24 })
		);

		expect(result).toEqual({
			ok: true,
			command: { module: 'controller', type: 'CreateCelestialObject', name: 'Rigel VII', position: { x: 10, y: 0, z: 0 }, radius: 6000, mass: 5.9e24 }
		});
	});

	it('trims whitespace from the name', () => {
		const result = buildCreateObjectCommand(form({ name: '  Rigel VII  ', mission: 'patrol' }));

		expect(result).toMatchObject({ ok: true, command: { name: 'Rigel VII' } });
	});

	it('rejects a blank name', () => {
		expect(buildCreateObjectCommand(form({ name: '   ', mission: 'patrol' }))).toEqual({ ok: false, reason: 'Enter a name for the new object' });
	});

	it('rejects a craft without a mission', () => {
		expect(buildCreateObjectCommand(form({ kind: 'enemyCraft', name: 'Raider', mission: '' }))).toEqual({
			ok: false,
			reason: 'Enter a mission for the new craft'
		});
	});

	it('rejects missing coordinates', () => {
		expect(buildCreateObjectCommand(form({ name: 'Raider', mission: 'patrol', y: null }))).toEqual({
			ok: false,
			reason: 'Enter X, Y and Z coordinates for the new object'
		});
	});

	it('rejects a celestial object with no radius', () => {
		expect(buildCreateObjectCommand(form({ kind: 'celestialObject', name: 'Rock', radius: null }))).toEqual({
			ok: false,
			reason: 'Enter a radius greater than zero'
		});
	});

	it('rejects a celestial object with a zero mass', () => {
		expect(buildCreateObjectCommand(form({ kind: 'celestialObject', name: 'Rock', mass: 0 }))).toEqual({
			ok: false,
			reason: 'Enter a mass greater than zero'
		});
	});
});
