<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Names what the cover protects, e.g. "weapons on USS Excelsior". */
		protects: string;
		open: boolean;
		/** Asks for the cover to be lifted or closed; `open` stays as given until the owner of the state changes it. */
		onOpenChange: (open: boolean) => void;
		children: Snippet;
		testId?: string;
	}

	let { protects, open, onOpenChange, children, testId }: Props = $props();
</script>

<div class="safety-cover" class:safety-cover--open={open}>
	<div class="safety-cover__controls" inert={!open}>
		{@render children()}
	</div>
	<button
		type="button"
		class="safety-cover__flap"
		aria-expanded={open}
		aria-label={open ? `Close safety cover over ${protects}` : `Lift safety cover over ${protects}`}
		data-testid={testId}
		data-open={open}
		onclick={() => onOpenChange(!open)}
	>
		<span class="safety-cover__label">{open ? 'Close' : 'Lift cover'}</span>
	</button>
</div>

<style>
	.safety-cover {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2) var(--space-1) var(--space-2);
		border: 1px solid var(--status-critical);
		border-radius: var(--radius-sm);
		background: repeating-linear-gradient(135deg, rgba(255, 92, 92, 0.18) 0 8px, rgba(0, 0, 0, 0.35) 8px 16px);
		perspective: 40rem;
	}

	.safety-cover__controls {
		display: flex;
		gap: var(--space-2);
	}

	.safety-cover__flap {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		padding: 0;
		border: 2px solid #b02020;
		border-radius: var(--radius-sm);
		background: linear-gradient(180deg, rgba(255, 92, 92, 0.96), rgba(176, 32, 32, 0.98));
		box-shadow: inset 0 0 0.6rem rgba(255, 255, 255, 0.35), 0 0.15rem 0.4rem rgba(0, 0, 0, 0.6);
		color: #2a0606;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		transform-origin: top center;
		transition: transform 0.35s ease, opacity 0.35s ease;
		cursor: pointer;
	}

	.safety-cover--open {
		padding-top: 1.3rem;
	}

	.safety-cover--open .safety-cover__flap {
		inset: auto;
		top: 0;
		left: 0;
		right: 0;
		height: 1rem;
		transform: rotateX(25deg);
		opacity: 0.95;
		font-size: 0.6rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.safety-cover__flap {
			transition: none;
		}
	}
</style>
