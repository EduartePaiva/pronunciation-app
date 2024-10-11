// input have length of 128 samples
// to get 48000 it have to run 375 times

export const audioWorkletProcessor = `
class RecorderWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.isRecording = false;
        this.oneSecondData = new Int16Array(48000);
        this.times = 0;
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
            // const pcmData = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
                this.oneSecondData[i + (this.times * 128)] = Math.max(
                    -32768,
                    Math.min(32767, samples[i] * 32768),
                );
            }
            this.times += 1;
            if (this.times >= 375) {
                console.log(this.oneSecondData.length);
                this.port.postMessage(
                    {
                        eventType: "audio",
                        audioData: this.oneSecondData.buffer,
                    },
                    [this.oneSecondData.buffer],
                );
                this.times = 0;
                this.oneSecondData = new Int16Array(48000);
            }
        }
        return true;
    }
}
registerProcessor("recorder-worklet", RecorderWorkletProcessor);`;
