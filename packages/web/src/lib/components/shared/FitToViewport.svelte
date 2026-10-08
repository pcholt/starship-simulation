<script lang="ts">
	import type { Snippet } from 'svelte';
	import { findFitScale } from './fit-scale';

	interface Props {
		children: Snippet;
		minimumScale?: number;
		maximumScale?: number;
		/** Skips fitting and lays the content out at a fixed scale, still filling the frame. */
		fixedScale?: number;
	}

	let { children, minimumScale = 0.55, maximumScale = 1.3, fixedScale }: Props = $props();

	let frame: HTMLDivElement;
	let content: HTMLDivElement;
	let scale = $state(1);

	function applyLayout(candidateScale: number, frameWidth: number, frameHeight: number, fillFrame: boolean) {
		content.style.width = `${frameWidth / candidateScale}px`;
		content.style.height = fillFrame ? `${frameHeight / candidateScale}px` : 'auto';
	}

	function refit() {
		const frameWidth = frame.clientWidth;
		const frameHeight = frame.clientHeight;
		if (frameWidth === 0 || frameHeight === 0) return;

		const fittedScale = fixedScale ?? findFitScale({
			availableWidth: frameWidth,
			availableHeight: frameHeight,
			measureContentHeightAtWidth: (width) => {
				applyLayout(frameWidth / width, frameWidth, frameHeight, false);
				return content.offsetHeight;
			},
			minimumScale,
			maximumScale
		});
		applyLayout(fittedScale, frameWidth, frameHeight, true);
		scale = fittedScale;
	}

	$effect(() => {
		let pendingFrame = 0;
		const scheduleRefit = () => {
			cancelAnimationFrame(pendingFrame);
			pendingFrame = requestAnimationFrame(refit);
		};
		const observer = new ResizeObserver(scheduleRefit);
		observer.observe(frame);
		observer.observe(content);
		const mutations = new MutationObserver(scheduleRefit);
		mutations.observe(content, { childList: true, subtree: true, characterData: true });
		refit();
		return () => {
			cancelAnimationFrame(pendingFrame);
			observer.disconnect();
			mutations.disconnect();
		};
	});
</script>

<div class="frame" bind:this={frame} data-testid="fit-frame">
	<div
		class="content"
		bind:this={content}
		data-testid="fit-content"
		style:transform="scale({scale})"
	>
		{@render children()}
	</div>
</div>

<style>
	.frame {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.content {
		transform-origin: top left;
	}
</style>
