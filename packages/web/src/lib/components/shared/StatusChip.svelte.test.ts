import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StatusChip from './StatusChip.svelte';

describe('StatusChip', () => {
	it('renders the given label', async () => {
		render(StatusChip, { label: 'RUNNING', status: 'ok' });
		await expect.element(page.getByText('RUNNING')).toBeInTheDocument();
	});

	it('applies a distinct visual variant per status level', async () => {
		const { container: okContainer } = render(StatusChip, { label: 'OK', status: 'ok' });
		const { container: criticalContainer } = render(StatusChip, { label: 'CRITICAL', status: 'critical' });

		const okChip = okContainer.querySelector('[data-status]');
		const criticalChip = criticalContainer.querySelector('[data-status]');
		expect(okChip?.getAttribute('data-status')).toBe('ok');
		expect(criticalChip?.getAttribute('data-status')).toBe('critical');
	});
});
