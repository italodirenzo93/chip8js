import { Chip8, DISPLAY_HEIGHT, DISPLAY_WIDTH, start } from './vm';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;

const vm = new Chip8(canvas.getContext('2d')!);

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

const setKeyState = (element: HTMLElement, isDown: boolean) => {
    const keyCode = element.dataset['keycode'];
    if (keyCode) {
        vm.keypad.set(Number(keyCode), isDown);
    }
};

keypad.addEventListener('mousedown', (e) => {
    if (e.target) {
        setKeyState(e.target as HTMLElement, true);
    }
});

keypad.addEventListener('mouseup', (e) => {
    if (e.target) {
        setKeyState(e.target as HTMLElement, false);
    }
});

const fbDump = document.querySelector('#dump-fb') as HTMLButtonElement;
const fbTable = document.querySelector('#fb-table')!;

fbDump.addEventListener('click', () => {
    let html = '';

    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        html += '<tr>';
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
            const on = vm.display[y * DISPLAY_WIDTH + x];
            if (on) {
                html += `<td style="color:white;background:green">${on}</td>`;
            } else {
                html += `<td>${on}</td>`;
            }
        }
        html += '</tr>';
    }

    fbTable.innerHTML = html;
});
