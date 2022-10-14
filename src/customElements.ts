export class KeypadButton extends HTMLButtonElement {
    constructor() {
        super();
        this.textContent = this.keycode.toString(16).toUpperCase();
    }

    get keycode(): number {
        return Number(`0x${this.getAttribute('key')}`);
    }

    set keycode(value: number) {
        this.setAttribute('key', value.toString(16).toUpperCase())
    }
}

export class KeymapRow extends HTMLTableRowElement {
    constructor() {
        super();

        const qwertyKey = document.createElement('td');
        qwertyKey.innerHTML = `<kbd>${this.getAttribute('source-key')}</kbd>`;

        const chipKey = document.createElement('td');
        chipKey.innerHTML = `${this.getAttribute('target-key')}`;
        chipKey.innerHTML = `${this.getAttribute('target-key')}`;

        this.appendChild(qwertyKey);
        this.appendChild(chipKey);
    }
}
