import {Chip8} from './app';

/**
 * @param {Chip8} vm
 */
export function executeOpcode(vm) {
    const opcode = vm.opcode;

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
                    console.log('NOOP ' + opcode);
                    break;
            }
            break;

        // JUMP
        case 0x1000:
            vm.pc = opcode & 0x0FFF;
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
