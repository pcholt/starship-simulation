<script lang="ts">
	import type { StatusLevel } from './status-chip.js';

	interface Props {
		label: string;
		status: StatusLevel;
	}

	let { label, status }: Props = $props();
</script>

<span class="chip" data-status={status}>{label}</span>

<style>
	.chip {
		display: inline-block;
		font-family: var(--font-body);
		font-weight: 700;
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		color: var(--text-on-chrome);
	}

	.chip[data-status='ok'] {
		background: var(--status-ok);
	}

	.chip[data-status='warning'] {
		background: var(--status-warning);
	}

	.chip[data-status='critical'] {
		background: var(--status-critical);
	}

	.chip[data-status='neutral'] {
		background: var(--text-muted);
	}
</style>
