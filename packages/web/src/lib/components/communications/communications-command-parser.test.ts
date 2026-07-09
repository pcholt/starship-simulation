import { describe, expect, it } from 'vitest';
import { parseCommunicationsCommand } from './communications-command-parser.js';

describe('parseCommunicationsCommand', () => {
	it('parses "DM" into a DisplayNextMessage command', () => {
		expect(parseCommunicationsCommand('DM')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'DisplayNextMessage' }
		});
	});

	it('parses "SD" into a SendDistressMessage command', () => {
		expect(parseCommunicationsCommand('SD')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'SendDistressMessage' }
		});
	});

	it('parses "RP <name>, <ship station>" into a RequestPersonnelMovement command', () => {
		expect(parseCommunicationsCommand('RP Ensign Kim, sciencesLab')).toEqual({
			ok: true,
			command: {
				module: 'communications',
				type: 'RequestPersonnelMovement',
				personnelName: 'Ensign Kim',
				destination: { kind: 'shipStation', station: 'sciencesLab' }
			}
		});
	});

	it('parses "RC <cargo type>, <ship station>" into a RequestCargoMovement command', () => {
		expect(parseCommunicationsCommand('RC medical supplies, medicalResearchLab')).toEqual({
			ok: true,
			command: {
				module: 'communications',
				type: 'RequestCargoMovement',
				cargoType: 'medical supplies',
				destination: { kind: 'shipStation', station: 'medicalResearchLab' }
			}
		});
	});

	it('parses "RA <federation craft name>" into a RequestAid command', () => {
		expect(parseCommunicationsCommand('RA USS Excelsior')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'RequestAid', federationCraftName: 'USS Excelsior' }
		});
	});

	it('parses "SPO <craft name>" into a SendPeaceOffer command', () => {
		expect(parseCommunicationsCommand('SPO Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'SendPeaceOffer', craftName: 'Klingon Bird of Prey' }
		});
	});

	it('parses "APO <craft name>" into an AcceptPeaceOffer command', () => {
		expect(parseCommunicationsCommand('APO Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'AcceptPeaceOffer', craftName: 'Klingon Bird of Prey' }
		});
	});

	it('parses "RPO <craft name>" into a RejectPeaceOffer command', () => {
		expect(parseCommunicationsCommand('RPO Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'RejectPeaceOffer', craftName: 'Klingon Bird of Prey' }
		});
	});

	it('does not confuse "RP" (personnel movement) with "RPO" (reject peace offer)', () => {
		const result = parseCommunicationsCommand('RP Ensign Kim, sciencesLab');
		expect(result.ok && result.command.type).toBe('RequestPersonnelMovement');
	});

	it('rejects a movement request with an unknown ship station', () => {
		expect(parseCommunicationsCommand('RP Ensign Kim, warpCore').ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseCommunicationsCommand('BOGUS').ok).toBe(false);
	});
});
