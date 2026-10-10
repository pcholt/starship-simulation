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

		await expect.element(page.getByTestId('module-status-navigation')).toHaveTextContent('running');
	});

	it('shows a newly created enemy craft in the variable display', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 1, y: 2, z: 3 }
		});

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

	it('shows an error message when Run Scenario is clicked before a scenario is loaded', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByRole('button', { name: 'Run Scenario' }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent('No scenario loaded');
		await expect.element(page.getByTestId('scenario-status')).toHaveTextContent('IS NOT RUNNING');
	});

	it('shows an error message when Halt Scenario is clicked before a scenario is loaded', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByRole('button', { name: 'Halt Scenario' }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent('No scenario loaded');
	});

	it('lists the preset scenarios by name', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await expect.element(page.getByTestId('preset-scenarios')).toHaveTextContent('Klingon Ambush');
		await expect.element(page.getByTestId('preset-scenarios')).toHaveTextContent('First Contact');
		await expect.element(page.getByTestId('preset-scenarios')).toHaveTextContent('Distress Call');
		await expect.element(page.getByTestId('preset-scenarios')).toHaveTextContent('Derelict Encounter');
	});

	it('halts and executes a module by clicking its buttons (point-and-click, no typed command)', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByTestId('module-halt-navigation').click();
		await expect.element(page.getByTestId('module-status-navigation')).toHaveTextContent('halted');

		await page.getByTestId('module-execute-navigation').click();
		await expect.element(page.getByTestId('module-status-navigation')).toHaveTextContent('running');
	});

	it('loads and runs a preset scenario in a single click', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByRole('button', { name: 'Load & Run: Klingon Ambush' }).click();

		await expect.element(page.getByTestId('scenario-status')).toHaveTextContent('IS RUNNING');
		store.tick(0);
		await expect.element(page.getByTestId('variable-display')).toHaveTextContent('Klingon Bird of Prey');
	});

	it('creates an enemy craft from the Create Object form', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Object name').fill('Klingon Bird of Prey');
		await page.getByLabelText('Craft mission').fill('unconditionalAttack');
		await page.getByLabelText('Object X').fill('50');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		await expect.element(page.getByTestId('variable-display')).toHaveTextContent('Klingon Bird of Prey');
		expect(store.state.enemyCraft[0]).toMatchObject({ name: 'Klingon Bird of Prey', mission: 'unconditionalAttack', position: { x: 50, y: 0, z: 0 } });
	});

	it('creates a federation craft when that kind is selected', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Kind of object').selectOptions('federationCraft');
		await page.getByLabelText('Object name').fill('USS Excelsior');
		await page.getByLabelText('Craft mission').fill('patrol');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		expect(store.state.federationCraft[0]).toMatchObject({ name: 'USS Excelsior' });
	});

	it('creates a celestial object with a radius and mass, and hides the mission field', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByLabelText('Kind of object').selectOptions('celestialObject');
		await expect.element(page.getByLabelText('Craft mission')).not.toBeInTheDocument();
		await page.getByLabelText('Object name').fill('Rigel VII');
		await page.getByLabelText('Object radius').fill('6000');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		expect(store.state.celestialObjects[0]).toMatchObject({ name: 'Rigel VII', radius: 6000 });
	});

	it('shows a reason in the Alerts panel when the form is incomplete', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await page.getByRole('button', { name: 'Create', exact: true }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent('Enter a name');
		expect(store.state.enemyCraft).toHaveLength(0);
	});

	it('highlights the JSON keys and numbers in the variable display', async () => {
		const store = setup();
		render(ControllerStation, { store });

		const lifeSupport = page.getByTestId('variable-lifeSupport').element();

		expect(lifeSupport.querySelector('.hljs-attr')?.textContent).toBe('"air"');
		expect(lifeSupport.querySelector('.hljs-number')?.textContent).toBe('100');
	});

	it('highlights null as a literal in the variable display', async () => {
		const store = setup();
		render(ControllerStation, { store });

		const lastScan = page.getByTestId('variable-lastScanResult').element();

		expect(lastScan.querySelector('.hljs-literal')?.textContent).toBe('null');
	});

	it('colors keys and numbers differently', async () => {
		const store = setup();
		render(ControllerStation, { store });

		const lifeSupport = page.getByTestId('variable-lifeSupport').element();
		const keyColor = getComputedStyle(lifeSupport.querySelector('.hljs-attr')!).color;
		const numberColor = getComputedStyle(lifeSupport.querySelector('.hljs-number')!).color;

		expect(keyColor).not.toBe(numberColor);
	});

	it('keeps the original JSON text readable once highlighted', async () => {
		const store = setup();
		render(ControllerStation, { store });

		await expect.element(page.getByTestId('variable-lifeSupport')).toHaveTextContent('{"air":100,"water":100,"food":100}');
	});

	describe('shuttle controls', () => {
		it('lists all six shuttles as in the bay to begin with', async () => {
			render(ControllerStation, { store: setup() });

			for (let id = 1; id <= 6; id++) {
				await expect.element(page.getByTestId(`shuttle-status-${id}`)).toHaveTextContent('IN BAY');
			}
		});

		it('launches a shuttle with its Launch button', async () => {
			const store = setup();
			render(ControllerStation, { store });

			await page.getByRole('button', { name: 'Launch Shuttle 2' }).click();

			await expect.element(page.getByTestId('shuttle-status-2')).toHaveTextContent('IN FLIGHT');
			expect(store.state.shuttlecraft.find((shuttle) => shuttle.id === 2)!.status).toBe('inFlight');
		});

		it('offers Recall instead of Launch for a shuttle in flight', async () => {
			const store = setup();
			render(ControllerStation, { store });
			await page.getByRole('button', { name: 'Launch Shuttle 2' }).click();

			await expect.element(page.getByRole('button', { name: 'Recall Shuttle 2' })).toBeInTheDocument();
			await expect.element(page.getByRole('button', { name: 'Launch Shuttle 2' })).not.toBeInTheDocument();
		});

		it('recalls a shuttle with its Recall button', async () => {
			const store = setup();
			render(ControllerStation, { store });
			await page.getByRole('button', { name: 'Launch Shuttle 2' }).click();

			await page.getByRole('button', { name: 'Recall Shuttle 2' }).click();

			await expect.element(page.getByTestId('shuttle-status-2')).toHaveTextContent('IN BAY');
		});
	});
});
