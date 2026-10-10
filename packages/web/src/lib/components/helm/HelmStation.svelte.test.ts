import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import HelmStation from './HelmStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('HelmStation', () => {
	it('lists all four shield locations at their starting level', async () => {
		const store = setup();
		render(HelmStation, { store });

		await expect.element(page.getByTestId('shield-fore-level')).toHaveTextContent('100');
	});

	it('lists all four phaser banks with their functional status (Figure 3.17 PHASERS table), with no top/bottom bank', async () => {
		const store = setup();
		render(HelmStation, { store });

		await expect.element(page.getByTestId('phaser-fore-func')).toBeInTheDocument();
		await expect.element(page.getByTestId('phaser-starboard-func')).toBeInTheDocument();
		await expect.element(page.getByTestId('phaser-top-func')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('phaser-bottom-func')).not.toBeInTheDocument();
	});

	it('lists all six torpedo tubes with their functional status (Figure 3.17 TORPEDO table)', async () => {
		const store = setup();
		render(HelmStation, { store });

		await expect.element(page.getByTestId('torpedo-tube-1-func')).toBeInTheDocument();
		await expect.element(page.getByTestId('torpedo-tube-6-func')).toBeInTheDocument();
	});

	it('sets a shield level via its slider (point-and-click, no typed command)', async () => {
		const store = setup();
		render(HelmStation, { store });

		await page.getByLabelText('Shield Fore').fill('40');

		await expect.element(page.getByTestId('shield-fore-level')).toHaveTextContent('40');
	});

	it('fires phasers at a listed target by clicking its Fire Phasers button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 50, y: 0, z: 0 }
		});
		render(HelmStation, { store });

		await page.getByTestId('fire-phasers-Klingon Bird of Prey').click();

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Klingon Bird of Prey');
	});

	it('shows a target hull-integrity readout that drops after a hit', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 50, y: 0, z: 0 }
		});
		render(HelmStation, { store });

		await expect.element(page.getByTestId('target-hull-1')).toHaveTextContent('100');

		await page.getByTestId('fire-phasers-Klingon Bird of Prey').click();

		await expect.element(page.getByTestId('target-hull-1')).not.toHaveTextContent('100');
	});

	it('fires a torpedo at a listed target by clicking its Fire Torpedo button (point-and-click, no typed command)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 50, y: 0, z: 0 }
		});
		render(HelmStation, { store });

		await page.getByTestId('fire-torpedo-Klingon Bird of Prey').click();

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Klingon Bird of Prey');
	});

	it('fires phasers at the aim-point coordinates via its button (point-and-click)', async () => {
		const store = setup();
		store.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'unconditionalAttack', position: { x: 100, y: 0, z: 0 } });
		render(HelmStation, { store });
		await page.getByLabelText('Aim X').fill('100');

		await page.getByRole('button', { name: 'Fire Phasers at Aim Point' }).click();

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Phasers fired at coordinates (100, 0)');
	});

	it('fires a torpedo at the aim-point coordinates via its button (point-and-click)', async () => {
		const store = setup();
		store.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'unconditionalAttack', position: { x: 40, y: -30, z: 0 } });
		render(HelmStation, { store });
		await page.getByLabelText('Aim X').fill('40');
		await page.getByLabelText('Aim Y').fill('-30');

		await page.getByRole('button', { name: 'Fire Torpedo at Aim Point' }).click();

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Torpedo fired at coordinates (40, -30)');
		expect(store.state.torpedoes).toHaveLength(1);
	});

	it('sets the aim point by clicking the plot', async () => {
		const store = setup();
		render(HelmStation, { store });

		await page.getByTestId('astrogator-svg').click();

		await expect.element(page.getByTestId('aim-x')).toBeInTheDocument();
		await expect.element(page.getByTestId('scan-preview-circle')).toBeInTheDocument();
	});

	it('shows the reason in the Alerts panel when nothing is at the aim point', async () => {
		const store = setup();
		render(HelmStation, { store });

		await page.getByRole('button', { name: 'Fire Phasers at Aim Point' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});

	describe('safety cover over weapons aimed at Federation craft', () => {
		function storeWithFederationCraft() {
			const store = setup();
			store.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Excelsior', mission: 'patrol', position: { x: 40, y: 0, z: 0 } });
			return store;
		}

		it('covers the fire buttons for a Federation craft until the cover is lifted', async () => {
			render(HelmStation, { store: storeWithFederationCraft() });

			await expect.element(page.getByTestId('safety-cover-USS Excelsior')).toHaveAttribute('data-open', 'false');
			expect(page.getByTestId('fire-phasers-USS Excelsior').element().closest('[inert]')).not.toBeNull();
		});

		it('does not fire when the cover is clicked, only lifts it', async () => {
			const store = storeWithFederationCraft();
			render(HelmStation, { store });

			await page.getByTestId('safety-cover-USS Excelsior').click();

			await expect.element(page.getByTestId('weapons-log')).not.toHaveTextContent('USS Excelsior');
			expect(store.state.federationCraft[0]!.hullIntegrity).toBe(100);
		});

		it('fires phasers at the Federation craft once the cover has been lifted', async () => {
			render(HelmStation, { store: storeWithFederationCraft() });
			await page.getByTestId('safety-cover-USS Excelsior').click();

			await page.getByTestId('fire-phasers-USS Excelsior').click();

			await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Phasers fired at USS Excelsior');
		});

		it('closes the cover again after firing', async () => {
			render(HelmStation, { store: storeWithFederationCraft() });
			await page.getByTestId('safety-cover-USS Excelsior').click();

			await page.getByTestId('fire-torpedo-USS Excelsior').click();

			await expect.element(page.getByTestId('safety-cover-USS Excelsior')).toHaveAttribute('data-open', 'false');
		});

		it('does not put a cover over the weapons for an enemy craft', async () => {
			const store = setup();
			store.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'unconditionalAttack', position: { x: 40, y: 0, z: 0 } });
			render(HelmStation, { store });

			await expect.element(page.getByTestId('safety-cover-Raider')).not.toBeInTheDocument();
			expect(page.getByTestId('fire-phasers-Raider').element().closest('[inert]')).toBeNull();
		});

		it('keeps each Federation craft cover independent', async () => {
			const store = storeWithFederationCraft();
			store.dispatch({ module: 'controller', type: 'CreateFederationCraft', name: 'USS Reliant', mission: 'patrol', position: { x: -40, y: 0, z: 0 } });
			render(HelmStation, { store });

			await page.getByTestId('safety-cover-USS Excelsior').click();

			await expect.element(page.getByTestId('safety-cover-USS Reliant')).toHaveAttribute('data-open', 'false');
		});

		it('keeps a lifted cover lifted when the station is closed and opened again', async () => {
			const store = storeWithFederationCraft();
			const first = render(HelmStation, { store });
			await page.getByTestId('safety-cover-USS Excelsior').click();
			first.unmount();

			render(HelmStation, { store });

			await expect.element(page.getByTestId('safety-cover-USS Excelsior')).toHaveAttribute('data-open', 'true');
		});

		it('keeps a closed cover closed when the station is closed and opened again', async () => {
			const store = storeWithFederationCraft();
			const first = render(HelmStation, { store });
			first.unmount();

			render(HelmStation, { store });

			await expect.element(page.getByTestId('safety-cover-USS Excelsior')).toHaveAttribute('data-open', 'false');
		});

		it('shows a cover as lifted when it was lifted from another station using the same shared state', async () => {
			const store = storeWithFederationCraft();
			await store.dispatch({ module: 'helm', type: 'SetWeaponCover', craftId: store.state.federationCraft[0]!.id, lifted: true });

			render(HelmStation, { store });

			await expect.element(page.getByTestId('safety-cover-USS Excelsior')).toHaveAttribute('data-open', 'true');
		});

		it('shows why firing was refused when the Aim Point is on a covered Federation craft', async () => {
			render(HelmStation, { store: storeWithFederationCraft() });
			await page.getByLabelText('Aim X').fill('40');

			await page.getByRole('button', { name: 'Fire Phasers at Aim Point' }).click();

			await expect.element(page.getByRole('alert')).toHaveTextContent('safety cover over USS Excelsior is closed');
		});
	});

	describe('phaser charge', () => {
		function storeWithRaiderAhead() {
			const store = setup();
			store.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'unconditionalAttack', position: { x: 40, y: 0, z: 0 } });
			return store;
		}

		it('shows each phaser bank fully charged at the start', async () => {
			render(HelmStation, { store: setup() });

			await expect.element(page.getByTestId('phaser-fore-charge')).toHaveTextContent('100%');
			await expect.element(page.getByTestId('phaser-starboard-charge')).toHaveTextContent('100%');
		});

		it('drops the charge of the bank that fired to 0%', async () => {
			render(HelmStation, { store: storeWithRaiderAhead() });

			await page.getByTestId('fire-phasers-Raider').click();

			await expect.element(page.getByTestId('phaser-fore-charge')).toHaveTextContent('0%');
			await expect.element(page.getByTestId('phaser-aft-charge')).toHaveTextContent('100%');
		});

		it('shows the charge rising again as time passes', async () => {
			const store = storeWithRaiderAhead();
			render(HelmStation, { store });
			await page.getByTestId('fire-phasers-Raider').click();

			store.tick(10_000);

			await expect.element(page.getByTestId('phaser-fore-charge')).not.toHaveTextContent(/^0%$/);
		});

		it('shows the reason in the Alerts panel when firing a bank with no charge', async () => {
			render(HelmStation, { store: storeWithRaiderAhead() });
			await page.getByTestId('fire-phasers-Raider').click();

			await page.getByTestId('fire-phasers-Raider').click();

			await expect.element(page.getByRole('alert')).toHaveTextContent('Phaser bank (fore) has no charge');
		});

		it('exposes the charge as an accessible meter', async () => {
			render(HelmStation, { store: setup() });

			await expect.element(page.getByLabelText('phaser-fore charge')).toHaveAttribute('aria-valuenow', '100');
		});
	});
});
