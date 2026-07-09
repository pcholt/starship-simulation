import { describe, expect, it } from 'vitest';
import { parseHelmCommand } from './helm-command-parser.js';

describe('parseHelmCommand', () => {
	it('parses "F P O <name>" into a FirePhasers command targeting a named object', () => {
		expect(parseHelmCommand('F P O Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Klingon Bird of Prey' } }
		});
	});

	it('parses "F P C <x> <y> <z>" into a FirePhasers command targeting coordinates', () => {
		expect(parseHelmCommand('F P C 1 2 3')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position: { x: 1, y: 2, z: 3 } } }
		});
	});

	it('parses "F T O <name>" into a FireTorpedo command targeting a named object', () => {
		expect(parseHelmCommand('F T O Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Klingon Bird of Prey' } }
		});
	});

	it('parses "F T C <x> <y> <z>" into a FireTorpedo command targeting coordinates', () => {
		expect(parseHelmCommand('F T C 4 5 6')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'coordinates', position: { x: 4, y: 5, z: 6 } } }
		});
	});

	it('parses "S D <location> <level>" into a SetShieldLevel command', () => {
		expect(parseHelmCommand('S D fore 75')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'SetShieldLevel', location: 'fore', level: 75 }
		});
	});

	it('rejects an unknown shield location', () => {
		expect(parseHelmCommand('S D upsidedown 50').ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseHelmCommand('BOGUS').ok).toBe(false);
	});
});
