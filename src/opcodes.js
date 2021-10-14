import {Chip8} from './app';

/**
 * @param {Chip8} vm
 * @param {number} opcode
 */
export function executeOpcode(vm, opcode) {
    console.log('Executing: ' + formatOpcode(opcode));

    switch (opcode & 0xF000) {
        // Call a machine code routine
        case 0x0000:
            switch (opcode & 0x00FF) {
                // Clear the display
                case 0x00E0:
                    vm.display.fill(0);
                    vm.drawDisplay();

                    vm.step();
                    break;
                // Return from sub-routine
                case 0x00EE:
                    vm.pc = vm.stack[--vm.sp];
                    vm.step();
                    break;
                default:
                    console.log('NOOP ' + formatOpcode(opcode));
                    return false;
            }
            break;

        // JUMP
        case 0x1000:
            vm.pc = opcode & 0x0FFF;
            break;

        // Call sub-routine
        case 0x2000:
            vm.stack[vm.sp++] = vm.pc;
            vm.pc = opcode & 0x0FFF;
            break;

        // Equals
        case 0x3000:
            if (vm.v[(opcode & 0x0F00) >> 8] === opcode & 0x00FF) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // Not Equals
        case 0x4000:
            if (vm.v[(opcode & 0x0F00) >> 8] !== opcode & 0x00FF) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // VX Equals VY
        case 0x5000:
            if (vm.v[(opcode & 0x0F00) >> 8] === vm.v[(opcode & 0x00F0) >> 4]) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // Assign
        case 0x6000:
            vm.v[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
            vm.step();
            break;

        // Addition
        case 0x7000:
            vm.v[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
            vm.step();
            break;

        // Arithmetic
        case 0x8000:
            {
                const x = (opcode & 0x0F00) >> 8;
                const y = (opcode & 0x00F0) >> 4;

                switch (opcode & 0x000F) {
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
                                vm.v[0xF] = 1;
                            } else {
                                vm.v[0xF] = 0;
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
                                vm.v[0xF] = 1;
                            } else {
                                vm.v[0xF] = 0;
                            }

                            vm.v[x] = vm.v[x] - vm.v[y];

                            vm.step();
                        }
                        break;

                    // Bitshift right
                    case 0x0006:
                        vm.v[0xF] = vm.v[x] & 0x1;
                        vm.v[x] = vm.v[y] >> 1;

                        vm.step();
                        break;

                    // SUB reverse
                    case 0x0007:
                        {
                            const vx = vm.v[x];
                            const vy = vm.v[y];

                            vm.v[x] = vy - vx;
                            vm.v[0xF] = vy < vx ? 0 : 1;

                            vm.step();
                        }
                        break;

                    // Bitshift left
                    case 0x000E:
                        vm.v[0xF] = (vm.v[x] >> 7) & 0x1;
                        vm.v[x] = vm.v[y] << 1;

                        vm.step();
                        break;

                    default:
                        throw new Error('Unrecognized opcode: ' + formatOpcode(opcode));
                }
            }
            break;

         // VX Not Equals VY
         case 0x9000:
            if (vm.v[(opcode & 0x0F00) >> 8] !== vm.v[(opcode & 0x00F0) >> 4]) {
                vm.step(); // skip the next instruction
            }

            vm.step();
            break;

        // Set index register
        case 0xA000:
            vm.i = opcode & 0x0FFF;
            vm.step();
            break;

        // Jump with offset
        case 0xB000:
            vm.pc = (opcode & 0x00FF) + vm.v[(opcode & 0x0F00) >> 8];
            break;

        // Bitwise random
        case 0xC000:
            vm.v[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 255) & (opcode & 0x00FF);
            vm.step();
            break;

        // // Draw sprite
        // case 0xD000:
        //     break;

        // Check keypad
        case 0xE000:
            {
                const keycode = (opcode & 0x0F00) >> 8;

                switch (opcode & 0x00FF) {
                    // Key down
                    case 0x009E:
                        if (vm.keypad[keycode] === 1) {
                            vm.step(); // skip the next instruction
                        }

                        vm.step();
                        break;

                    // Key up
                    case 0x00A1:
                        if (vm.keypad[keycode] === 0) {
                            vm.step(); // skip the next instruction
                        }

                        vm.step();
                        break;
                }
            }
            break;

        // Other
        case 0xF000:
            {
                const x = (opcode & 0x0F00) >> 8;

                switch (opcode & 0x00FF) {
                    // Read delay timer
                    case 0x0007:
                        vm.v[x] = vm.delayTimer;
                        vm.step();
                        break;

                    // // Key wait
                    // case 0x000A:
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
                    case 0x001E:
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
                        throw new Error('Unrecognized opcode: ' + formatOpcode(opcode));
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
export function formatOpcode(opcode) {
    const r = opcode.toString(16).toUpperCase();
    return '0x' + r.padStart(4, '0');
}