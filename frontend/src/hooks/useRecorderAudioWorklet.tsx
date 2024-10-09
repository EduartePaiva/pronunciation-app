import { useRef } from "react";
import { audioWorkletProcessor } from "./audioWorkletProcessor";

interface useRecorderProps {
    canvas: React.RefObject<HTMLCanvasElement>;
    sendCallback: (array: Int16Array) => void;
}

export default function useRecorder2({
    canvas,
    sendCallback,
}: useRecorderProps) {
    const audioContext = useRef<AudioContext | null>(null);
    const workletNode = useRef<AudioWorkletNode | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);

    function visualize(
        stream: MediaStream,
        audioCtx: AudioContext,
        canvas: HTMLCanvasElement,
        canvasCtx: CanvasRenderingContext2D,
    ) {
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);

        draw();

        function draw() {
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.fillStyle = "#f1f5f9";
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "rgb(0, 0, 0)";
            if (isRecording.current) {
                requestAnimationFrame(draw);
            } else {
                canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
                source.disconnect(analyser);
                analyser.disconnect();
                return;
            }
            canvasCtx.beginPath();
            const sliceWidth = (WIDTH * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * HEIGHT) / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }
    }

    async function init() {
        try {
            if (audioContext.current !== null) {
                console.log("init is already executed!");
                return;
            }
            audioContext.current = new AudioContext();
            // Create a Blob URL for the AudioWorklet code
            const blob = new Blob([audioWorkletProcessor], {
                type: "application/javascript",
            });
            const workletUrl = URL.createObjectURL(blob);
            try {
                // Load the AudioWorklet module
                await audioContext.current.audioWorklet.addModule(workletUrl);
            } finally {
                // Cleanup the Blob URL
                URL.revokeObjectURL(workletUrl);
            }
            console.log(
                `Audio context sample rate: ${audioContext.current.sampleRate}`,
            );
        } catch (err) {
            console.error("Failed to initialize audio recorder:", err);
            throw err;
        }
    }

    const startRecording = async () => {
        try {
            if (audioContext.current === null) {
                console.log("Init wasn't called, recording can't be called");
                return;
            }
            mediaStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const source = audioContext.current.createMediaStreamSource(
                mediaStream.current,
            );

            workletNode.current = new AudioWorkletNode(
                audioContext.current,
                "recorder-worklet",
            );

            workletNode.current.port.onmessage = (event) => {
                if (event.data.eventType === "audio") {
                    sendCallback(event.data.audioData);
                }
            };

            source.connect(workletNode.current);
            workletNode.current.connect(audioContext.current.destination);

            workletNode.current.port.postMessage({ command: "start" });
        } catch (err) {
            console.error("Failed to start recording:", err);
            throw err;
        }
    };
    const stopRecording = () => {};

    return { startRecording, stopRecording };
}
