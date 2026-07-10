import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PanelTestHost from './PanelTestHost.svelte';

describe('Panel', () => {
	it('renders the given title', async () => {
		render(PanelTestHost, {});
		await expect.element(page.getByText('Test Panel')).toBeInTheDocument();
	});

	it('renders its children content', async () => {
		render(PanelTestHost, {});
		await expect.element(page.getByText('panel body content')).toBeInTheDocument();
	});
});
