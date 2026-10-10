import { describe, expect, it } from 'vitest';
import { SoundSettings, type SettingsStorage } from './sound-settings.svelte';

function fakeStorage(initial: Record<string, string> = {}): SettingsStorage & { values: Record<string, string> } {
	const values = { ...initial };
	return {
		values,
		getItem: (key) => values[key] ?? null,
		setItem: (key, value) => {
			values[key] = value;
		}
	};
}

describe('SoundSettings', () => {
	it('starts with sound enabled when nothing has been saved', () => {
		expect(new SoundSettings(fakeStorage()).enabled).toBe(true);
	});

	it('starts muted when muting was saved earlier', () => {
		expect(new SoundSettings(fakeStorage({ 'starship.uiSoundEnabled': 'false' })).enabled).toBe(false);
	});

	it('starts enabled when enabling was saved earlier', () => {
		expect(new SoundSettings(fakeStorage({ 'starship.uiSoundEnabled': 'true' })).enabled).toBe(true);
	});

	it('remembers a change in storage', () => {
		const storage = fakeStorage();

		new SoundSettings(storage).setEnabled(false);

		expect(storage.values['starship.uiSoundEnabled']).toBe('false');
	});

	it('reports the new value after a change', () => {
		const settings = new SoundSettings(fakeStorage());

		settings.setEnabled(false);

		expect(settings.enabled).toBe(false);
	});
});
