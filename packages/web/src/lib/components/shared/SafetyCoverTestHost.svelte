<script lang="ts">
	import SafetyCover from './SafetyCover.svelte';

	let { initiallyOpen }: { initiallyOpen: boolean } = $props();
	// svelte-ignore state_referenced_locally
	let open = $state(initiallyOpen);
	let fireCount = $state(0);
</script>

<SafetyCover protects="test weapons" {open} onOpenChange={(requested) => (open = requested)} testId="cover">
	<button type="button" data-testid="covered-button" onclick={() => (fireCount += 1)}>Fire</button>
</SafetyCover>
<span data-testid="fire-count">{fireCount}</span>
