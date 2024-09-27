import "./App.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { useEffect, useRef, useState } from "react";

import toast, { Toaster } from "react-hot-toast";
import useRecorder from "./hooks/useRecorder";
import { convertBlobAudioToBlobWav } from "./utils/utils";

function App() {
    const [lock, setLock] = useState(false);
    const [recording, setRecording] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasParent = useRef<HTMLDivElement>(null);
    const [curAudio, setCurAudio] = useState("");
    const curBlob = useRef<Blob | null>(null);

    const useRecorderCB = (blob: Blob) => {
        window.URL.revokeObjectURL(curAudio);
        const _audioURL = window.URL.createObjectURL(blob);
        curBlob.current = blob;
        setCurAudio(_audioURL);
    };
    const { startRecording, stopRecording } = useRecorder({
        canvas: canvasRef,
        stopCallback: useRecorderCB,
    });

    const handleLock = () => {
        if (lock) {
            setLock(false);
            return;
        }
        setLock(true);
    };

    const handleRecord = () => {
        if (recording) {
            setRecording(false);
            stopRecording();
            return;
        }
        toast("started recording");
        setRecording(true);
        startRecording();
    };

    const handleSendData = async () => {
        if (curBlob.current === null) {
            toast.error("nothing was recorded yet!");
            return;
        }
        const wavBlob = await convertBlobAudioToBlobWav(curBlob.current);

        const formData = new FormData();
        formData.append("audio", wavBlob, "audio.wav");
        formData.set("text", "this is the user text");

        const result = await fetch("https://your-backend-url.com/upload", {
            method: "POST",
            body: formData,
        });
    };

    useEffect(() => {
        if (canvasRef.current === null || canvasParent.current === null) {
            return;
        }
        window.onresize = function () {
            if (canvasRef.current === null || canvasParent.current === null) {
                return;
            }
            canvasRef.current.width = canvasParent.current.offsetWidth;
        };
        canvasRef.current.width = canvasParent.current.offsetWidth;
    }, [canvasRef, canvasParent]);

    return (
        <div className="h-screen w-screen bg-slate-100 flex justify-center">
            <div className="container">
                <div className="flex flex-col items-center">
                    <span className="my-6 font-semibold text-lg">Speller</span>
                    <div
                        ref={canvasParent}
                        className="w-[400px] sm:w-[500px] md:w-[600px] lg:w-[800px]"
                    >
                        <Textarea
                            placeholder="Paste some text here"
                            className="resize-none  h-[200px]"
                            disabled={lock}
                        />
                        <div className="w-full my-6 flex justify-around">
                            <Button onClick={handleLock}>
                                {lock ? "Unlock Text" : "Lock Text"}
                            </Button>
                            <Button variant={"link"} onClick={handleSendData}>
                                Send audio with text
                            </Button>
                            <Button
                                onClick={handleRecord}
                                variant={recording ? "destructive" : "outline"}
                            >
                                {recording
                                    ? "Stop Recording"
                                    : "Start Recording"}
                            </Button>
                        </div>
                        {/* canvas animation */}
                        <canvas
                            ref={canvasRef}
                            height="60px"
                            className="block w-full"
                        ></canvas>
                        {/* sound clips */}
                        <section>
                            <audio controls src={curAudio}></audio>
                        </section>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default App;
