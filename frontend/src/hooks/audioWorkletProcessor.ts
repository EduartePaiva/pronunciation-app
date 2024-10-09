export const audioWorkletProcessor = `
class RecorderWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.isRecording = false;
        this.port.onmessage = (e) => {
            if (e.data.command === "start") {
                this.isRecording = true;
            } else if (e.data.command === "stop") {
                this.isRecording = false;
            }
        };
    }
    process(inputs, outputs) {
        if (!this.isRecording) return true;
        const input = inputs[0];
        if (input.length > 0) {
            const samples = input[0];
            // Convert Float32Array to Int16Array
            const pcmData = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
                pcmData[i] = Math.max(
                    -32768,
                    Math.min(32767, samples[i] * 32768),
                );
            }
            this.port.postMessage(
                {
                    eventType: "audio",
                    audioData: pcmData.buffer,
                },
                [pcmData.buffer],
            );
        }
        return true;
    }
}
registerProcessor("recorder-worklet", RecorderWorkletProcessor);`;
