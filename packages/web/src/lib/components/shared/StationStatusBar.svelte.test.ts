import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import StationStatusBar from './StationStatusBar.svelte';

function setup() {
	return new WorldStateStore(createLocalEngineClient());
}

describe('StationStatusBar', () => {
	it('shows the module as running by default', async () => {
		const store = setup();
		render(StationStatusBar, { store, moduleName: 'navigation' });

		await expect.element(page.getByTestId('module-run-state')).toHaveTextContent('RUNNING');
	});

	it('shows the module as halted after the Controller halts it', async () => {
		const store = setup();
		store.dispatch({ module: 'controller', type: 'Halt', target: 'navigation' });
		render(StationStatusBar, { store, moduleName: 'navigation' });

		await expect.element(page.getByTestId('module-run-state')).toHaveTextContent('HALTED');
	});

	it('does not report this station halted when a different module is halted', async () => {
		const store = setup();
		store.dispatch({ module: 'controller', type: 'Halt', target: 'helm' });
		render(StationStatusBar, { store, moduleName: 'navigation' });

		await expect.element(page.getByTestId('module-run-state')).toHaveTextContent('RUNNING');
	});

	it('shows the scenario as not running by default', async () => {
		const store = setup();
		render(StationStatusBar, { store, moduleName: 'navigation' });

		await expect.element(page.getByTestId('scenario-run-state')).toHaveTextContent('NOT RUNNING');
	});

	it('shows the scenario as running once loaded and run', async () => {
		const store = setup();
		store.loadScenario({ steps: [] });
		store.dispatch({ module: 'controller', type: 'RunScenario' });
		render(StationStatusBar, { store, moduleName: 'navigation' });

		await expect.element(page.getByTestId('scenario-run-state')).toHaveTextContent('RUNNING');
	});
});
