<script lang="ts">
	import type { BankLocation } from '@starship/engine';
	import { BANK_ANGLE_OFFSET_DEG, sectorPolygonPoints } from './shield-sector.js';

	interface ShieldOverlay {
		/** The ship's current heading — shield sectors rotate with it, "fore" always facing this direction. */
		headingDeg: number;
		levels: { location: BankLocation; level: number }[];
	}

	interface Props {
		shieldOverlay: ShieldOverlay;
		viewSize: number;
	}

	let { shieldOverlay, viewSize }: Props = $props();

	/** Fixed visual size in viewBox units — shields aren't drawn to world scale, just large enough to read clearly next to the Enterprise mark. */
	const SHIELD_SECTOR_RADIUS = 7;
	const SHIELD_SECTOR_SPAN_DEG = 90;
	/** Alpha at 100% shield strength, fading linearly to 0 at 0% strength. */
	const SHIELD_MAX_OPACITY = 0.5;
</script>

{#each shieldOverlay.levels as shield (shield.location)}
	{@const centerAngle = shieldOverlay.headingDeg + BANK_ANGLE_OFFSET_DEG[shield.location]}
	{@const wedge = sectorPolygonPoints(centerAngle, SHIELD_SECTOR_SPAN_DEG, SHIELD_SECTOR_RADIUS)}
	<polygon
		data-testid={`shield-sector-${shield.location}`}
		points={wedge.map((p) => `${viewSize / 2 + p.x},${viewSize / 2 + p.y}`).join(' ')}
		fill="var(--chrome-helm)"
		opacity={(shield.level / 100) * SHIELD_MAX_OPACITY}
	>
		<title>{shield.location} shield — {shield.level}%</title>
	</polygon>
{/each}
