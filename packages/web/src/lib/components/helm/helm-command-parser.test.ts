import { describe, expect, it } from 'vitest';
import { parseHelmCommand } from './helm-command-parser.js';

describe('parseHelmCommand', () => {
	it('parses "FPO <name>" into a FirePhasers command targeting a named object', () => {
		expect(parseHelmCommand('FPO Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Klingon Bird of Prey' } }
		});
	});

	it('parses "FPC <x> <y> <z>" into a FirePhasers command targeting coordinates', () => {
		expect(parseHelmCommand('FPC 1 2 3')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FirePhasers', target: { kind: 'coordinates', position: { x: 1, y: 2, z: 3 } } }
		});
	});

	it('parses "FTO <name>" into a FireTorpedo command targeting a named object', () => {
		expect(parseHelmCommand('FTO Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Klingon Bird of Prey' } }
		});
	});

	it('parses "FTC <x> <y> <z>" into a FireTorpedo command targeting coordinates', () => {
		expect(parseHelmCommand('FTC 4 5 6')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'FireTorpedo', target: { kind: 'coordinates', position: { x: 4, y: 5, z: 6 } } }
		});
	});

	it('parses "SD <location> <level>" into a SetShieldLevel command', () => {
		expect(parseHelmCommand('SD fore 75')).toEqual({
			ok: true,
			command: { module: 'helm', type: 'SetShieldLevel', location: 'fore', level: 75 }
		});
	});

	it('rejects an unknown shield location', () => {
		expect(parseHelmCommand('SD upsidedown 50').ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseHelmCommand('BOGUS').ok).toBe(false);
	});
});
