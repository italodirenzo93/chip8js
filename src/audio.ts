let audioContext: AudioContext;
let gateNode: GainNode;
let oscillatorNode: OscillatorNode;
let volumeNode: GainNode;

export function init() {
    audioContext = new AudioContext();

    gateNode = audioContext.createGain();

    oscillatorNode = audioContext.createOscillator();
    oscillatorNode.type = 'sine';

    volumeNode = audioContext.createGain();

    oscillatorNode
        .connect(gateNode)
        .connect(volumeNode)
        .connect(audioContext.destination);

    oscillatorNode.start();
}

export function update(soundTimer: number) {
    if (!audioContext) {
        throw new Error('AudioContext not initialized!');
    }

    if (soundTimer > 0) {
        gateNode.gain.value = 1;
    } else {
        gateNode.gain.value = 0;
    }
}

export function setVolume(volume: number) {
    volumeNode.gain.value = volume;
}
