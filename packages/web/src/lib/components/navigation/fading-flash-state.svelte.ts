import { untrack } from 'svelte';
import type { WorldStateStore } from '../../stores/world-state.svelte.js';

interface SequencedEvent {
	sequence: number;
	atMs: number;
}

/**
 * Generic "fade out over time" tracker for presentational events carrying a `sequence`/`atMs`
 * pair (`ScanAreaEvent`, `WeaponFireEvent`, `TorpedoExplosionEvent`, ...). Watches `getEvents()`
 * for entries newer than the last one already seen (by `sequence`, not object identity — a full
 * state broadcast in networked play changes identity on every event, not just new ones) and keeps
 * each visible for `durationMs` from when it happened, on its own independent timer — so several
 * events landing close together (e.g. two torpedoes detonating in the same tick) fade out
 * separately rather than one clobbering another.
 *
 * A late-mounting view (the player switched stations and back, or reloaded) resumes an
 * already-partly-elapsed event at reduced remaining duration rather than restarting it from full
 * brightness, since `remainingMs` is computed from the event's own `atMs` against the current
 * simulated clock.
 */
export function createFadingFlashes<E extends SequencedEvent, V>(
	store: WorldStateStore,
	getEvents: (store: WorldStateStore) => E[],
	durationMs: number,
	toValue: (event: E, remainingMs: number) => V
) {
	let flashes: { sequence: number; value: V }[] = $state([]);
	let lastSeenSequence = -1;
	const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

	// Deliberately has no cleanup return — a cleanup here would fire on every re-run (i.e. on every
	// new event), cancelling the fade-out timers of flashes still in flight from a previous run.
	// Each flash's own timeout below is independent and self-removing.
	$effect(() => {
		const events = getEvents(store);
		if (events.length === 0) return;
		const nowMs = untrack(() => store.state.simulatedTimeMs);

		for (const event of events) {
			if (event.sequence <= lastSeenSequence) continue;
			const remainingMs = durationMs - (nowMs - event.atMs);
			if (remainingMs <= 0) continue;

			flashes = [...flashes, { sequence: event.sequence, value: toValue(event, remainingMs) }];
			const timeout = setTimeout(() => {
				flashes = flashes.filter((f) => f.sequence !== event.sequence);
				pendingTimeouts.delete(timeout);
			}, remainingMs);
			pendingTimeouts.add(timeout);
		}
		lastSeenSequence = events[events.length - 1]!.sequence;
	});

	// A separate, dependency-free effect purely so its cleanup (only fires once, on destroy) clears
	// any still-pending timers instead of leaking them past the component's lifetime.
	$effect(() => {
		return () => {
			for (const timeout of pendingTimeouts) clearTimeout(timeout);
			pendingTimeouts.clear();
		};
	});

	return {
		get flashes() {
			return flashes.map((f) => f.value);
		}
	};
}
