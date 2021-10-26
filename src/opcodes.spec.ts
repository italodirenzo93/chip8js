import { Chip8 } from './vm';
import { executeOpcode } from './opcodes';

const randomInt = (max = 4096, min = 0) =>
    Math.floor(Math.random() * max - min) + min;

describe('Opcodes', () => {
    let vm: Chip8;
    let mockCtx: CanvasImageData;

    beforeEach(() => {
        mockCtx = {
            createImageData: jest.fn(),
            getImageData: jest.fn(),
            putImageData: jest.fn(),
        };

        vm = new Chip8(mockCtx);
    });

    describe('00E0 - Clear display', () => {
        it('clears the display', () => {
            vm.pc = 42;
            vm.clearDisplay = jest.fn();

            executeOpcode(vm, 0x00e0);

            expect(vm.clearDisplay).toBeCalledTimes(1);
            expect(vm.pc).toBe(44);
        });
    });

    describe('00EE - Return from sub-routine', () => {
        it('throws if the stack is empty', () => {
            expect(() => executeOpcode(vm, 0x00ee)).toThrowError(
                'No address found on the stack.'
            );
        });

        it('sets the program counter to the address at the top of the stack', () => {
            const addr = randomInt();
            vm.stack.push(addr);

            executeOpcode(vm, 0x00ee);

            expect(vm.pc).toBe(addr + 2);
            expect(vm.stack).toHaveLength(0);
        });
    });

    describe('1NNN - Jump to address', () => {
        it('sets the program counter to the address', () => {
            executeOpcode(vm, 0x1234);
            expect(vm.pc).toBe(0x0234);
        });
    });

    describe('2NNN - Call sub-routine', () => {
        it('pushes the current address onto the stack', () => {
            const addr = randomInt();
            vm.pc = addr;

            executeOpcode(vm, 0x2234);

            expect(vm.stack).toHaveLength(1);
            expect(vm.stack[0]).toBe(addr);
        });

        it('sets the program counter to the address called', () => {
            executeOpcode(vm, 0x2111);
            expect(vm.pc).toBe(0x0111);
        });
    });

    describe('3XNN - Equals', () => {
        it('skips the next instruction if the values are equal', () => {
            vm.pc = 24;
            vm.v[2] = 0x50;

            executeOpcode(vm, 0x3250);

            expect(vm.pc).toBe(28);
        });

        it('executes the next instruction if the values are not equal', () => {
            vm.pc = 24;
            vm.v[2] = 0x46;

            executeOpcode(vm, 0x3278);

            expect(vm.pc).toBe(26);
        });
    });

    describe('4XNN - Not Equals', () => {
        it('skips the next instruction if the values are not equal', () => {
            vm.pc = 24;
            vm.v[2] = 0x50;

            executeOpcode(vm, 0x4212);

            expect(vm.pc).toBe(28);
        });

        it('executes the next instruction if the values are equal', () => {
            vm.pc = 24;
            vm.v[2] = 0x46;

            executeOpcode(vm, 0x4246);

            expect(vm.pc).toBe(26);
        });
    });
});
