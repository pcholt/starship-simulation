import { describe, expect, it } from 'vitest';
import type { CelestialObject, Craft } from '@starship/engine';
import { buildSetCargoCommand, createEmptySetCargoForm, listCargoHolders } from './set-cargo-command';

const ship: Craft = { id: 7, name: 'USS Excelsior', mission: 'patrol', position: { x: 0, y: 0, z: 0 }, hullIntegrity: 100, speed: 0, cargo: [] };
const base: Craft = { ...ship, id: 8, name: 'Starbase 12', kind: 'starbase' };
const planet: CelestialObject = { id: 9, name: 'Rigel VII', position: { x: 0, y: 0, z: 0 }, radius: 1, mass: 1, cargo: [] };

describe('listCargoHolders', () => {
	it('always offers the Enterprise first', () => {
		expect(listCargoHolders([], [])[0]).toEqual({ key: 'enterprise', label: 'Enterprise', holder: { kind: 'enterprise' } });
	});

	it('offers each Federation ship and starbase, saying which it is', () => {
		const labels = listCargoHolders([ship, base], []).map((option) => option.label);

		expect(labels).toEqual(['Enterprise', 'USS Excelsior (ship)', 'Starbase 12 (starbase)']);
	});

	it('offers each planet', () => {
		expect(listCargoHolders([], [planet])[1]).toEqual({
			key: 'celestialObject:9',
			label: 'Rigel VII (planet)',
			holder: { kind: 'celestialObject', id: 9 }
		});
	});

	it('gives a ship and a planet with the same id different keys', () => {
		const keys = listCargoHolders([{ ...ship, id: 3 }], [{ ...planet, id: 3 }]).map((option) => option.key);

		expect(new Set(keys).size).toBe(3);
	});
});

describe('buildSetCargoCommand', () => {
	const holders = listCargoHolders([ship], [planet]);

	it('builds a SetCargo command for the Enterprise', () => {
		const result = buildSetCargoCommand({ holderKey: 'enterprise', cargoType: 'water', quantity: 50 }, holders);

		expect(result).toEqual({ ok: true, command: { module: 'controller', type: 'SetCargo', holder: { kind: 'enterprise' }, cargoType: 'water', quantity: 50 } });
	});

	it('builds a SetCargo command for a Federation craft', () => {
		const result = buildSetCargoCommand({ holderKey: 'federationCraft:7', cargoType: 'food', quantity: 5 }, holders);

		expect(result).toMatchObject({ ok: true, command: { holder: { kind: 'federationCraft', id: 7 } } });
	});

	it('builds a SetCargo command for a planet', () => {
		const result = buildSetCargoCommand({ holderKey: 'celestialObject:9', cargoType: 'oxygen', quantity: 5 }, holders);

		expect(result).toMatchObject({ ok: true, command: { holder: { kind: 'celestialObject', id: 9 } } });
	});

	it('allows a quantity of zero, to empty a type', () => {
		expect(buildSetCargoCommand({ holderKey: 'enterprise', cargoType: 'water', quantity: 0 }, holders).ok).toBe(true);
	});

	it('rejects a holder that is no longer there', () => {
		expect(buildSetCargoCommand({ holderKey: 'federationCraft:99', cargoType: 'water', quantity: 1 }, holders)).toEqual({
			ok: false,
			reason: 'Choose who is holding the cargo'
		});
	});

	it('rejects a missing quantity', () => {
		expect(buildSetCargoCommand({ holderKey: 'enterprise', cargoType: 'water', quantity: null }, holders)).toEqual({
			ok: false,
			reason: 'Enter a cargo quantity of zero or more'
		});
	});

	it('rejects a negative quantity', () => {
		expect(buildSetCargoCommand({ holderKey: 'enterprise', cargoType: 'water', quantity: -3 }, holders).ok).toBe(false);
	});
});

describe('createEmptySetCargoForm', () => {
	it('starts on the Enterprise with the first cargo type', () => {
		expect(createEmptySetCargoForm()).toEqual({ holderKey: 'enterprise', cargoType: 'food', quantity: 0 });
	});
});
