import { describe, expect, it } from 'vitest';
import { parseControllerCommand } from './controller-command-parser.js';

describe('parseControllerCommand — module lifecycle', () => {
	it('parses "IA" into Initialize all', () => {
		expect(parseControllerCommand('IA')).toEqual({
			ok: true,
			command: { module: 'controller', type: 'Initialize', target: 'all' }
		});
	});

	it('parses "EN" into Execute navigation', () => {
		expect(parseControllerCommand('EN')).toEqual({
			ok: true,
			command: { module: 'controller', type: 'Execute', target: 'navigation' }
		});
	});

	it('parses "HS" into Halt sciences', () => {
		expect(parseControllerCommand('HS')).toEqual({
			ok: true,
			command: { module: 'controller', type: 'Halt', target: 'sciences' }
		});
	});

	it('parses every module letter for Initialize/Execute/Halt', () => {
		const cases: [string, string][] = [
			['IE', 'engineering'],
			['IC', 'communications'],
			['IN', 'navigation'],
			['IS', 'sciences'],
			['IM', 'medical'],
			['IH', 'helm']
		];
		for (const [code, target] of cases) {
			expect(parseControllerCommand(code)).toEqual({
				ok: true,
				command: { module: 'controller', type: 'Initialize', target }
			});
		}
	});
});

describe('parseControllerCommand — scenario control', () => {
	it('parses "R" into RunScenario', () => {
		expect(parseControllerCommand('R')).toEqual({ ok: true, command: { module: 'controller', type: 'RunScenario' } });
	});

	it('parses "H" (alone) into HaltScenario, distinct from "HA" (halt all modules)', () => {
		expect(parseControllerCommand('H')).toEqual({ ok: true, command: { module: 'controller', type: 'HaltScenario' } });
		expect(parseControllerCommand('HA')).toEqual({
			ok: true,
			command: { module: 'controller', type: 'Halt', target: 'all' }
		});
	});
});

describe('parseControllerCommand — creating enemy/federation craft and celestial objects', () => {
	it('parses "CE <name>, <mission>, <x>, <y>, <z>" into CreateEnemyCraft', () => {
		expect(parseControllerCommand('CE Klingon Bird of Prey, unconditionalAttack, 1, 2, 3')).toEqual({
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

	it('parses "CF <name>, <mission>, <x>, <y>, <z>" into CreateFederationCraft', () => {
		expect(parseControllerCommand('CF USS Excelsior, exploration, 0, 0, 0')).toEqual({
			ok: true,
			command: {
				module: 'controller',
				type: 'CreateFederationCraft',
				name: 'USS Excelsior',
				mission: 'exploration',
				position: { x: 0, y: 0, z: 0 }
			}
		});
	});

	it('parses "CC <name>, <x>, <y>, <z>, <radius>, <mass>" into CreateCelestialObject', () => {
		expect(parseControllerCommand('CC Rigel VII, 10, 20, 30, 6000, 5.9e24')).toEqual({
			ok: true,
			command: {
				module: 'controller',
				type: 'CreateCelestialObject',
				name: 'Rigel VII',
				position: { x: 10, y: 20, z: 30 },
				radius: 6000,
				mass: 5.9e24
			}
		});
	});
});

describe('parseControllerCommand — errors', () => {
	it('rejects a bare "I" and points to the scenario panel', () => {
		const result = parseControllerCommand('I');
		expect(result.ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseControllerCommand('BOGUS').ok).toBe(false);
	});

	it('rejects CE with missing fields', () => {
		expect(parseControllerCommand('CE just a name').ok).toBe(false);
	});
});
