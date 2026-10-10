import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UiSoundName } from './tone-sequences';
import { attachUiSounds } from './ui-sound-controller';
import type { UiSoundPlayer } from './ui-sound-player';

interface PlayedSound {
	sound: UiSoundName;
	pitchRatio: number | undefined;
}

class RecordingSoundPlayer implements UiSoundPlayer {
	played: PlayedSound[] = [];
	play(sound: UiSoundName, pitchRatio?: number) {
		this.played.push({ sound, pitchRatio });
	}
	get names() {
		return this.played.map((entry) => entry.sound);
	}
}

class ManualClock {
	nowMs = 0;
	advance(milliseconds: number) {
		this.nowMs += milliseconds;
	}
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('attachUiSounds', () => {
	let container: HTMLDivElement;
	let player: RecordingSoundPlayer;
	let clock: ManualClock;
	let enabled: boolean;
	let detach: () => void;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.append(container);
		player = new RecordingSoundPlayer();
		clock = new ManualClock();
		enabled = true;
		detach = attachUiSounds({ root: container, player, clock: { nowMs: () => clock.nowMs }, isEnabled: () => enabled });
	});

	afterEach(() => {
		detach();
		container.remove();
	});

	function add<T extends HTMLElement>(element: T): T {
		container.append(element);
		return element;
	}

	function button(label = 'Go'): HTMLButtonElement {
		const element = document.createElement('button');
		element.textContent = label;
		return add(element);
	}

	function slider(min: string, max: string, value: string): HTMLInputElement {
		const element = document.createElement('input');
		element.type = 'range';
		element.min = min;
		element.max = max;
		element.value = value;
		return add(element);
	}

	function warnedSlider(value: string): HTMLInputElement {
		const element = slider('0', '1100', value);
		element.dataset.warnAbove = '1000';
		element.dataset.warnBelow = '100';
		return element;
	}

	function moveTo(element: HTMLInputElement, value: string) {
		element.value = value;
		element.dispatchEvent(new Event('input', { bubbles: true }));
		clock.advance(100);
	}

	function plot(): HTMLDivElement {
		const element = document.createElement('div');
		element.setAttribute('data-ui-sound', 'plotSelect');
		return add(element);
	}

	function pointer(type: string, buttons = 1): PointerEvent {
		return new PointerEvent(type, { bubbles: true, buttons });
	}

	it('plays the button sound when a button is clicked', () => {
		button().click();

		expect(player.names).toEqual(['button']);
	});

	it('plays the button sound when something inside a button is clicked', () => {
		const element = button();
		const icon = document.createElement('span');
		element.append(icon);

		icon.click();

		expect(player.names).toEqual(['button']);
	});

	it('stays silent when a disabled button is clicked', () => {
		const element = button();
		element.disabled = true;

		element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(player.names).toEqual([]);
	});

	it('plays the navigate sound when a link is clicked', () => {
		const link = document.createElement('a');
		link.href = '#somewhere';
		add(link).click();

		expect(player.names).toEqual(['navigate']);
	});

	it('stays silent when plain text is clicked', () => {
		add(document.createElement('p')).click();

		expect(player.names).toEqual([]);
	});

	it('plays the slider sound with a pitch that follows the slider position', () => {
		const element = slider('0', '200', '50');

		element.dispatchEvent(new Event('input', { bubbles: true }));

		expect(player.played).toEqual([{ sound: 'slider', pitchRatio: 0.25 }]);
	});

	it('uses the middle pitch for a slider whose range is empty', () => {
		const element = slider('5', '5', '5');

		element.dispatchEvent(new Event('input', { bubbles: true }));

		expect(player.played[0]!.pitchRatio).toBe(0.5);
	});

	it('limits slider sounds while a slider is dragged quickly', () => {
		const element = slider('0', '100', '10');

		for (let step = 0; step < 5; step++) {
			element.dispatchEvent(new Event('input', { bubbles: true }));
			clock.advance(10);
		}

		expect(player.played.length).toBeLessThan(5);
	});

	it('plays another slider sound once enough time has passed', () => {
		const element = slider('0', '100', '10');
		element.dispatchEvent(new Event('input', { bubbles: true }));

		clock.advance(100);
		element.dispatchEvent(new Event('input', { bubbles: true }));

		expect(player.names).toEqual(['slider', 'slider']);
	});

	it('plays the select sound when a dropdown value changes', () => {
		const element = add(document.createElement('select'));

		element.dispatchEvent(new Event('change', { bubbles: true }));

		expect(player.names).toEqual(['select']);
	});

	it('plays the select sound when a text field is committed', () => {
		const element = document.createElement('input');
		element.type = 'text';
		add(element).dispatchEvent(new Event('change', { bubbles: true }));

		expect(player.names).toEqual(['select']);
	});

	it('stays silent when a slider is released, since it already ticked while moving', () => {
		const element = slider('0', '100', '40');

		element.dispatchEvent(new Event('change', { bubbles: true }));

		expect(player.names).toEqual([]);
	});

	it('plays toggleOn when a checkbox is ticked', () => {
		const element = document.createElement('input');
		element.type = 'checkbox';
		element.checked = true;
		add(element).dispatchEvent(new Event('change', { bubbles: true }));

		expect(player.names).toEqual(['toggleOn']);
	});

