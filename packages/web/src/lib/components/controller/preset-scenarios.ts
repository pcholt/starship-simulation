import type { ScenarioScript } from '@starship/engine';

export interface PresetScenario {
	id: string;
	name: string;
	description: string;
	script: ScenarioScript;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
	{
		id: 'klingon-ambush',
		name: 'Klingon Ambush',
		description: 'A Klingon Bird of Prey decloaks nearby and attacks without warning.',
		script: {
			steps: [
				{
					atMs: 0,
					command: {
						module: 'controller',
						type: 'CreateEnemyCraft',
						name: 'Klingon Bird of Prey',
						mission: 'unconditionalAttack',
						position: { x: 150, y: 40, z: 0 }
					}
				},
				{
					atMs: 1500,
					command: {
						module: 'communications',
						type: 'ReceiveMessage',
						from: 'Long-Range Sensors',
						text: 'Warning: unidentified vessel decloaking at bearing 040.'
					}
				},
				{
					atMs: 8000,
					command: {
						module: 'controller',
						type: 'CreateEnemyCraft',
						name: 'Klingon Escort',
						mission: 'unconditionalAttack',
						position: { x: 180, y: -30, z: 20 }
					}
				}
			]
		}
	},
	{
		id: 'first-contact',
		name: 'First Contact',
		description: 'A newly-charted planet and a friendly science vessel to explore it with.',
		script: {
			steps: [
				{
					atMs: 0,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'Rigel VII',
						position: { x: 300, y: 0, z: 0 },
						radius: 6371,
						mass: 5.9e24
					}
				},
				{
					atMs: 0,
					command: {
						module: 'controller',
						type: 'CreateFederationCraft',
						name: 'USS Copernicus',
						mission: 'exploration',
						position: { x: 250, y: 50, z: 0 }
					}
				},
				{
					atMs: 3000,
					command: {
						module: 'communications',
						type: 'ReceiveMessage',
						from: 'Starfleet Command',
						text: 'New orders: survey Rigel VII for signs of habitability.'
					}
				}
			]
		}
	},
	{
		id: 'distress-call',
		name: 'Distress Call',
		description: 'A Federation science vessel under attack calls for help.',
		script: {
			steps: [
				{
					atMs: 0,
					command: {
						module: 'communications',
						type: 'ReceiveMessage',
						from: 'USS Farragut',
						text: 'Mayday, mayday — we are under fire and requesting immediate assistance!'
					}
				},
				{
					atMs: 0,
					command: {
						module: 'controller',
						type: 'CreateFederationCraft',
						name: 'USS Farragut',
						mission: 'distress',
						position: { x: 400, y: 100, z: -50 }
					}
				},
				{
					atMs: 4000,
					command: {
						module: 'controller',
						type: 'CreateEnemyCraft',
						name: 'Romulan Warbird',
						mission: 'unconditionalAttack',
						position: { x: 420, y: 90, z: -40 }
					}
				}
			]
		}
	},
	{
		id: 'derelict-encounter',
		name: 'Derelict Encounter',
		description: 'Sensors detect an unidentified object of unusual mass drifting nearby.',
		script: {
			steps: [
				{
					atMs: 0,
					command: {
						module: 'controller',
						type: 'CreateCelestialObject',
						name: 'Unidentified Object',
						position: { x: 500, y: -80, z: 30 },
						radius: 45,
						mass: 8.2e18
					}
				},
				{
					atMs: 5000,
					command: {
						module: 'communications',
						type: 'ReceiveMessage',
						from: 'Sciences',
						text: "That mass reading doesn't match any known asteroid composition."
					}
				}
			]
		}
	}
];
