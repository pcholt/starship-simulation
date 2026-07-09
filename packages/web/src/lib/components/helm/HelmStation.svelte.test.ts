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
	it('lists all six shield locations at their starting level', async () => {
		const store = setup();
		render(HelmStation, { store });

		await expect.element(page.getByTestId('shield-fore-level')).toHaveTextContent('100');
	});

	it('updates a shield level after an S D command is entered', async () => {
		const store = setup();
		render(HelmStation, { store });

		await page.getByLabelText('Command input').fill('SD fore 40');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('shield-fore-level')).toHaveTextContent('40');
	});

	it('damages a named target after firing phasers, reflected in the last-fired-at readout', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 50, y: 0, z: 0 }
		});
		render(HelmStation, { store });

		await page.getByLabelText('Command input').fill('FPO Klingon Bird of Prey');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('weapons-log')).toHaveTextContent('Klingon Bird of Prey');
	});

	it('shows an error message when firing at a nonexistent target', async () => {
		const store = setup();
		render(HelmStation, { store });

		await page.getByLabelText('Command input').fill('FPO Nobody');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});
});
