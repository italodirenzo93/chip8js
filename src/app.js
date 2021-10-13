import { executeOpcode } from "./opcodes";

const DISPLAY_WIDTH = 64;
const DISPLAY_HEIGHT = 32;

const UPDATE_FREQ_HZ = 60;

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
        const buffer = new ArrayBuffer(4096);

        // Read/write access
        this.memory = new Uint8Array(buffer);

        // Create some spans over specific regions of memory
        this.rom = new Uint8Array(buffer, 0x200, 3232);
        this.stack = new Uint8Array(buffer, 0xEA0, 96);
        this.display = new Uint8ClampedArray(buffer, 0xF00, 256);

        // Registers (V0-VF)
        this.v = new Uint8Array(16);

        // Index register
        this.i = 0;

        // Program counter
        this.pc = 0;

        // Stack pointer
        this.sp = 0;

        // Timers
        this.delayTimer = 0;
        this.soundTimer = 0;

        // Keypad
        this.keypad = new Uint8ClampedArray(16);
        this.attachListeners();

        // Load font into memory (at the very start)
        for (let i = 0; i < fontRom.length; i++) {
            this.memory[i] = fontRom[i];
        }

        this.running = false;
    }

    get opcode() {
        const msb = this.memory[this.pc];
        const lsb = this.memory[this.pc + 1];

        return msb << 8 | lsb;
    }

    step() {
        this.pc += 2;

        return this;
    }

    /**
     * Copies the ROM data into memory.
     *
     * @param {Uint8Array} rom The CHIP-8 program to load
     */
    loadRom(rom) {
        for (let i = 0; i < rom.length; i++) {
            this.rom[i] = rom[i];
        }
    }

    /**
     * Draws the current state the VM to the canvas.
     */
    drawDisplay() {
        const bitmap = this.ctx.createImageData(DISPLAY_WIDTH, DISPLAY_HEIGHT);

        let x, y;
        for (y = 0; y < DISPLAY_HEIGHT; y++) {
            for (x = 0; x < DISPLAY_WIDTH; x++) {
                const pixel = getPixel(this, x, y) > 0 ? 255 : 0;

                const index = (y * DISPLAY_WIDTH * 4) + (x * 4);

                bitmap.data[index] = pixel;
                bitmap.data[index + 1] = pixel;
                bitmap.data[index + 2] = pixel;
                bitmap.data[index + 3] = 255; // opaque
            }
        }

        this.ctx.putImageData(bitmap, 0, 0);
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
function mapKeyCode(keyCode) {
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
 * @param {Chip8} vm CHIP-8 instance
 * @param {number} x The X coordinate
 * @param {number} y The Y coordinate
 */
export function getPixel(vm, x, y) {
    const index = y * DISPLAY_WIDTH + x;
    const byteIndex = index / 8;
    const offset = index % 8;
    return vm.display[byteIndex] & (0x80 >> offset);
}

/**
 * @param {Chip8} vm CHIP-8 instance
 * @param {number} x The X coordinate
 * @param {number} y The Y coordinate
 * @param {number} value The pixel value
 */
 export function setPixel(vm, x, y, value) {
    const index = y * DISPLAY_WIDTH + x;
    const byteIndex = index / 8;
    const offset = index % 8;

    const byte = vm.display[byteIndex];

    if (value > 0) {
        byte = byte | (0x80 >> offset);
    } else {
        byte = byte & (~(0x80 >> offset));
    }

    vm.display[byteIndex] = byte;
}

/**
 * Starts the currently loaded program.
 *
 * @param {Chip8} vm
 */
export function start(vm) {
    if (vm.running) {
        throw new Error('Virtual machine already running');
    }

    vm.running = true;

    setTimeout(() => update(vm), UPDATE_FREQ_HZ);
}

/**
 * @param {Chip8} vm
 */
function update(vm) {
    console.log(vm.opcode);
    executeOpcode(vm);

    if (vm.running) {
        setTimeout(() => update(vm), UPDATE_FREQ_HZ);
    }
}
