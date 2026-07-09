import { describe, expect, it } from 'vitest';
import { parseSciencesCommand } from './sciences-command-parser.js';

describe('parseSciencesCommand', () => {
	it('parses "SSO <name>" into a ScanObject command, preserving name case', () => {
		expect(parseSciencesCommand('SSO Rigel VII')).toEqual({
			ok: true,
			command: { module: 'sciences', type: 'ScanObject', name: 'Rigel VII' }
		});
	});

	it('parses "SA <x> <y> <z>" into a ScanArea command', () => {
		expect(parseSciencesCommand('SA 1 2 3')).toEqual({
			ok: true,
			command: { module: 'sciences', type: 'ScanArea', position: { x: 1, y: 2, z: 3 } }
		});
	});

	it('parses "SR" into a ScanRandom command', () => {
		expect(parseSciencesCommand('SR')).toEqual({
			ok: true,
			command: { module: 'sciences', type: 'ScanRandom' }
		});
	});

	it('rejects an unrecognized command', () => {
		expect(parseSciencesCommand('BOGUS').ok).toBe(false);
	});

	it('rejects "SA" with non-numeric coordinates', () => {
		expect(parseSciencesCommand('SA a b c').ok).toBe(false);
	});
});
