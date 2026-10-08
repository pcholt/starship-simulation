import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createLocalEngineClient } from '../adapters/local-engine-client.js';
import { WorldStateStore } from '../stores/world-state.svelte.js';
import CommunicationsStation from './communications/CommunicationsStation.svelte';
import ControllerStation from './controller/ControllerStation.svelte';
import EngineeringStation from './engineering/EngineeringStation.svelte';
import HelmStation from './helm/HelmStation.svelte';
import MedicalStation from './medical/MedicalStation.svelte';
import NavigationStation from './navigation/NavigationStation.svelte';
import SciencesStation from './sciences/SciencesStation.svelte';

const STATIONS = [
	['Communications', CommunicationsStation],
	['Controller', ControllerStation],
	['Engineering', EngineeringStation],
	['Helm', HelmStation],
	['Medical', MedicalStation],
	['Navigation', NavigationStation],
	['Sciences', SciencesStation]
] as const;

describe.each(STATIONS)('%s station', (_name, Station) => {
	it('has no typed command box', async () => {
		render(Station, { store: new WorldStateStore(createLocalEngineClient()) });

		await expect.element(page.getByLabelText('Command input')).not.toBeInTheDocument();
	});
});
