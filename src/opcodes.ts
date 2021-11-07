import { Chip8, DISPLAY_WIDTH, DISPLAY_HEIGHT } from './vm';

/**
 * @param {Chip8} vm
 * @param {number} opcode
 */
export function executeOpcode(vm: Chip8, opcode: number): boolean {
    //console.log('Executing: ' + formatOpcode(opcode));

    switch (opcode & 0xf000) {
        // Call a machine code routine
        case 0x0000:
            if ((opcode & 0x00ff) === 0x00e0) {
                // Clear the display
                vm.display.fill(0x00);
                vm.drawDisplay();
                vm.step();
            } else if ((opcode & 0x00ff) === 0x00ee) {
                // Return from sub-routine
                const addr = vm.stack.pop();
                if (!addr) {
                    throw new Error('No address found on the stack.');
                }

                vm.pc = addr;
                vm.step();
            } else if ((opcode & 0x00f0) === 0x0010) {
                // Exit program
                console.log('Program terminated.');
                vm.running = false;
                vm.exitCode = opcode & 0x000f;
                return false;
            } else {
                // Unknown opcode
                throw new Error('Unrecognized opcode: ' + formatOpcode(opcode));
            }

            break;

        // JUMP
        case 0x1000:
            vm.pc = opcode & 0x0fff;
            break;

        // Call sub-routine
        case 0x2000:
            vm.stack.push(vm.pc);
            vm.pc = opcode & 0x0fff;
            break;

        // Equals
        case 0x3000:
            if (vm.v[(opcode & 0x0f00) >> 8] === (opcode & 0x00ff)) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // Not Equals
        case 0x4000:
            if (vm.v[(opcode & 0x0f00) >> 8] !== (opcode & 0x00ff)) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // VX Equals VY
        case 0x5000:
            if (vm.v[(opcode & 0x0f00) >> 8] === vm.v[(opcode & 0x00f0) >> 4]) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // Assign
        case 0x6000:
            vm.v[(opcode & 0x0f00) >> 8] = opcode & 0x00ff;
            vm.step();
            break;

        // Addition
        case 0x7000:
            vm.v[(opcode & 0x0f00) >> 8] += opcode & 0x00ff;
            vm.step();
            break;

        // Arithmetic
        case 0x8000:
            {
                const x = (opcode & 0x0f00) >> 8;
                const y = (opcode & 0x00f0) >> 4;

                switch (opcode & 0x000f) {
                    // Assign VY to VX
                    case 0x0000:
                        vm.v[x] = vm.v[y];
                        vm.step();
                        break;

                    // OR
                    case 0x0001:
                        vm.v[x] |= vm.v[y];
                        vm.step();
                        break;

                    // AND
                    case 0x0002:
                        vm.v[x] &= vm.v[y];
                        vm.step();
                        break;

                    // XOR
                    case 0x0003:
                        vm.v[x] ^= vm.v[y];
                        vm.step();
                        break;

                    // ADD
                    case 0x0004:
                        {
                            const sum = vm.v[x] + vm.v[y];

                            // set carry flag
                            if (sum > 255) {
                                vm.v[0xf] = 1;
                            } else {
                                vm.v[0xf] = 0;
                            }

                            vm.v[x] = sum;

                            vm.step();
                        }
                        break;

                    // SUB
                    case 0x0005:
                        {
                            // set carry flag
                            if (vm.v[x] > vm.v[y]) {
                                vm.v[0xf] = 1;
                            } else {
                                vm.v[0xf] = 0;
                            }

                            vm.v[x] = vm.v[x] - vm.v[y];

                            vm.step();
                        }
                        break;

                    // Bitshift right
                    case 0x0006:
                        vm.v[0xf] = vm.v[x] & 0x1;
                        vm.v[x] = vm.v[y] >> 1;

                        vm.step();
                        break;

                    // SUB reverse
                    case 0x0007:
                        {
                            const vx = vm.v[x];
                            const vy = vm.v[y];

                            vm.v[x] = vy - vx;
                            vm.v[0xf] = vy < vx ? 0 : 1;

                            vm.step();
                        }
                        break;

                    // Bitshift left
                    case 0x000e:
                        vm.v[0xf] = (vm.v[x] >> 7) & 0x1;
                        vm.v[x] = vm.v[y] << 1;

                        vm.step();
                        break;

                    default:
                        throw new Error(
                            'Unrecognized opcode: ' + formatOpcode(opcode)
                        );
                }
            }
            break;

        // VX Not Equals VY
        case 0x9000:
            if (vm.v[(opcode & 0x0f00) >> 8] !== vm.v[(opcode & 0x00f0) >> 4]) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // Set index register
        case 0xa000:
            vm.i = opcode & 0x0fff;
            vm.step();
            break;

        // Jump with offset
        case 0xb000:
            vm.pc = (opcode & 0x00ff) + vm.v[(opcode & 0x0f00) >> 8];
            break;

        // Bitwise random
        case 0xc000:
            vm.v[(opcode & 0x0f00) >> 8] =
                Math.floor(Math.random() * 255) & (opcode & 0x00ff);
            vm.step();
            break;

        // Draw sprite
        case 0xd000:
            {
                let startX = vm.v[(opcode & 0x0f00) >> 8];
                let startY = vm.v[(opcode & 0x00f0) >> 4];
                let height = opcode & 0x000f;

                // Normalize values
                if (startX >= DISPLAY_WIDTH) {
                    startX = startX % DISPLAY_WIDTH;
                }

                if (startY >= DISPLAY_HEIGHT) {
                    startY = startY % DISPLAY_HEIGHT;
                }

                height = Math.min(height, 16);

                const getFrameIndex = (x: number, y: number) =>
                    y * DISPLAY_WIDTH + x;

                const getPixel = (x: number, y: number) =>
                    vm.display[getFrameIndex(x, y)];
                const setPixel = (x: number, y: number, value: number) =>
                    (vm.display[getFrameIndex(x, y)] = value);

                let endX = Math.min(startX + 8, DISPLAY_WIDTH);
                let endY = Math.min(startY + height, DISPLAY_HEIGHT);

                vm.v[0xf] = 0x0;

                for (let y = startY; y < endY; y++) {
                    const spriteByte = vm.memory[vm.i + (y - startY)];
                    for (let x = startX; x < endX; x++) {
                        const spritePixel = spriteByte & (0x80 >> (x - startX));
                        const screenPixel = getPixel(x, y);

                        if (spritePixel) {
                            if (screenPixel) {
                                vm.v[0xf] = 0x1;
                            }

                            setPixel(x, y, spritePixel ^ screenPixel);
                        }
                    }
                }

                vm.drawDisplay();
                vm.step();
            }
            break;

        // Check keypad
        case 0xe000:
            {
                const keycode = (opcode & 0x0f00) >> 8;

                switch (opcode & 0x00ff) {
                    // Key down
                    case 0x009e:
                        if (vm.keypad.get(keycode)) {
                            vm.step(); // skip the next instruction
                        }

                        vm.step();
                        break;

                    // Key up
                    case 0x00a1:
                        if (!vm.keypad.get(keycode)) {
                            vm.step(); // skip the next instruction
                        }

                        vm.step();
                        break;
                }
            }
            break;

        // Other
        case 0xf000:
            {
                const x = (opcode & 0x0f00) >> 8;

                switch (opcode & 0x00ff) {
                    // Read delay timer
                    case 0x0007:
                        vm.v[x] = vm.delayTimer;
                        vm.step();
                        break;

                    // Key wait
                    // case 0x000A:
                    //     {
                    //         const key = vm.keypad.findIndex(k => k === 1);
                    //         if (key === -1) {
                    //             // Return early without advancing and wait for a keypress
                    //             return true;
                    //         }

                    //         // Place the pressed key in the specified register
                    //         vm.v[x] = key;

                    //         vm.step();
                    //     }
                    //     break;

                    // Set delay timer
                    case 0x0015:
                        vm.delayTimer = x;
                        vm.step();
                        break;

                    // Set sound timer
                    case 0x0018:
                        vm.soundTimer = vm.v[x];
                        vm.step();
                        break;

                    // Add to index
                    case 0x001e:
                        vm.i += vm.v[x];
                        vm.step();
                        break;

                    // Set font character
                    case 0x0029:
                        vm.i = vm.v[x] * 5;
                        vm.step();
                        break;

                    // Store BCD
                    case 0x0033:
                        vm.memory[vm.i] = vm.v[x] / 100;
                        vm.memory[vm.i + 1] = (vm.v[x] % 100) / 10;
                        vm.memory[vm.i + 2] = vm.v[x] % 10;

                        vm.step();
                        break;

                    // Store
                    case 0x0055:
                        for (let i = 0; i <= x; i++) {
                            vm.memory[vm.i + i] = vm.v[i];
                        }

                        vm.step();
                        break;

                    // Load
                    case 0x0065:
                        for (let i = 0; i <= x; i++) {
                            vm.v[i] = vm.memory[vm.i + i];
                        }

                        vm.step();
                        break;

                    default:
                        throw new Error(
                            'Unrecognized opcode: ' + formatOpcode(opcode)
                        );
                }
            }
            break;

        default:
            throw new Error('Unrecognized opcode: ' + formatOpcode(opcode));
    }

    return true;
}

/**
 * @param {number} opcode
 * @returns {string}
 */
export function formatOpcode(opcode: number): string {
    const r = opcode.toString(16).toUpperCase();
    return '0x' + r.padStart(4, '0');
}
