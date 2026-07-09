import { describe, expect, it, vi } from 'vitest';
import { createEngine } from '../../src/engine.js';

describe('communications message queue', () => {
	it('ReceiveMessage enqueues a message', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'communications', type: 'ReceiveMessage', from: 'Starbase 12', text: 'Report status' });
		expect(engine.getState().communications.messageQueue).toHaveLength(1);
	});

	it('DisplayNextMessage dequeues the oldest message and sets lastDisplayedMessage', () => {
		const engine = createEngine();
		engine.dispatch({ module: 'communications', type: 'ReceiveMessage', from: 'A', text: 'first' });
		engine.dispatch({ module: 'communications', type: 'ReceiveMessage', from: 'B', text: 'second' });
		engine.dispatch({ module: 'communications', type: 'DisplayNextMessage' });
		expect(engine.getState().communications.lastDisplayedMessage).toMatchObject({ from: 'A', text: 'first' });
		expect(engine.getState().communications.messageQueue).toHaveLength(1);
	});
});

describe('communications distress and aid', () => {
	it('SendDistressMessage logs the distress call and raises an alert', () => {
		const engine = createEngine();
		const listener = vi.fn();
		engine.subscribe(listener);
		engine.dispatch({ module: 'communications', type: 'SendDistressMessage' });
		expect(engine.getState().communications.log).toContain('Distress message sent');
		expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'AlertRaised', severity: 'critical' }));
	});

	it('RequestAid fails when no federation craft by that name exists', () => {
		const engine = createEngine();
		const result = engine.dispatch({ module: 'communications', type: 'RequestAid', federationCraftName: 'USS Excelsior' });
		expect(result).toEqual({ ok: false, reason: 'No Federation craft named "USS Excelsior"' });
	});

	it('RequestAid succeeds and logs the request when the craft exists', () => {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateFederationCraft',
			name: 'USS Excelsior',
			mission: 'exploration',
			position: { x: 0, y: 0, z: 0 }
		});
		const result = engine.dispatch({ module: 'communications', type: 'RequestAid', federationCraftName: 'USS Excelsior' });
		expect(result).toEqual({ ok: true });
		expect(engine.getState().communications.log.some((entry) => entry.includes('USS Excelsior'))).toBe(true);
	});
});

describe('communications movement requests', () => {
	it('RequestPersonnelMovement logs the request', () => {
		const engine = createEngine();
		const result = engine.dispatch({
			module: 'communications',
			type: 'RequestPersonnelMovement',
			personnelName: 'Ensign Kim',
			destination: { kind: 'shipStation', station: 'sciencesLab' }
		});
		expect(result).toEqual({ ok: true });
		expect(engine.getState().communications.log.some((entry) => entry.includes('Ensign Kim'))).toBe(true);
	});

	it('RequestCargoMovement logs the request', () => {
		const engine = createEngine();
		const result = engine.dispatch({
			module: 'communications',
			type: 'RequestCargoMovement',
			cargoType: 'medical supplies',
			destination: { kind: 'shipStation', station: 'medicalResearchLab' }
		});
		expect(result).toEqual({ ok: true });
		expect(engine.getState().communications.log.some((entry) => entry.includes('medical supplies'))).toBe(true);
	});
});

describe('communications peace offers', () => {
	function engineWithEnemy() {
		const engine = createEngine();
		engine.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 0, y: 0, z: 0 }
		});
		return engine;
	}

	it('SendPeaceOffer fails when the named enemy craft does not exist', () => {
		const engine = createEngine();
		const result = engine.dispatch({ module: 'communications', type: 'SendPeaceOffer', craftName: 'Nobody' });
		expect(result).toEqual({ ok: false, reason: 'No enemy craft named "Nobody"' });
	});

	it('AcceptPeaceOffer sets the enemy craft mission to peace', () => {
		const engine = engineWithEnemy();
		engine.dispatch({ module: 'communications', type: 'SendPeaceOffer', craftName: 'Klingon Bird of Prey' });
		engine.dispatch({ module: 'communications', type: 'AcceptPeaceOffer', craftName: 'Klingon Bird of Prey' });
		expect(engine.getState().enemyCraft[0]!.mission).toBe('peace');
	});

	it('RejectPeaceOffer leaves the enemy craft mission unchanged', () => {
		const engine = engineWithEnemy();
		engine.dispatch({ module: 'communications', type: 'SendPeaceOffer', craftName: 'Klingon Bird of Prey' });
		engine.dispatch({ module: 'communications', type: 'RejectPeaceOffer', craftName: 'Klingon Bird of Prey' });
		expect(engine.getState().enemyCraft[0]!.mission).toBe('unconditionalAttack');
	});
});
