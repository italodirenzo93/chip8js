import { Chip8, start } from './vm';

window.addEventListener('load', () => {
    const canvas = document.querySelector('#screen');

    const vm = new Chip8(canvas.getContext('2d'));

    const romInput = document.querySelector('#rom-upload');

    romInput.addEventListener('input', async () => {
        const file = romInput.files[0];
        const buffer = await file.arrayBuffer();

        vm.reset();
        vm.loadRom(new Uint8Array(buffer));
        start(vm);
    });

    // Input
    const keypad = document.querySelector('.keypad');

    keypad.addEventListener('mousedown', (e) => {
        if (e.target.tagName.toLowerCase() === 'button') {
            const keyCode = Number(e.target.dataset['keycode']);
            vm.keypad[keyCode] = 1;
        }
    });

    keypad.addEventListener('mouseup', (e) => {
        if (e.target.tagName.toLowerCase() === 'button') {
            const keyCode = Number(e.target.dataset['keycode']);
            vm.keypad[keyCode] = 0;
        }
    });
});
