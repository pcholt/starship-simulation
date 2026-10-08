import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import EngineeringStation from './EngineeringStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('EngineeringStation', () => {
	it('lists all six shuttlecraft with no mission assigned', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		for (let id = 1; id <= 6; id++) {
			await expect.element(page.getByTestId(`shuttlecraft-${id}-mission`)).toHaveTextContent('none');
		}
	});

	it('shows a device row for phaser-fore with its starting energy allocation', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await expect.element(page.getByTestId('device-phaser-fore-energy')).toBeInTheDocument();
	});

	it('sets a device energy allocation via its slider (point-and-click, no typed command)', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('phaser-fore Energy').fill('500');

		await expect.element(page.getByTestId('device-phaser-fore-energy')).toHaveTextContent('500');
	});

	it('sets a shuttlecraft mission via its dropdown (point-and-click, no typed command)', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('Shuttlecraft 1 Mission').selectOptions('seekSensorData');

		await expect.element(page.getByTestId('shuttlecraft-1-mission')).toHaveTextContent('seekSensorData');
	});

	it('lays the energy allocation sliders out in two columns', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		const sliderColumns = getComputedStyle(page.getByTestId('energy-allocation-sliders').element()).gridTemplateColumns;

		expect(sliderColumns.split(' ')).toHaveLength(2);
	});

	it('keeps the other sliders in proportion to one another when one slider is moved', async () => {
		const store = setup();
		render(EngineeringStation, { store });
		await page.getByLabelText('phaser-aft Energy').fill('1000');
		await page.getByLabelText('phaser-port Energy').fill('500');
		const aftBefore = Number(page.getByTestId('device-phaser-aft-energy').element().textContent!.replace(/\D/g, ''));
		const portBefore = Number(page.getByTestId('device-phaser-port-energy').element().textContent!.replace(/\D/g, ''));

		await page.getByLabelText('phaser-fore Energy').fill('100');

		const aftAfter = Number(page.getByTestId('device-phaser-aft-energy').element().textContent!.replace(/\D/g, ''));
		const portAfter = Number(page.getByTestId('device-phaser-port-energy').element().textContent!.replace(/\D/g, ''));
		expect(aftAfter / portAfter).toBeCloseTo(aftBefore / portBefore, 1);
		expect(aftAfter).not.toBe(portAfter);
	});

	it('has a lock checkbox for each device group, unchecked to begin with', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await expect.element(page.getByLabelText('Lock Shields')).not.toBeChecked();
	});

	it('keeps a locked group at its requested energy when another slider is moved', async () => {
		const store = setup();
		render(EngineeringStation, { store });
		const shieldBefore = page.getByTestId('device-shield-fore-energy').element().textContent;

		await page.getByLabelText('Lock Shields').click();
		await page.getByLabelText('phaser-fore Energy').fill('1000');

		await expect.element(page.getByLabelText('Lock Shields')).toBeChecked();
		await expect.element(page.getByTestId('device-shield-fore-energy')).toHaveTextContent(shieldBefore!.trim());
	});

	it('shows the energy a device is actually receiving separately from the amount requested', async () => {
		const store = setup();
		render(EngineeringStation, { store });
		const receivingBefore = page.getByTestId('device-phaser-fore-current-energy').element().getAttribute('aria-valuenow');

		await page.getByLabelText('phaser-fore Energy').fill('1000');

		await expect.element(page.getByTestId('device-phaser-fore-energy')).toHaveTextContent('1000');
		expect(page.getByTestId('device-phaser-fore-current-energy').element().getAttribute('aria-valuenow')).toBe(receivingBefore);
	});

	it('has no minimum button for the weapons group, which has no minimum', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await expect.element(page.getByLabelText('Set Weapons to minimum')).not.toBeInTheDocument();
	});

	it('requests 100 units for every shield when the shields minimum button is pressed', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('Set Shields to minimum').click();

		for (const location of ['fore', 'aft', 'port', 'starboard']) {
			await expect.element(page.getByTestId(`device-shield-${location}-energy`)).toHaveTextContent('100');
		}
	});

	it('does not flag a device label while it receives at least its minimum', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await expect.element(page.getByTestId('device-warpEngine-1-label')).toHaveAttribute('data-alert', 'false');
	});

	it('flags a device label once the energy it receives falls below its minimum', async () => {
		const store = setup();
		render(EngineeringStation, { store });
		await store.dispatch({ module: 'engineering', type: 'SetEnergyAllocation', deviceId: 'warpEngine-1', amount: 50 });

		await store.tick(60_000);

		await expect.element(page.getByTestId('device-warpEngine-1-label')).toHaveAttribute('data-alert', 'true');
	});

	it('does not mark a device as overdriven when it is requested at its nominal maximum', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('phaser-fore Energy').fill('1000');

		await expect.element(page.getByTestId('device-phaser-fore-row')).toHaveAttribute('data-overdrive', 'false');
	});

	it('marks a device as overdriven when it is requested above its nominal maximum', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await page.getByLabelText('phaser-fore Energy').fill('1100');

		await expect.element(page.getByTestId('device-phaser-fore-row')).toHaveAttribute('data-overdrive', 'true');
	});

	it('limits a slider to 10% above the device nominal maximum', async () => {
		const store = setup();
		render(EngineeringStation, { store });

		await expect.element(page.getByLabelText('warpEngine-1 Energy')).toHaveAttribute('max', '1100');
	});
});
