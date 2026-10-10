import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StationNav from './StationNav.svelte';

describe('StationNav sound toggle', () => {
	it('shows that sound is on', async () => {
		render(StationNav, { soundEnabled: true, onSoundEnabledChange: () => {} });

		await expect.element(page.getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('shows that sound is off', async () => {
		render(StationNav, { soundEnabled: false, onSoundEnabledChange: () => {} });

		await expect.element(page.getByRole('button', { name: 'Sound off' })).toHaveAttribute('aria-pressed', 'false');
	});

	it('asks to mute when clicked while sound is on', async () => {
		const onSoundEnabledChange = vi.fn();
		render(StationNav, { soundEnabled: true, onSoundEnabledChange });

		await page.getByRole('button', { name: 'Sound on' }).click();

		expect(onSoundEnabledChange).toHaveBeenCalledWith(false);
	});

	it('asks to unmute when clicked while sound is off', async () => {
		const onSoundEnabledChange = vi.fn();
		render(StationNav, { soundEnabled: false, onSoundEnabledChange });

		await page.getByRole('button', { name: 'Sound off' }).click();

		expect(onSoundEnabledChange).toHaveBeenCalledWith(true);
	});
});
