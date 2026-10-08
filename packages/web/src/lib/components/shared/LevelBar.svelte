<script lang="ts">
	interface Props {
		/** What the bar measures, e.g. "warpEngine-1 current energy". */
		label: string;
		value: number;
		max: number;
		testId?: string;
		title?: string;
		/** Values above this are unavailable and drawn hatched; omit when the whole range is usable. */
		limit?: number;
	}

	let { label, value, max, testId, title, limit }: Props = $props();

	let unavailablePercent = $derived(limit === undefined || max <= 0 ? 0 : 100 - Math.min(100, Math.max(0, (limit / max) * 100)));
	let fillPercent = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div
	class="level-bar"
	role="meter"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={Math.round(value)}
	data-testid={testId}
	{title}
>
	<div class="level-bar__fill" style:width="{fillPercent}%"></div>
	{#if unavailablePercent > 0}
		<div class="level-bar__unavailable" data-testid={testId ? `${testId}-unavailable` : undefined} style:width="{unavailablePercent}%"></div>
	{/if}
</div>

<style>
	.level-bar {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.level-bar__fill {
		height: 100%;
		background: color-mix(in srgb, var(--accent) 55%, transparent);
		transition: width 0.15s linear;
	}

	.level-bar__unavailable {
		position: absolute;
		top: 0;
		right: 0;
		height: 100%;
		background: repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.55) 0 4px, rgba(255, 255, 255, 0.06) 4px 8px);
	}
</style>
