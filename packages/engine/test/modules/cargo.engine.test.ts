import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine.js';

type TestEngine = ReturnType<typeof createEngine>;

function engineWithShipAndPlanet() {
	const engine = createEngine();
	engine.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Excelsior', mission: 'patrol', position: { x: 10, y: 0, z: 0 } });
	engine.dispatch({ module: 'controller', type: 'CreateCelestialObject', name: 'Rigel VII', position: { x: 20, y: 0, z: 0 }, radius: 6000, mass: 1 });
	return { engine, shipId: engine.getState().federationCraft[0]!.id, planetId: engine.getState().celestialObjects[0]!.id };
}

const enterpriseQuantity = (engine: TestEngine, type: string) => engine.getState().cargo.find((item) => item.type === type)!.quantity;

describe('starting cargo', () => {
	it('stocks the Enterprise with all five kinds of cargo', () => {
		expect(createEngine().getState().cargo).toHaveLength(5);
	});

	it('creates Federation craft and planets with empty holds', () => {
		const { engine } = engineWithShipAndPlanet();

		expect(engine.getState().federationCraft[0]!.cargo).toEqual([]);
		expect(engine.getState().celestialObjects[0]!.cargo).toEqual([]);
	});
});

describe('starbases', () => {
	it('creates an ordinary Federation craft as a ship', () => {
		const { engine } = engineWithShipAndPlanet();

		expect(engine.getState().federationCraft[0]!.kind).toBeUndefined();
	});

	it('creates a Federation craft of kind starbase when asked', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'Starbase 12', mission: 'none', position: { x: 0, y: 0, z: 0 }, kind: 'starbase' });

		expect(engine.getState().federationCraft[0]!.kind).toBe('starbase');
	});
});

describe('SetCargo on the Enterprise', () => {
	it('sets the quantity of one cargo type', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'enterprise' }, cargoType: 'water', quantity: 123 });

		expect(enterpriseQuantity(engine, 'water')).toBe(123);
	});

	it('leaves the other cargo alone', () => {
		const engine = createEngine();
		const foodBefore = enterpriseQuantity(engine, 'food');

		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'enterprise' }, cargoType: 'water', quantity: 123 });

		expect(enterpriseQuantity(engine, 'food')).toBe(foodBefore);
	});

	it('keeps the line when stock reaches zero', () => {
		const engine = createEngine();

		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'enterprise' }, cargoType: 'water', quantity: 0 });

		expect(enterpriseQuantity(engine, 'water')).toBe(0);
		expect(engine.getState().cargo).toHaveLength(5);
	});

	it('refuses a negative quantity', () => {
		const result = createEngine().dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'enterprise' }, cargoType: 'water', quantity: -1 });

		expect(result).toEqual({ ok: false, reason: 'Cargo quantity must be zero or more' });
	});

	it('refuses a quantity that is not a number', () => {
		const result = createEngine().dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'enterprise' }, cargoType: 'water', quantity: Number.NaN });

		expect(result.ok).toBe(false);
	});
});

describe('SetCargo on a Federation craft', () => {
	it('puts cargo in its hold', () => {
		const { engine, shipId } = engineWithShipAndPlanet();

		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'federationCraft', id: shipId }, cargoType: 'food', quantity: 40 });

		expect(engine.getState().federationCraft[0]!.cargo).toEqual([{ type: 'food', quantity: 40 }]);
	});

	it('empties a type again when set to zero', () => {
		const { engine, shipId } = engineWithShipAndPlanet();
		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'federationCraft', id: shipId }, cargoType: 'food', quantity: 40 });

		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'federationCraft', id: shipId }, cargoType: 'food', quantity: 0 });

		expect(engine.getState().federationCraft[0]!.cargo).toEqual([]);
	});

	it('refuses a craft that does not exist', () => {
		const { engine } = engineWithShipAndPlanet();

		const result = engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'federationCraft', id: 9999 }, cargoType: 'food', quantity: 1 });

		expect(result).toEqual({ ok: false, reason: 'No Federation craft with id 9999' });
	});
});

describe('SetCargo on a planet', () => {
	it('puts supplies in its stockpile', () => {
		const { engine, planetId } = engineWithShipAndPlanet();

		engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'celestialObject', id: planetId }, cargoType: 'water', quantity: 80 });

		expect(engine.getState().celestialObjects[0]!.cargo).toEqual([{ type: 'water', quantity: 80 }]);
	});

	it('refuses a planet that does not exist', () => {
		const { engine } = engineWithShipAndPlanet();

		const result = engine.dispatch({ module: 'controller', type: 'SetCargo', holder: { kind: 'celestialObject', id: 9999 }, cargoType: 'water', quantity: 1 });

		expect(result).toEqual({ ok: false, reason: 'No celestial object with id 9999' });
	});
});
