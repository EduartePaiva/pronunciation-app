import { useRef } from "react";

interface useRecorderProps {
    canvas: React.RefObject<HTMLCanvasElement>;
    sendCallback: (blob: BlobEvent) => void;
}

export default function useRecorder({
    canvas,
    sendCallback,
}: useRecorderProps) {
    const mediaRecorder = useRef<null | MediaRecorder>(null);
    const audioCtx = useRef<null | AudioContext>(null);
    const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);
    const allowCanvasDraw = useRef(false);

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
            if (allowCanvasDraw.current) {
                requestAnimationFrame(draw);
            } else {
                canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
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

    const startRecording = async () => {
        try {
            if (mediaRecorder.current === null) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                const mr = new MediaRecorder(stream);
                mr.ondataavailable = sendCallback;
                mediaRecorder.current = mr;
            }
            if (canvas.current) {
                if (canvasCtx.current === null) {
                    const temp = canvas.current.getContext("2d");
                    if (temp === null) {
                        return;
                    }
                    canvasCtx.current = temp;
                }

                //raw visualize
                if (audioCtx.current === null) {
                    audioCtx.current = new AudioContext();
                }
                const stream = mediaRecorder.current.stream;
                allowCanvasDraw.current = true;
                visualize(
                    stream,
                    audioCtx.current,
                    canvas.current,
                    canvasCtx.current,
                );
            }

            mediaRecorder.current.start(250);
            console.log(mediaRecorder.current.state);
            console.log("Recorder started.");
        } catch (err) {
            console.log("The following error occurred: " + err);
        }
    };
    const stopRecording = () => {
        allowCanvasDraw.current = false;
        if (
            mediaRecorder.current &&
            mediaRecorder.current.state !== "inactive"
        ) {
            mediaRecorder.current.stop();
            console.log(mediaRecorder.current.state);
            console.log("Recorder stopped.");
            mediaRecorder.current.stream
                .getTracks()
                .forEach((track) => track.stop());
        }
    };

    return { startRecording, stopRecording };
}