	it('plays toggleOff when a checkbox is cleared', () => {
		const element = document.createElement('input');
		element.type = 'checkbox';
		element.checked = false;
		add(element).dispatchEvent(new Event('change', { bubbles: true }));

		expect(player.names).toEqual(['toggleOff']);
	});

	it('plays the plot sound as soon as the pointer goes down on a plot', () => {
		plot().dispatchEvent(pointer('pointerdown'));

		expect(player.names).toEqual(['plotSelect']);
	});

	it('does not play a second sound for the click that follows a pointer press on a plot', () => {
		const element = plot();
		element.dispatchEvent(pointer('pointerdown'));

		element.click();

		expect(player.names).toEqual(['plotSelect']);
	});

	it('plays the button sound for a later click on a button after a plot press', () => {
		const element = plot();
		element.dispatchEvent(pointer('pointerdown'));
		element.click();

		button().click();

		expect(player.names).toEqual(['plotSelect', 'button']);
	});

	it('ticks while the pointer is dragged across a plot', () => {
		const element = plot();
		element.dispatchEvent(pointer('pointerdown'));
		clock.advance(100);

		element.dispatchEvent(pointer('pointermove'));

		expect(player.names).toEqual(['plotSelect', 'plotDrag']);
	});

	it('limits plot drag ticks when the pointer moves very quickly', () => {
		const element = plot();
		element.dispatchEvent(pointer('pointerdown'));

		for (let step = 0; step < 5; step++) {
			clock.advance(10);
			element.dispatchEvent(pointer('pointermove'));
		}

		expect(player.names.filter((name) => name === 'plotDrag').length).toBeLessThan(5);
	});

	it('stays silent when the pointer only hovers over a plot', () => {
		plot().dispatchEvent(pointer('pointermove', 0));

		expect(player.names).toEqual([]);
	});

	it('plays the error sound when an alert appears', async () => {
		const alert = document.createElement('p');
		alert.setAttribute('role', 'alert');
		alert.textContent = 'No functional torpedo tubes';

		add(alert);
		await settle();

		expect(player.names).toEqual(['error']);
	});

	it('plays the error sound when an alert appears inside a container that was added', async () => {
		const wrapper = document.createElement('div');
		const alert = document.createElement('p');
		alert.setAttribute('role', 'alert');
		wrapper.append(alert);

		add(wrapper);
		await settle();

		expect(player.names).toEqual(['error']);
	});

	it('stays silent when ordinary content is added', async () => {
		add(document.createElement('p'));
		await settle();

		expect(player.names).toEqual([]);
	});

	it('stays silent for every interaction while sound is turned off', async () => {
		enabled = false;

		button().click();
		slider('0', '10', '5').dispatchEvent(new Event('input', { bubbles: true }));
		plot().dispatchEvent(pointer('pointerdown'));
		const alert = document.createElement('p');
		alert.setAttribute('role', 'alert');
		add(alert);
		await settle();

		expect(player.names).toEqual([]);
	});

	it('starts playing again when sound is turned back on', () => {
		enabled = false;
		button().click();

		enabled = true;
		button().click();

		expect(player.names).toEqual(['button']);
	});

	it('stops playing sounds once detached', async () => {
		detach();

		button().click();
		const alert = document.createElement('p');
		alert.setAttribute('role', 'alert');
		add(alert);
		await settle();

		expect(player.names).toEqual([]);
	});

	it('sounds the overdrive warning when a slider is dragged above its upper limit', () => {
		const element = warnedSlider('500');

		moveTo(element, '1050');

		expect(player.names).toEqual(['overdriveWarning']);
	});

	it('sounds the below-minimum warning when a slider is dragged under its lower limit', () => {
		const element = warnedSlider('500');

		moveTo(element, '50');

		expect(player.names).toEqual(['belowMinimumWarning']);
	});

	it('plays ordinary ticks, not another warning, while the slider stays in the same warning zone', () => {
		const element = warnedSlider('500');
		moveTo(element, '1050');

		moveTo(element, '1080');

		expect(player.names).toEqual(['overdriveWarning', 'slider']);
	});

	it('warns again after the slider leaves the warning zone and re-enters it', () => {
		const element = warnedSlider('500');
		moveTo(element, '1050');
		moveTo(element, '900');

		moveTo(element, '1050');

		expect(player.names).toEqual(['overdriveWarning', 'slider', 'overdriveWarning']);
	});

	it('does not warn at exactly the upper or lower limit', () => {
		const element = warnedSlider('500');

		moveTo(element, '1000');
		moveTo(element, '100');

		expect(player.names).toEqual(['slider', 'slider']);
	});

	it('moves straight from one warning zone to the other with the matching warning', () => {
		const element = warnedSlider('1050');
		moveTo(element, '1060');

		moveTo(element, '20');

		expect(player.names).toEqual(['overdriveWarning', 'belowMinimumWarning']);
	});

	it('plays an ordinary slider tick instead of a warning for a slider with no limits', () => {
		const element = slider('0', '1100', '500');

		moveTo(element, '1090');

		expect(player.names).toEqual(['slider']);
	});

	it('stays silent for warnings while sound is turned off', () => {
		const element = warnedSlider('500');
		enabled = false;

		moveTo(element, '1050');

		expect(player.names).toEqual([]);
	});
});
