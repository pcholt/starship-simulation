import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import CommunicationsStation from './CommunicationsStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('CommunicationsStation', () => {
	it('shows no message before any have been received', async () => {
		const store = setup();
		render(CommunicationsStation, { store });

		await expect.element(page.getByTestId('current-message')).toHaveTextContent('NONE');
	});

	it('displays the next message by clicking a button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({ module: 'communications', type: 'ReceiveMessage', from: 'Starbase 12', text: 'Report status' });
		render(CommunicationsStation, { store });

		await page.getByRole('button', { name: 'Display Next Message' }).click();

		await expect.element(page.getByTestId('current-message')).toHaveTextContent('Starbase 12');
	});

	it('sends a distress message by clicking a button (point-and-click, no typed command)', async () => {
		const store = setup();
		render(CommunicationsStation, { store });

		await page.getByRole('button', { name: 'Send Distress Signal' }).click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('Distress message sent');
	});

	it('requests aid from a listed federation craft by clicking its button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateFederationCraft',
			name: 'USS Excelsior',
			mission: 'patrol',
			position: { x: 10, y: 0, z: 0 }
		});
		render(CommunicationsStation, { store });

		await page.getByTestId('request-aid-USS Excelsior').click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('USS Excelsior');
	});

	it('sends a peace offer to a listed enemy craft by clicking its button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 10, y: 0, z: 0 }
		});
		render(CommunicationsStation, { store });

		await page.getByTestId('send-peace-offer-Klingon Bird of Prey').click();

		await expect.element(page.getByTestId('comms-log')).toHaveTextContent('Klingon Bird of Prey');
	});

	describe('crew roster', () => {
		it('lists all 200 crew, as Medical does', async () => {
			render(CommunicationsStation, { store: setup() });

			await expect.element(page.getByTestId('crew-summary')).toHaveTextContent('200 crew');
			expect(page.getByTestId('crew-roster').element().querySelectorAll('tbody tr')).toHaveLength(200);
		});

		it('filters by name', async () => {
			render(CommunicationsStation, { store: setup() });

			await page.getByLabelText('Search crew by name').fill('Aiko Bianchi');

			expect(page.getByTestId('crew-roster').element().querySelectorAll('tbody tr')).toHaveLength(1);
		});
	});

	describe('cargo manifest', () => {
		function storeWithShipPlanetAndStarbase() {
			const store = setup();
			store.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Excelsior', mission: 'patrol', position: { x: 100, y: 0, z: 0 } });
			store.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'Starbase 12', mission: 'none', position: { x: 200, y: 0, z: 0 }, kind: 'starbase' });
			store.dispatch({ module: 'controller', type: 'CreateCelestialObject', name: 'Rigel VII', position: { x: 300, y: 0, z: 0 }, radius: 6000, mass: 1 });
			return store;
		}

		it('shows the Enterprise cargo with quantities and where it is stored', async () => {
			render(CommunicationsStation, { store: setup() });

			await expect.element(page.getByTestId('enterprise-cargo-food')).toHaveTextContent('Food');
			await expect.element(page.getByTestId('enterprise-cargo-food')).toHaveTextContent('400');
			await expect.element(page.getByTestId('enterprise-cargo-food')).toHaveTextContent('Food Processing');
		});

		it('says nothing is in communication range when the universe is empty', async () => {
			render(CommunicationsStation, { store: setup() });

			await expect.element(page.getByTestId('no-manifests-in-range')).toBeInTheDocument();
		});

		it('shows the communications range', async () => {
			render(CommunicationsStation, { store: setup() });

			await expect.element(page.getByTestId('comms-range')).toHaveTextContent('1000 units');
		});

		it('lists a Federation ship, a starbase and a planet in range', async () => {
			const store = storeWithShipPlanetAndStarbase();
			render(CommunicationsStation, { store });

			await expect.element(page.getByText('USS Excelsior', { exact: true }).first()).toBeInTheDocument();
			await expect.element(page.getByText('Federation ship · 100 units')).toBeInTheDocument();
			await expect.element(page.getByText('Starbase · 200 units')).toBeInTheDocument();
			await expect.element(page.getByText('Planet · 300 units')).toBeInTheDocument();
		});

		it('shows the cargo a holder is carrying', async () => {
			const store = storeWithShipPlanetAndStarbase();
			await store.dispatch({
				module: 'controller',
				type: 'SetCargo',
				holder: { kind: 'federationCraft', id: store.state.federationCraft[0]!.id },
				cargoType: 'water',
				quantity: 77
			});
			render(CommunicationsStation, { store });

			await expect.element(page.getByTestId(`manifest-federationShip-${store.state.federationCraft[0]!.id}`)).toHaveTextContent('Water');
			await expect.element(page.getByTestId(`manifest-federationShip-${store.state.federationCraft[0]!.id}`)).toHaveTextContent('77');
		});

		it('says a holder with nothing aboard has an empty hold', async () => {
			render(CommunicationsStation, { store: storeWithShipPlanetAndStarbase() });

			await expect.element(page.getByText('Empty hold').first()).toBeInTheDocument();
		});

		it('leaves out a ship that is beyond communication range', async () => {
			const store = setup();
			store.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Distant', mission: 'patrol', position: { x: 5000, y: 0, z: 0 } });
			render(CommunicationsStation, { store });

			await expect.element(page.getByTestId(`manifest-federationShip-${store.state.federationCraft[0]!.id}`)).not.toBeInTheDocument();
		});

		it('shrinks the range when the communications computer loses power, dropping ships that fall out of range', async () => {
			const store = setup();
			store.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Excelsior', mission: 'patrol', position: { x: 800, y: 0, z: 0 } });
			render(CommunicationsStation, { store });
			const manifestId = `manifest-federationShip-${store.state.federationCraft[0]!.id}`;
			await expect.element(page.getByTestId(manifestId)).toBeInTheDocument();

			await store.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'commsComputer', amount: 60 });
			store.tick(120_000);

			await expect.element(page.getByTestId('comms-range')).toHaveTextContent('300 units');
			await expect.element(page.getByTestId(manifestId)).not.toBeInTheDocument();
		});
	});
});
