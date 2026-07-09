import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import ControllerStation from './ControllerStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('ControllerStation', () => {
	it('shows the scenario as not running by default', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await expect.element(page.getByTestId('scenario-status')).toHaveTextContent('IS NOT RUNNING');
	});

	it('lists every module with its current run state', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await expect.element(page.getByTestId('module-status-navigation')).toHaveTextContent('halted');
	});

	it('executes a module via the command box and reflects it in the module status table', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Command input').fill('EN');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('module-status-navigation')).toHaveTextContent('running');
	});

	it('creates an enemy craft via the command box and shows it in the variable display', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Command input').fill('CE Klingon Bird of Prey, unconditionalAttack, 1, 2, 3');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('variable-display')).toHaveTextContent('Klingon Bird of Prey');
	});

	it('loads and runs a scenario, updating the scenario status', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Scenario script').fill('{"steps":[]}');
		await page.getByRole('button', { name: 'Load Scenario' }).click();
		await page.getByRole('button', { name: 'Run Scenario' }).click();

		await expect.element(page.getByTestId('scenario-status')).toHaveTextContent('IS RUNNING');
	});

	it('shows an error message for an unrecognized command', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Command input').fill('BOGUS');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});
});
