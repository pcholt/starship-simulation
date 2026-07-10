<script lang="ts">
	import { page } from '$app/state';
	import { STATION_NAV_ITEMS, isActiveStation } from './station-nav-items.js';
</script>

<nav aria-label="Bridge stations" class="lcars-nav">
	<a href="/" class="lcars-nav__home" style:--accent="var(--chrome-controller)">Bridge</a>
	<ul>
		{#each STATION_NAV_ITEMS as item (item.id)}
			{@const active = isActiveStation(page.url.pathname, item.id)}
			<li>
				<a
					href="/station/{item.id}"
					class="lcars-pill"
					class:lcars-pill--active={active}
					style:--accent="var(--{item.accentVar})"
					aria-current={active ? 'page' : undefined}
				>
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.lcars-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-2) var(--space-4) 0;
		background: var(--void);
		min-width: 11rem;
	}

	.lcars-nav__home {
		display: block;
		font-family: var(--font-display);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 1.1rem;
		color: var(--text-on-chrome);
		background: var(--accent, var(--chrome-controller));
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-capsule) var(--radius-sm) var(--radius-sm) var(--radius-capsule);
		text-decoration: none;
		margin-bottom: var(--space-2);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.lcars-pill {
		display: block;
		font-family: var(--font-body);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.85rem;
		text-decoration: none;
		color: var(--text-on-chrome);
		background: var(--accent);
		opacity: 0.55;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm) var(--radius-capsule) var(--radius-capsule) var(--radius-sm);
		transition: opacity 0.15s ease, transform 0.15s ease;
	}

	.lcars-pill:hover {
		opacity: 0.85;
	}

	.lcars-pill--active {
		opacity: 1;
		transform: translateX(0.25rem);
	}
</style>
