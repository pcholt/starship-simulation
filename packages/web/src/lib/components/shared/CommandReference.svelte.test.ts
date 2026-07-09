import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommandReference from './CommandReference.svelte';

describe('CommandReference', () => {
	it('renders a row per command with its function and syntax', async () => {
		render(CommandReference, {
			commands: [
				{ description: 'Set Velocity', syntax: 'S V <warp speed>' },
				{ description: 'Set Direction', syntax: 'S D <xy angle> <xz angle>' }
			]
		});

		await expect.element(page.getByText('Set Velocity')).toBeInTheDocument();
		await expect.element(page.getByText('S V <warp speed>')).toBeInTheDocument();
		await expect.element(page.getByText('Set Direction')).toBeInTheDocument();
		await expect.element(page.getByText('S D <xy angle> <xz angle>')).toBeInTheDocument();
	});
});
