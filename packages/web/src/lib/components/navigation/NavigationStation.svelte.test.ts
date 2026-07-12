import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../../adapters/local-engine-client.js';
import { WorldStateStore } from '../../stores/world-state.svelte.js';
import NavigationStation from './NavigationStation.svelte';

function setup() {
	const client = createLocalEngineClient();
	const store = new WorldStateStore(client);
	return store;
}

describe('NavigationStation', () => {
	it('displays the Enterprise starting position and velocity', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await expect.element(page.getByText('X-COORDINATE')).toBeInTheDocument();
		await expect.element(page.getByTestId('nav-position-x')).toHaveTextContent('0.0');
		await expect.element(page.getByTestId('nav-speed')).toHaveTextContent('0');
	});

	it('updates the displayed speed after a Set Velocity command is entered', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SV 7');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-speed')).toHaveTextContent('7');
	});

	it('sets the intended heading immediately after a Set Direction command, without snapping the actual heading there yet', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SD 45 10');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-xy-angle-intended')).toHaveTextContent('45');
		await expect.element(page.getByTestId('nav-xz-angle-intended')).toHaveTextContent('10');
		// Turning takes time — the actual heading hasn't moved yet since no tick has run.
		await expect.element(page.getByTestId('nav-xy-angle')).toHaveTextContent('0');
		await expect.element(page.getByTestId('nav-xz-angle')).toHaveTextContent('0');
	});

	it('turns the actual heading toward the intended heading over time once the engine ticks', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SD 90 0');
		await page.getByRole('button', { name: 'Enter' }).click();
		store.tick(1000);

		// Below warp 5 (the default speed is 0), turn rate is 15 deg/sec.
		await expect.element(page.getByTestId('nav-xy-angle')).toHaveTextContent('15');
		await expect.element(page.getByTestId('nav-xy-angle-intended')).toHaveTextContent('90');
	});

	it('displays the destination after a Set Course to Coordinates command is entered', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 4 5 6');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-destination')).toHaveTextContent('4.0, 5.0, 6.0');
	});

	it('also turns the ship to face the new destination when a Set Course command is entered', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 0 10 0');
		await page.getByRole('button', { name: 'Enter' }).click();

		// Straight ahead (0,0) toward (0,10,0) is 90 degrees x/y.
		await expect.element(page.getByTestId('nav-xy-angle-intended')).toHaveTextContent('90');
	});

	it('shows an error message for an unrecognized command without dispatching anything', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('BOGUS');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});

	it('computes an ETA once a course and speed toward coordinates are both set', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 100 0 0');
		await page.getByRole('button', { name: 'Enter' }).click();
		await page.getByLabelText('Command input').fill('SV 10');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-eta')).toHaveTextContent('10');
	});

	it('shows ETA as N/A when speed is zero', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SCC 100 0 0');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('nav-eta')).toHaveTextContent('N/A');
	});

	it('lists nearby celestial objects and craft (text substitute for the Astrogator plot)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 10, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('nearby-objects')).toHaveTextContent('Rigel VII');
	});

	it('shows the chronometer formatted as HH:MM:SS.T', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('nav-chronometer')).toHaveTextContent('00:00:00.0');
	});

	it('shows position coordinates rounded to one decimal place', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByTestId('astrogator-svg').click();
		await page.getByLabelText('Speed').fill('20');

		// Give the engine a moment to advance position along a fractional trajectory.
		await new Promise((resolve) => setTimeout(resolve, 50));
		store.tick(50);

		const x = await page.getByTestId('nav-position-x').element().textContent;
		expect(x).toMatch(/^-?\d+\.\d$/);
	});

	it('shows shield sectors on the Astrogator plot reflecting current shield strength', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('shield-sector-fore')).toBeInTheDocument();
		const opacity = await page.getByTestId('shield-sector-fore').element().getAttribute('opacity');
		expect(Number(opacity)).toBeCloseTo(0.5);
	});

	it('shows no projected path while the ship is stationary', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('projected-path')).not.toBeInTheDocument();
	});

	it('shows a projected future path on the Astrogator once the ship is moving', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Command input').fill('SV 5');
		await page.getByRole('button', { name: 'Enter' }).click();

		await expect.element(page.getByTestId('projected-path')).toBeInTheDocument();
	});

	it('flashes a scan marker on the Astrogator plot for 2 seconds when Sciences triggers a Scan Area, then removes it', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 200, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		store.dispatch({ module: 'sciences', type: 'ScanArea', position: { x: 200, y: 0, z: 0 } });
		render(NavigationStation, { store });

		await expect.element(page.getByTestId('scan-flash-circle')).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 2200));
		await expect.element(page.getByTestId('scan-flash-circle')).not.toBeInTheDocument();
	}, 10_000);

	it('does not show a scan flash for an already-stale event when the station mounts late (reload/navigate-back)', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 200, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		store.dispatch({ module: 'sciences', type: 'ScanArea', position: { x: 200, y: 0, z: 0 } });
		// The scan happened, then well over 2s of simulated time passed — e.g. the player was on
		// another station, or reloaded the page — before Navigation ever mounted.
		store.tick(2500);

		render(NavigationStation, { store });

		await expect.element(page.getByTestId('nav-position-x')).toBeInTheDocument();
		await expect.element(page.getByTestId('scan-flash-circle')).not.toBeInTheDocument();
	});

	it('resumes a partially-elapsed scan flash at reduced brightness/duration rather than restarting it from full', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateCelestialObject',
			name: 'Rigel VII',
			position: { x: 200, y: 0, z: 0 },
			radius: 6000,
			mass: 5.9e24
		});
		store.dispatch({ module: 'sciences', type: 'ScanArea', position: { x: 200, y: 0, z: 0 } });
		// 1.8s of the 2s flash window already elapsed before this station mounted.
		store.tick(1800);

		render(NavigationStation, { store });

		await expect.element(page.getByTestId('scan-flash-circle')).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 400));
		await expect.element(page.getByTestId('scan-flash-circle')).not.toBeInTheDocument();
	});

	it('flashes a beam line on the Astrogator plot when phasers are fired at a target, then removes it', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 50, y: 0, z: 0 }
		});
		render(NavigationStation, { store });

		store.dispatch({ module: 'helm', type: 'FirePhasers', target: { kind: 'object', name: 'Klingon Bird of Prey' } });

		await expect.element(page.getByTestId('weapon-fire-line')).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 700));
		await expect.element(page.getByTestId('weapon-fire-line')).not.toBeInTheDocument();
	}, 10_000);

	it('flashes an explosion marker where a torpedo detonates', async () => {
		const store = setup();
		store.dispatch({
			module: 'controller',
			type: 'CreateEnemyCraft',
			name: 'Klingon Bird of Prey',
			mission: 'unconditionalAttack',
			position: { x: 5, y: 0, z: 0 }
		});
		render(NavigationStation, { store });

		store.dispatch({ module: 'helm', type: 'FireTorpedo', target: { kind: 'object', name: 'Klingon Bird of Prey' } });
		for (let i = 0; i < 50 && store.state.torpedoes.length > 0; i++) {
			store.tick(200);
		}

		await expect.element(page.getByTestId('torpedo-explosion-flash')).toBeInTheDocument();
	});

	it('sets speed via the speed slider (point-and-click, no typed command)', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByLabelText('Speed').fill('12');

		await expect.element(page.getByTestId('nav-speed')).toHaveTextContent('12');
	});

	it('sets heading via the compass dial (point-and-click, no typed command)', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByTestId('compass-dial').click();

		// Any click resolves to some heading in range; the dial's own math is unit-tested separately —
		// this just proves the click is wired through to a real SetDirection dispatch (which sets the
		// *intended* heading — the actual heading turns toward it over time, tested elsewhere).
		const xyAngle = await page.getByTestId('nav-xy-angle-intended').element().textContent;
		expect(parseFloat(xyAngle ?? '')).toBeGreaterThanOrEqual(0);
		expect(parseFloat(xyAngle ?? '')).toBeLessThan(360);
	});

	it('sets a coordinate course by clicking the Astrogator plot (point-and-click, no typed command)', async () => {
		const store = setup();
		render(NavigationStation, { store });

		await page.getByTestId('astrogator-svg').click();

		await expect.element(page.getByTestId('nav-destination')).not.toHaveTextContent('NONE');
	});
});
