import type { UiSoundPlayer } from './ui-sound-player.js';
import type { UiSoundName } from './tone-sequences.js';

export interface Clock {
	nowMs(): number;
}

export interface UiSoundOptions {
	root: Document | HTMLElement;
	player: UiSoundPlayer;
	clock: Clock;
	isEnabled: () => boolean;
}

const SLIDER_MINIMUM_INTERVAL_MS = 45;
const PLOT_DRAG_MINIMUM_INTERVAL_MS = 70;
const PRIMARY_BUTTON_MASK = 1;
const SOUND_ATTRIBUTE = 'data-ui-sound';

type SliderZone = 'normal' | 'overdrive' | 'belowMinimum';

function elementFrom(target: EventTarget | null): Element | null {
	return target instanceof Element ? target : null;
}

function soundNameFromAttribute(element: Element): UiSoundName | null {
	const owner = element.closest(`[${SOUND_ATTRIBUTE}]`);
	return (owner?.getAttribute(SOUND_ATTRIBUTE) as UiSoundName | null) ?? null;
}

function sliderPitchRatio(slider: HTMLInputElement): number {
	const minimum = Number(slider.min || 0);
	const maximum = Number(slider.max || 100);
	return maximum > minimum ? (Number(slider.value) - minimum) / (maximum - minimum) : 0.5;
}

function sliderZone(slider: HTMLInputElement): SliderZone {
	const value = Number(slider.value);
	const warnAbove = slider.dataset.warnAbove;
	const warnBelow = slider.dataset.warnBelow;
	if (warnAbove !== undefined && value > Number(warnAbove)) return 'overdrive';
	if (warnBelow !== undefined && value < Number(warnBelow)) return 'belowMinimum';
	return 'normal';
}

const WARNING_SOUND_FOR_ZONE: Record<SliderZone, UiSoundName | null> = {
	normal: null,
	overdrive: 'overdriveWarning',
	belowMinimum: 'belowMinimumWarning'
};

function soundForClick(target: Element): UiSoundName | null {
	if (target.closest('a[href]')) return 'navigate';
	if (target.closest('button:not(:disabled)')) return 'button';
	return null;
}

function soundForChange(target: Element): UiSoundName | null {
	if (target instanceof HTMLInputElement && target.type === 'range') return null;
	if (target instanceof HTMLInputElement && target.type === 'checkbox') return target.checked ? 'toggleOn' : 'toggleOff';
	if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return 'select';
	return null;
}

function containsAlert(node: Node): boolean {
	return node instanceof Element && (node.matches('[role="alert"]') || node.querySelector('[role="alert"]') !== null);
}

export function attachUiSounds(options: UiSoundOptions): () => void {
	const { root, player, clock, isEnabled } = options;
	const lastPlayedAtMs = new Map<UiSoundName, number>();
	const previousSliderZones = new WeakMap<HTMLInputElement, SliderZone>();
	let clickAlreadySoundedByPointerDown = false;

	function play(sound: UiSoundName, pitchRatio?: number, minimumIntervalMs = 0): void {
		if (!isEnabled()) return;
		const nowMs = clock.nowMs();
		const previousMs = lastPlayedAtMs.get(sound);
		if (previousMs !== undefined && nowMs - previousMs < minimumIntervalMs) return;
		lastPlayedAtMs.set(sound, nowMs);
		player.play(sound, pitchRatio);
	}

	function onPointerDown(event: Event): void {
		clickAlreadySoundedByPointerDown = false;
		const target = elementFrom(event.target);
		const sound = target && soundNameFromAttribute(target);
		if (!sound) return;
		clickAlreadySoundedByPointerDown = true;
		play(sound);
	}

	function onPointerMove(event: Event): void {
		const target = elementFrom(event.target);
		const isDraggingPrimary = ((event as PointerEvent).buttons & PRIMARY_BUTTON_MASK) !== 0;
		if (!target || !isDraggingPrimary || !soundNameFromAttribute(target)) return;
		play('plotDrag', undefined, PLOT_DRAG_MINIMUM_INTERVAL_MS);
	}

	function onClick(event: Event): void {
		if (clickAlreadySoundedByPointerDown) {
			clickAlreadySoundedByPointerDown = false;
			return;
		}
		const target = elementFrom(event.target);
		const sound = target && soundForClick(target);
		if (sound) play(sound);
	}

	function warningEnteredBy(slider: HTMLInputElement): UiSoundName | null {
		const previousZone = previousSliderZones.get(slider) ?? 'normal';
		const currentZone = sliderZone(slider);
		previousSliderZones.set(slider, currentZone);
		return currentZone === previousZone ? null : WARNING_SOUND_FOR_ZONE[currentZone];
	}

	function onInput(event: Event): void {
		const target = event.target;
		if (!(target instanceof HTMLInputElement) || target.type !== 'range') return;
		const warning = warningEnteredBy(target);
		if (warning) play(warning);
		else play('slider', sliderPitchRatio(target), SLIDER_MINIMUM_INTERVAL_MS);
	}

	function onChange(event: Event): void {
		const target = elementFrom(event.target);
		const sound = target && soundForChange(target);
		if (sound) play(sound);
	}

	function onMutations(mutations: MutationRecord[]): void {
		const alertAppeared = mutations.some((mutation) => Array.from(mutation.addedNodes).some(containsAlert));
		if (alertAppeared) play('error');
	}

	const alertObserver = new MutationObserver(onMutations);
	alertObserver.observe(root instanceof Document ? root.body : root, { childList: true, subtree: true });

	const listeners: Array<[string, (event: Event) => void]> = [
		['pointerdown', onPointerDown],
		['pointermove', onPointerMove],
		['click', onClick],
		['input', onInput],
		['change', onChange]
	];
	for (const [type, listener] of listeners) root.addEventListener(type, listener, true);

	return () => {
		alertObserver.disconnect();
		for (const [type, listener] of listeners) root.removeEventListener(type, listener, true);
	};
}
