import { setVolume } from './audio';
import { Chip8, start } from './vm';
import { KeypadButton, KeymapRow } from './customElements';

customElements.define('keypad-button', KeypadButton, { extends: 'button' });
customElements.define('keymap-row', KeymapRow, { extends: 'tr' });

const canvas = document.querySelector('canvas') as HTMLCanvasElement;

const vm = new Chip8(canvas.getContext('2d')!);

vm.attachListeners();

// Files
const romInput = document.querySelector('#rom-upload') as HTMLInputElement;

romInput.addEventListener('input', async () => {
    if (romInput.files && romInput.files.length) {
        const file = romInput.files[0];
        const buffer = await file.arrayBuffer();

        vm.reset();
        vm.loadRom(new Uint8Array(buffer));
        start(vm);
    }
});

// Input
const keypad = document.querySelector('.keypad') as HTMLDivElement;

keypad.addEventListener('mousedown', (e) => {
    if (e.target instanceof KeypadButton) {
        // setKeyState(e.target as HTMLElement, true);
        vm.keypad.set(e.target.keycode, true);
    }
});

keypad.addEventListener('mouseup', (e) => {
    if (e.target instanceof KeypadButton) {
        // setKeyState(e.target as HTMLElement, false);
        vm.keypad.set(e.target.keycode, false);
    }
});

const volumeSlider = document.querySelector('#volume') as HTMLInputElement;

volumeSlider.addEventListener('input', () => {
    const volume = Number(volumeSlider.value);
    setVolume(volume);
});
