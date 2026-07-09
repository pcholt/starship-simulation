import { describe, expect, it } from 'vitest';
import { parseNavigationCommand } from './navigation-command-parser.js';

describe('parseNavigationCommand', () => {
	it('parses "SD <xyAngle> <xzAngle>" into a SetDirection command', () => {
		expect(parseNavigationCommand('SD 45 10')).toEqual({
			ok: true,
			command: { module: 'navigation', type: 'SetDirection', xyAngleDeg: 45, xzAngleDeg: 10 }
		});
	});

	it('parses "SV <speed>" into a SetSpeed command', () => {
		expect(parseNavigationCommand('SV 7')).toEqual({
			ok: true,
			command: { module: 'navigation', type: 'SetSpeed', warpSpeed: 7 }
		});
	});

	it('parses "SCC <x> <y> <z>" into a SetCourse command with coordinates', () => {
		expect(parseNavigationCommand('SCC 1 2 3')).toEqual({
			ok: true,
			command: {
				module: 'navigation',
				type: 'SetCourse',
				destination: { kind: 'coordinates', x: 1, y: 2, z: 3 }
			}
		});
	});

	it('is case-insensitive and tolerates extra whitespace', () => {
		expect(parseNavigationCommand('  sv   7  ')).toEqual({
			ok: true,
			command: { module: 'navigation', type: 'SetSpeed', warpSpeed: 7 }
		});
	});

	it('rejects an unrecognized command with a helpful reason', () => {
		const result = parseNavigationCommand('XYZ');
		expect(result.ok).toBe(false);
	});

	it('rejects SetDirection/SetSpeed/SetCourse-coordinates commands with non-numeric arguments', () => {
		expect(parseNavigationCommand('SV fast').ok).toBe(false);
		expect(parseNavigationCommand('SD forty five').ok).toBe(false);
	});
});
