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

	describe('crew roster', () => {
		it('lists all 200 crew', async () => {
			render(MedicalStation, { store: setup() });

			await expect.element(page.getByTestId('crew-summary')).toHaveTextContent('200 crew');
			expect(page.getByTestId('crew-roster').element().querySelectorAll('tbody tr')).toHaveLength(200);
		});

		it('shows the captain first, since the roster starts sorted by rank', async () => {
			render(MedicalStation, { store: setup() });

			const firstRow = page.getByTestId('crew-roster').element().querySelector('tbody tr')!;

			expect(firstRow.textContent).toContain('Aiko Bianchi');
			expect(firstRow.textContent).toContain('Captain');
		});

		it('filters to one speciality', async () => {
			render(MedicalStation, { store: setup() });

			await page.getByLabelText('Filter by speciality').selectOptions('medical');

			expect(page.getByTestId('crew-roster').element().querySelectorAll('tbody tr')).toHaveLength(12);
		});

		it('filters by name', async () => {
			render(MedicalStation, { store: setup() });

			await page.getByLabelText('Search crew by name').fill('Aiko Bianchi');

			expect(page.getByTestId('crew-roster').element().querySelectorAll('tbody tr')).toHaveLength(1);
		});

		it('sorts by name when the Name heading is clicked', async () => {
			render(MedicalStation, { store: setup() });

			await page.getByRole('button', { name: 'Name' }).click();

			const firstRow = page.getByTestId('crew-roster').element().querySelector('tbody tr')!;
			expect(firstRow.textContent!.startsWith('Abigail')).toBe(true);
		});

		it('reverses the sort when the same heading is clicked twice', async () => {
			render(MedicalStation, { store: setup() });

			await page.getByRole('button', { name: 'Name' }).click();
			await page.getByRole('button', { name: 'Name' }).click();

			await expect.element(page.getByTestId('sort-name')).toHaveAttribute('aria-sort', 'descending');
		});

		it('shows an injured crew member health and counts them as injured', async () => {
			const store = setup();
			render(MedicalStation, { store });

			await store.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

			await expect.element(page.getByTestId('crew-health-12')).toHaveTextContent('4.0');
			await expect.element(page.getByTestId('crew-summary')).toHaveTextContent('1 injured');
		});

		it('shows where a crew member is, including the Intensive Care Unit once admitted', async () => {
			const store = setup();
			render(MedicalStation, { store });

			await store.dispatch({ module: 'medical', type: 'AdmitPatient', personnelId: 12, health: 4 });

			await expect.element(page.getByTestId('crew-row-12')).toHaveTextContent('Intensive Care Unit');
		});

		it('uses the compact table style so a long list stays readable', async () => {
			render(MedicalStation, { store: setup() });

			const fontSize = getComputedStyle(page.getByTestId('crew-roster').element()).fontSize;

			expect(parseFloat(fontSize)).toBeLessThan(12);
		});
	});
});
