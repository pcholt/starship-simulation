<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		/** CSS custom property name (without `--`) for this panel's accent, e.g. `chrome-engineering`. */
		accentVar: string;
		children: Snippet;
		/** Stretch to take the remaining height of a flex-column parent. */
		grow?: boolean;
	}

	let { title, accentVar, children, grow = false }: Props = $props();
</script>

<section class="panel" class:grow style:--accent="var(--{accentVar})">
	<header>{title}</header>
	<div class="body">
		{@render children?.()}
	</div>
</section>

<style>
	.panel {
		background: var(--panel);
		border: 1px solid var(--accent);
		border-radius: var(--radius-capsule) var(--radius-sm) var(--radius-sm) var(--radius-sm);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
		margin-bottom: var(--space-4);
	}

	.grow {
		flex: 1;
	}

	header {
		font-family: var(--font-display);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.85rem;
		color: var(--text-on-chrome);
		background: var(--accent);
		padding: var(--space-2) var(--space-4);
	}

	.body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: var(--space-4);
	}
</style>
