import "./App.css";
import { Button } from "./components/ui/button";
import { useEffect, useRef, useState } from "react";

import toast, { Toaster } from "react-hot-toast";
import useRecorder from "./hooks/useRecorder";

function App() {
    const [record, setRecord] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasParent = useRef<HTMLDivElement>(null);
    const [savedSounds, setSavedSounds] = useState<string[]>([]);
    const useRecorderCB = (blob: Blob) => {
        const _audioURL = window.URL.createObjectURL(blob);
        setSavedSounds((prev) => [...prev, _audioURL]);
    };

    const { startRecording, stopRecording } = useRecorder({
        canvas: canvasRef,
        stopCallback: useRecorderCB,
    });

    const handleRecord = () => {
        if (record) {
            setRecord(false);
            stopRecording();
            return;
        }
        toast("started recording");
        setRecord(true);
        startRecording();
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
                    <span className="my-6 font-semibold text-lg">
                        Web dictaphone
                    </span>
                    <div
                        ref={canvasParent}
                        className="w-[400px] sm:w-[500px] md:w-[600px] lg:w-[800px]"
                    >
                        <canvas
                            ref={canvasRef}
                            height="60px"
                            className="block w-full"
                        ></canvas>
                        <div className="w-full my-6 flex justify-around">
                            <Button
                                onClick={handleRecord}
                                variant={record ? "destructive" : "default"}
                            >
                                {record ? "Stop" : "Record"}
                            </Button>
                        </div>
                        {/* sound clips */}
                        <section>
                            {savedSounds.map((sound, index) => (
                                <audio key={index} controls src={sound}></audio>
                            ))}
                        </section>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default App;
