import { describe, expect, it } from 'vitest';
import { parseSciencesCommand } from './sciences-command-parser.js';

describe('parseSciencesCommand', () => {
	it('parses "S S O <name>" into a ScanObject command, preserving name case', () => {
		expect(parseSciencesCommand('S S O Rigel VII')).toEqual({
			ok: true,
			command: { module: 'sciences', type: 'ScanObject', name: 'Rigel VII' }
		});
	});

	it('parses "S A <x> <y> <z>" into a ScanArea command', () => {
		expect(parseSciencesCommand('S A 1 2 3')).toEqual({
			ok: true,
			command: { module: 'sciences', type: 'ScanArea', position: { x: 1, y: 2, z: 3 } }
		});
	});

	it('parses "S R" into a ScanRandom command', () => {
		expect(parseSciencesCommand('S R')).toEqual({
			ok: true,
			command: { module: 'sciences', type: 'ScanRandom' }
		});
	});

	it('rejects an unrecognized command', () => {
		expect(parseSciencesCommand('BOGUS').ok).toBe(false);
	});

	it('rejects "S A" with non-numeric coordinates', () => {
		expect(parseSciencesCommand('S A a b c').ok).toBe(false);
	});
});
