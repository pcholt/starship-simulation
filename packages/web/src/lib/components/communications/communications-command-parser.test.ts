import { describe, expect, it } from 'vitest';
import { parseCommunicationsCommand } from './communications-command-parser.js';

describe('parseCommunicationsCommand', () => {
	it('parses "D M" into a DisplayNextMessage command', () => {
		expect(parseCommunicationsCommand('D M')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'DisplayNextMessage' }
		});
	});

	it('parses "S D" into a SendDistressMessage command', () => {
		expect(parseCommunicationsCommand('S D')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'SendDistressMessage' }
		});
	});

	it('parses "R P <name>, <ship station>" into a RequestPersonnelMovement command', () => {
		expect(parseCommunicationsCommand('R P Ensign Kim, sciencesLab')).toEqual({
			ok: true,
			command: {
				module: 'communications',
				type: 'RequestPersonnelMovement',
				personnelName: 'Ensign Kim',
				destination: { kind: 'shipStation', station: 'sciencesLab' }
			}
		});
	});

	it('parses "R C <cargo type>, <ship station>" into a RequestCargoMovement command', () => {
		expect(parseCommunicationsCommand('R C medical supplies, medicalResearchLab')).toEqual({
			ok: true,
			command: {
				module: 'communications',
				type: 'RequestCargoMovement',
				cargoType: 'medical supplies',
				destination: { kind: 'shipStation', station: 'medicalResearchLab' }
			}
		});
	});

	it('parses "R A <federation craft name>" into a RequestAid command', () => {
		expect(parseCommunicationsCommand('R A USS Excelsior')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'RequestAid', federationCraftName: 'USS Excelsior' }
		});
	});

	it('parses "S P O <craft name>" into a SendPeaceOffer command', () => {
		expect(parseCommunicationsCommand('S P O Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'SendPeaceOffer', craftName: 'Klingon Bird of Prey' }
		});
	});

	it('parses "A P O <craft name>" into an AcceptPeaceOffer command', () => {
		expect(parseCommunicationsCommand('A P O Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'AcceptPeaceOffer', craftName: 'Klingon Bird of Prey' }
		});
	});

	it('parses "R P O <craft name>" into a RejectPeaceOffer command', () => {
		expect(parseCommunicationsCommand('R P O Klingon Bird of Prey')).toEqual({
			ok: true,
			command: { module: 'communications', type: 'RejectPeaceOffer', craftName: 'Klingon Bird of Prey' }
		});
	});

	it('rejects a movement request with an unknown ship station', () => {
		expect(parseCommunicationsCommand('R P Ensign Kim, warpCore').ok).toBe(false);
	});

	it('rejects an unrecognized command', () => {
		expect(parseCommunicationsCommand('BOGUS').ok).toBe(false);
	});
});
