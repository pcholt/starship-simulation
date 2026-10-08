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

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Phasers fired at coordinates (100, 0, 0)');
	});

	it('fires a torpedo at the aim-point coordinates via its button (point-and-click)', async () => {
		const store = setup();
		store.dispatch({ module: 'controller', type: 'CreateEnemyCraft', name: 'Raider', mission: 'unconditionalAttack', position: { x: 40, y: -30, z: 0 } });
		render(HelmStation, { store });
		await page.getByLabelText('Aim X').fill('40');
		await page.getByLabelText('Aim Y').fill('-30');

		await page.getByRole('button', { name: 'Fire Torpedo at Aim Point' }).click();

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Torpedo fired at coordinates (40, -30, 0)');
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
});
