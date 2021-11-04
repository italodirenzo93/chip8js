import { executeOpcode } from './opcodes';

export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;

const ROM_START_OFFSET = 0x200;
const UPDATE_FREQ_HZ = 16.666666666667;

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

const PIXEL_ON_COLOR: RgbColor = {
    r: 0xff,
    g: 0xff,
    b: 0xff,
};
const PIXEL_OFF_COLOR: RgbColor = {
    r: 0x00,
    g: 0x00,
    b: 0x00,
};

// The character set for the emulator
const fontRom = new Uint8Array([
    // 4x5 font sprites (0-F)
    0xf0, 0x90, 0x90, 0x90, 0xf0, 0x20, 0x60, 0x20, 0x20, 0x70, 0xf0, 0x10,
    0xf0, 0x80, 0xf0, 0xf0, 0x10, 0xf0, 0x10, 0xf0, 0xa0, 0xa0, 0xf0, 0x20,
    0x20, 0xf0, 0x80, 0xf0, 0x10, 0xf0, 0xf0, 0x80, 0xf0, 0x90, 0xf0, 0xf0,
    0x10, 0x20, 0x40, 0x40, 0xf0, 0x90, 0xf0, 0x90, 0xf0, 0xf0, 0x90, 0xf0,
    0x10, 0xf0, 0xf0, 0x90, 0xf0, 0x90, 0x90, 0xe0, 0x90, 0xe0, 0x90, 0xe0,
    0xf0, 0x80, 0x80, 0x80, 0xf0, 0xe0, 0x90, 0x90, 0x90, 0xe0, 0xf0, 0x80,
    0xf0, 0x80, 0xf0, 0xf0, 0x80, 0xf0, 0x80, 0x80,
]);

export class Chip8 {
    /**
     * Main memory.
     */
    memory = new Uint8Array(4096);

    /**
     * Program counter.
     */
    pc = ROM_START_OFFSET;

    /**
     * Call stack.
     */
    stack: number[] = [];

    /**
     * Registers.
     */
    v = new Uint8Array(16);

    /**
     * Index register.
     */
    i = 0;

    /**
     * Key states.
     */
    keypad = new Map<number, boolean>();

    /**
     * Framebuffer to be drawn.
     */
    display = new Uint8ClampedArray(DISPLAY_WIDTH * DISPLAY_HEIGHT);

    /**
     * Delay timer.
     */
    delayTimer = 0;

    /**
     * A tone is played when this counter is non-zero.
     */
    soundTimer = 0;

    /**
     * Flag indicating if the program is being executed.
     */
    running = false;

    /**
     * The last exit code returned by the program.
     */
    exitCode = 0;

    /**
     * @param {CanvasRenderingContext2D} ctx The drawing context to use
     */
    constructor(private readonly ctx: CanvasImageData) {}

    get opcode() {
        const msb = this.memory[this.pc];
        const lsb = this.memory[this.pc + 1];

        return (msb << 8) | lsb;
    }

    reset() {
        // Index register
        this.i = 0;

        // Program counter
        this.pc = ROM_START_OFFSET;

        // Timers
        this.delayTimer = 0;
        this.soundTimer = 0;

        // Zero out all memory
        this.memory.fill(0x00);
        if (this.stack.length) {
            this.stack = [];
        }

        this.display.fill(0x0);
    }

    step() {
        this.pc += 2;
    }

    /**
     * Copies the ROM data into memory.
     *
     * @param {Uint8Array} rom The CHIP-8 program to load
     */
    loadRom(rom: Uint8Array) {
        let i;

        // Load the rom data at program start location
        for (i = 0; i < rom.length; i++) {
            this.memory[i + ROM_START_OFFSET] = rom[i];
        }

        // Load font into memory (at the very start)
        for (i = 0; i < fontRom.length; i++) {
            this.memory[i] = fontRom[i];
        }
    }

    /**
     * Attach DOM event listeners.
     */
    attachListeners() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    /**
     * Remove DOM event listeners.
     */
    detachListeners() {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
    }

    /**
     * @param {KeyboardEvent} evt Key press event
     */
    onKeyDown(evt: KeyboardEvent) {
        const key = mapKeyCode(evt.code);
        if (!key) {
            return;
        }

        this.keypad.set(key, true);
    }

    /**
     * @param {KeyboardEvent} evt Key press event
     */
    onKeyUp(evt: KeyboardEvent) {
        const key = mapKeyCode(evt.code);
        if (!key) {
            return;
        }

        this.keypad.set(key, false);
    }

    drawDisplay() {
        const frame = this.ctx.createImageData(DISPLAY_WIDTH, DISPLAY_HEIGHT);
        const length = DISPLAY_WIDTH * DISPLAY_HEIGHT;

        for (let i = 0; i < length; i++) {
            const frameIndex = i * 4;
            const pixelColor =
                this.display[i] > 0 ? PIXEL_ON_COLOR : PIXEL_OFF_COLOR;

            frame.data[frameIndex] = pixelColor.r;
            frame.data[frameIndex + 1] = pixelColor.g;
            frame.data[frameIndex + 2] = pixelColor.b;
            frame.data[frameIndex + 3] = 0xff; // opaque
        }

        this.ctx.putImageData(frame, 0, 0);
    }
}

/**
 * @param {string} keyCode
 */
export function mapKeyCode(keyCode: string): number {
    switch (keyCode) {
        case 'Digit1':
            return 0x1;
        case 'Digit2':
            return 0x2;
        case 'Digit3':
            return 0x3;
        case 'Digit4':
            return 0xc;

        case 'KeyQ':
            return 0x4;
        case 'KeyW':
            return 0x5;
        case 'KeyE':
            return 0x6;
        case 'KeyR':
            return 0xd;

        case 'KeyA':
            return 0x7;
        case 'KeyS':
            return 0x8;
        case 'KeyD':
            return 0x9;
        case 'KeyF':
            return 0xe;

        case 'KeyZ':
            return 0xa;
        case 'KeyX':
            return 0x0;
        case 'KeyC':
            return 0xb;
        case 'KeyV':
            return 0xf;

        default:
            return -1;
    }
}

/**
 * Starts the currently loaded program.
 *
 * @param {Chip8} vm
 */
export function start(vm: Chip8) {
    vm.running = true;
    setTimeout(() => update(vm), UPDATE_FREQ_HZ);
}

/**
 * @param {Chip8} vm
 */
function update(vm: Chip8) {
    executeOpcode(vm, vm.opcode);

    // Count down timers
    if (vm.delayTimer > 0) {
        vm.delayTimer--;
    }
    if (vm.soundTimer > 0) {
        vm.soundTimer--;
    }

    if (vm.running) {
        setTimeout(() => update(vm), UPDATE_FREQ_HZ);
    }
}
