import { Chip8, DISPLAY_WIDTH, DISPLAY_HEIGHT } from "./vm";
import { executeOpcode } from './opcodes';

const canvas = document.createElement('canvas');
canvas.width = DISPLAY_WIDTH;
canvas.height = DISPLAY_HEIGHT;

describe('Opcodes', () => {

    let vm: Chip8;

    beforeEach(() => {
        vm = new Chip8(canvas.getContext('2d')!);
    });

    describe('00E0', () => {
        it('clears the display', () => {
            vm.pc = 42;
            vm.clearDisplay = jest.fn();

            executeOpcode(vm, 0x00e0);

            expect(vm.clearDisplay).toBeCalledTimes(1);
            expect(vm.pc).toBe(44);
        });
    });
});
