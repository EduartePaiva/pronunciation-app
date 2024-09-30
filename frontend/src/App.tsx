import "./App.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { useEffect, useRef, useState } from "react";

import toast, { Toaster } from "react-hot-toast";
import useRecorder from "./hooks/useRecorder";
import { cn } from "./lib/utils";
import { Slider } from "./components/ui/slider";
// import { convertBlobAudioToBlobWav } from "./utils/utils";

interface UserText {
    words_sequence: string;
    result_sequence: number;
}

const DEFAULT_THRESHOLD = 0.7;

function App() {
    const [lock, setLock] = useState(false);
    const [recording, setRecording] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasParent = useRef<HTMLDivElement>(null);
    const [curAudio, setCurAudio] = useState("");
    const curBlob = useRef<{ blob: Blob; fileFormat: string } | null>(null);
    const [userText, setUserText] = useState<UserText[]>([]);
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

    const useRecorderCB = (blob: Blob, fileFormat: string) => {
        console.log(fileFormat);
        window.URL.revokeObjectURL(curAudio);
        const _audioURL = window.URL.createObjectURL(blob);
        curBlob.current = { blob, fileFormat };
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
        toast("sending message");
        try {
            setLock(true);
            // const wavBlob = await convertBlobAudioToBlobWav(curBlob.current);

            const formData = new FormData();
            formData.append(
                "audio",
                curBlob.current.blob,
                `audio.${curBlob.current.fileFormat}`,
            );
            formData.set(
                "text",
                userText.map((x) => x.words_sequence).join(" "),
            );

            const result = await fetch("http://localhost:5000", {
                method: "POST",
                body: formData,
            });
            toast.success("it worked");
            const res = await result.json();

            const right_words = res["right_words"] as number[];
            const newUserText: UserText[] = [];
            for (let i = 0; i < userText.length; i++) {
                const ut: UserText = {
                    result_sequence: right_words[i],
                    words_sequence: userText[i].words_sequence,
                };
                newUserText.push(ut);
            }
            setUserText(newUserText);
        } catch (err) {
            if (err instanceof Error) {
                toast.error(err.message);
                console.error(err);
            }
        }
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
                        className="flex flex-col items-center gap-2 w-[400px] sm:w-[500px] md:w-[600px] lg:w-[800px]"
                    >
                        {!lock && (
                            <Textarea
                                placeholder="Paste some text here"
                                className="resize-none  h-[200px]"
                                disabled={lock}
                                value={userText
                                    .map((x) => x.words_sequence)
                                    .join(" ")}
                                onChange={(e) => {
                                    const userText: UserText[] = e.target.value
                                        .split(" ")
                                        .map((words_sequence) => ({
                                            result_sequence: -1,
                                            words_sequence,
                                        }));

                                    setUserText(userText);
                                }}
                            />
                        )}

                        {lock && (
                            <div className="h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                                {userText.map((txt) => (
                                    <>
                                        <span
                                            className={cn({
                                                "text-green-500":
                                                    txt.result_sequence >=
                                                    threshold,
                                                "text-red-500":
                                                    txt.result_sequence <
                                                    threshold,
                                                "text-gray-500":
                                                    txt.result_sequence === -1,
                                            })}
                                        >
                                            {txt.words_sequence}
                                        </span>{" "}
                                    </>
                                ))}
                            </div>
                        )}
                        <Slider
                            onValueChange={(v) => setThreshold(v[0])}
                            defaultValue={[DEFAULT_THRESHOLD]}
                            step={0.05}
                            max={1}
                            min={0}
                        />
                        <span className="justify-self-center">{threshold}</span>
                        <div className="w-full flex justify-between">
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
