export interface SettingsStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'starship.uiSoundEnabled';

export class SoundSettings {
	#storage: SettingsStorage;
	enabled: boolean = $state(true);

	constructor(storage: SettingsStorage) {
		this.#storage = storage;
		this.enabled = storage.getItem(STORAGE_KEY) !== 'false';
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		this.#storage.setItem(STORAGE_KEY, String(enabled));
	}
}
