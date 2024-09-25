import { useEffect, useRef, useState } from "react";

interface useRecorderProps {
    record: boolean;
    canvas: React.RefObject<HTMLCanvasElement>;
}

export default function useRecorder({ record, canvas }: useRecorderProps) {
    // if (canvas.current === null) {
    //     throw new Error("You must assign a ref to the canvas");
    // }
    if (!navigator.mediaDevices.getUserMedia) {
        throw new Error(
            "MediaDevices.getUserMedia() not supported on your browser!",
        );
    } else {
        console.log("The mediaDevices.getUserMedia() method is supported.");
    }

    const [mediaRecorder, setMediaRecorder] = useState<null | MediaRecorder>(
        null,
    );
    const chunks = useRef<BlobPart[]>([]);
    const audioCtx = useRef<null | AudioContext>(null);
    const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);
    console.log(chunks.current);

    // Visualiser setup - create web audio api context and canvas
    // let audioCtx: AudioContext;
    // Main block for doing the audio recording

    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                const mr = new MediaRecorder(stream);

                mr.onstop = function () {
                    console.log(
                        "Last data to read (after MediaRecorder.stop() called).",
                    );
                    console.log(chunks.current);

                    // const blob = new Blob(chunks.current, {
                    //     type: mr.mimeType,
                    // });
                    chunks.current = [];
                    // const _audioURL = window.URL.createObjectURL(blob);

                    console.log("recorder stopped");
                };

                mr.ondataavailable = function (e) {
                    chunks.current.push(e.data);
                };

                setMediaRecorder(mr);

                //raw visialize
                if (canvas.current === null) {
                    return;
                }
                if (canvasCtx.current === null) {
                    canvasCtx.current = canvas.current.getContext("2d");
                }
                if (audioCtx.current === null) {
                    audioCtx.current = new AudioContext();
                }
                const source = audioCtx.current.createMediaStreamSource(stream);
                const analyser = audioCtx.current.createAnalyser();

                analyser.fftSize = 2048;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                source.connect(analyser);

                draw();

                function draw() {
                    const WIDTH = canvas.current!.width;
                    const HEIGHT = canvas.current!.height;

                    requestAnimationFrame(draw);

                    analyser.getByteTimeDomainData(dataArray);

                    canvasCtx.current!.fillStyle = "rgb(200, 200, 200)";
                    canvasCtx.current!.fillRect(0, 0, WIDTH, HEIGHT);

                    canvasCtx.current!.lineWidth = 2;
                    canvasCtx.current!.strokeStyle = "rgb(0, 0, 0)";

                    canvasCtx.current!.beginPath();

                    const sliceWidth = (WIDTH * 1.0) / bufferLength;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        const v = dataArray[i] / 128.0;
                        const y = (v * HEIGHT) / 2;

                        if (i === 0) {
                            canvasCtx.current!.moveTo(x, y);
                        } else {
                            canvasCtx.current!.lineTo(x, y);
                        }

                        x += sliceWidth;
                    }

                    canvasCtx.current!.lineTo(
                        canvas.current!.width,
                        canvas.current!.height / 2,
                    );
                    canvasCtx.current!.stroke();
                }
            })
            .catch((err) => {
                console.log("The following error occurred: " + err);
            });
    }, [canvas]);

    useEffect(() => {
        if (!mediaRecorder) {
            return;
        }
        if (record) {
            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log("Recorder started.");
        } else {
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            console.log("Recorder stopped.");
        }
    }, [record, mediaRecorder]);

    return {};
}
