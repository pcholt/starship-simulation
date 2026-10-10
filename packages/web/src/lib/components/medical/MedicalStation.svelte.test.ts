import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import MedicalStation from './MedicalStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('MedicalStation', () => {
	it('shows all four ICU slots as empty by default', async () => {
		const store = setup();
		render(MedicalStation, { store });

		for (let i = 0; i < 4; i++) {
			await expect.element(page.getByTestId(`icu-slot-${i}`)).toHaveTextContent('EMPTY');
		}
	});

	it('displays an admitted patient in their ICU slot, reactively', async () => {
		const store = setup();
		render(MedicalStation, { store });

		store.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 1, health: 4 });

		await expect.element(page.getByTestId('icu-slot-0')).toHaveTextContent('Captain Aiko Bianchi');
		await expect.element(page.getByTestId('icu-slot-0')).toHaveTextContent('4');
	});

	it('has no command box, since Medical has no direct operator commands per the book', async () => {
		const store = setup();
		render(MedicalStation, { store });

		await expect.element(page.getByLabelText('Command input')).not.toBeInTheDocument();
	});
});
