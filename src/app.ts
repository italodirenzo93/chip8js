import { Chip8, start } from './vm';

window.addEventListener('load', () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;

    const vm = new Chip8(canvas.getContext('2d')!);

    // Files
    const romInput = document.querySelector('#rom-upload') as HTMLInputElement;

    romInput.addEventListener('input', async () => {
        if (romInput.files && romInput.files.length) {
            const file = romInput.files![0];
            const buffer = await file.arrayBuffer();

            vm.reset();
            vm.loadRom(new Uint8Array(buffer));
            start(vm);
        }
    });

    // Input
    const keypad = document.querySelector('.keypad') as HTMLDivElement;

    keypad.addEventListener('mousedown', (e) => {
        if (
            e.target &&
            (e.target as HTMLElement).tagName.toLowerCase() === 'button'
        ) {
            const keyCode = Number(
                (e.target as HTMLElement).dataset['keycode']
            );
            vm.keypad.set(keyCode, true);
        }
    });

    keypad.addEventListener('mouseup', (e) => {
        if (
            e.target &&
            (e.target as HTMLElement).tagName.toLowerCase() === 'button'
        ) {
            const keyCode = Number(
                (e.target as HTMLElement).dataset['keycode']
            );
            vm.keypad.set(keyCode, false);
        }
    });

    const fullscreen = document.querySelector(
        '#fullscreen'
    ) as HTMLButtonElement;

    fullscreen.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            fullscreen.requestFullscreen();
        }
    });
});
