import { executeOpcode } from "./opcodes";

export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;

const ROM_START_OFFSET = 0x200;
const UPDATE_FREQ_HZ = 16.666666666667;

// The character set for the emulator
const fontRom = new Uint8Array([
    // 4x5 font sprites (0-F)
    0xF0, 0x90, 0x90, 0x90, 0xF0,
    0x20, 0x60, 0x20, 0x20, 0x70,
    0xF0, 0x10, 0xF0, 0x80, 0xF0,
    0xF0, 0x10, 0xF0, 0x10, 0xF0,
    0xA0, 0xA0, 0xF0, 0x20, 0x20,
    0xF0, 0x80, 0xF0, 0x10, 0xF0,
    0xF0, 0x80, 0xF0, 0x90, 0xF0,
    0xF0, 0x10, 0x20, 0x40, 0x40,
    0xF0, 0x90, 0xF0, 0x90, 0xF0,
    0xF0, 0x90, 0xF0, 0x10, 0xF0,
    0xF0, 0x90, 0xF0, 0x90, 0x90,
    0xE0, 0x90, 0xE0, 0x90, 0xE0,
    0xF0, 0x80, 0x80, 0x80, 0xF0,
    0xE0, 0x90, 0x90, 0x90, 0xE0,
    0xF0, 0x80, 0xF0, 0x80, 0xF0,
    0xF0, 0x80, 0xF0, 0x80, 0x80,
]);

export class Chip8 {
    /**
     * @param {CanvasRenderingContext2D} context The drawing context to use
     */
    constructor(context) {
        this.ctx = context;

        // Main VM memory
        // this.buffer = new ArrayBuffer(4096);

        // Read/write access
        this.memory = new Uint8Array(4096);

        // Create some spans over specific regions of memory
        // this.rom = new Uint8Array(this.buffer, 0x200, 3232);

        // Call stack
        this.stack = [];

        // Registers (V0-VF)
        this.v = new Uint8Array(16);

        // Keypad
        this.keypad = new Uint8ClampedArray(16);

        this.reset();
    }

    get opcode() {
        const msb = this.memory[this.pc];
        const lsb = this.memory[this.pc + 1];

        return msb << 8 | lsb;
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
    }

    step() {
        this.pc += 2;
    }

    /**
     * Copies the ROM data into memory.
     *
     * @param {Uint8Array} rom The CHIP-8 program to load
     */
    loadRom(rom) {
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
    onKeyDown(evt) {
        const key = mapKeyCode(evt.code);
        if (!key) {
            return;
        }

        this.keypad[key] = 1;
    }

    /**
     * @param {KeyboardEvent} evt Key press event
     */
    onKeyUp(evt) {
        const key = mapKeyCode(evt.code);
        if (!key) {
            return;
        }

        this.keypad[key] = 0;
    }
}

/**
 * @param {string} keyCode
 */
export function mapKeyCode(keyCode) {
    switch (keyCode) {
        case 'Digit1':
            return 0x1;
        case 'Digit2':
            return 0x2;
        case 'Digit3':
            return 0x3;
        case 'Digit4':
            return 0xC;

        case 'KeyQ':
            return 0x4;
        case 'KeyW':
            return 0x5;
        case 'KeyE':
            return 0x6;
        case 'KeyR':
            return 0xD;

        case 'KeyA':
            return 0x7;
        case 'KeyS':
            return 0x8;
        case 'KeyD':
            return 0x9;
        case 'KeyF':
            return 0xE;

        case 'KeyZ':
            return 0xA;
        case 'KeyX':
            return 0x0;
        case 'KeyC':
            return 0xB;
        case 'KeyV':
            return 0xF;

        default:
            return -1;
    }
}

/**
 * Starts the currently loaded program.
 *
 * @param {Chip8} vm
 */
export function start(vm) {
    setTimeout(() => update(vm), UPDATE_FREQ_HZ);
}

/**
 * @param {Chip8} vm
 */
function update(vm) {
    const next = executeOpcode(vm, vm.opcode);

    // Count down timers
    if (vm.delayTimer > 0) {
        vm.delayTimer--;
    }
    if (vm.soundTimer > 0) {
        vm.soundTimer--;
    }

    if (next) {
        setTimeout(() => update(vm), UPDATE_FREQ_HZ);
    }
}
