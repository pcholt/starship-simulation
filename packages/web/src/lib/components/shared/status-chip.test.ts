import { describe, expect, it } from 'vitest';
import { runStateToStatus } from './status-chip.js';

describe('runStateToStatus', () => {
	it('maps "running" to ok', () => {
		expect(runStateToStatus('running')).toBe('ok');
	});

	it('maps "halted" to warning, not critical (it is often a deliberate GM action, not an error)', () => {
		expect(runStateToStatus('halted')).toBe('warning');
	});
});
