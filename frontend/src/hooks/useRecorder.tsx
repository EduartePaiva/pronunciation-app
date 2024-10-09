import { blobToBase64 } from "@/utils/utils";
import { useRef } from "react";

interface useRecorderProps {
    canvas: React.RefObject<HTMLCanvasElement>;
    sendCallback: (blob: string) => void;
}

export default function useRecorder({
    canvas,
    sendCallback,
}: useRecorderProps) {
    const refStream = useRef<MediaStream | null>(null);
    const audioCtx = useRef<null | AudioContext>(null);
    const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);
    const isRecording = useRef(false);

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

    const handleDataAvailable = (event: Blob) => {
        console.log("this executed");
        if (event.size > 0) {
            blobToBase64(event).then((b64) => {
                sendCallback(b64);
            });
        }
    };

    const startRecording = async () => {
        try {
            if (refStream.current === null) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                refStream.current = stream;
            }
            //raw visualize
            if (audioCtx.current === null) {
                audioCtx.current = new AudioContext();
            }

            if (canvas.current) {
                if (canvasCtx.current === null) {
                    const temp = canvas.current.getContext("2d");
                    if (temp === null) {
                        return;
                    }
                    canvasCtx.current = temp;
                }

                console.log(audioCtx.current.sampleRate);
                isRecording.current = true;
                if (refStream.current !== null) {
                    visualize(
                        refStream.current,
                        audioCtx.current,
                        canvas.current,
                        canvasCtx.current,
                    );
                }
            }
            console.log("Recorder started.");
        } catch (err) {
            console.log("The following error occurred: " + err);
        }
    };
    const stopRecording = () => {
        isRecording.current = false;
    };

    return { startRecording, stopRecording };
}
