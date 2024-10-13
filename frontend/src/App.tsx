import "./App.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { useEffect, useRef, useState } from "react";

import toast, { Toaster } from "react-hot-toast";
import { cn } from "./lib/utils";
import { Slider } from "./components/ui/slider";

import io from "socket.io-client";
import type { TypedSocket } from "@/types/socketio.type";
import useRecorder2 from "./hooks/useRecorderAudioWorklet";

interface UserText {
    words_sequence: string;
    result_sequence: number;
    equivalent_phone?: string;
    equals_phones?: boolean[];
}

const DEFAULT_THRESHOLD = 0.7;

function App() {
    const [lock, setLock] = useState(false);
    const [recording, setRecording] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasParent = useRef<HTMLDivElement>(null);
    const [userText, setUserText] = useState<UserText[]>([]);
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
    const phoneText = useRef("");

    //real time part
    const socketRef = useRef<TypedSocket | null>(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(import.meta.env.VITE_BACKEND_URL);

        // Set up socket event listeners
        socketRef.current.on("connect", () => {
            console.log("Connected to server");
        });

        socketRef.current.on("pronunciation_feedback", (data) => {
            if (data.length == 0) {
                return;
            }
            console.log(data);
            // setUserText((prev) => {
            //     data.forEach((bkData) => {
            //         if (
            //             prev[bkData.word_index].result_sequence <
            //             bkData.word_score
            //         ) {
            //             prev[bkData.word_index].result_sequence =
            //                 bkData.word_score;
            //         }
            //     });
            //     return [...prev];
            // });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    const handleTextAreaOnChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const userText: UserText[] = e.target.value
            .split(" ")
            .map((words_sequence) => ({
                result_sequence: -1,
                words_sequence,
            }));

        setUserText(userText);
    };

    const useRecorderCB = (data: ArrayBuffer) => {
        if (socketRef.current?.connected) {
            console.log("sending one second of data!!!");
            console.log(data.byteLength);
            socketRef.current.emit("audio_stream", data);
        }
    };
    const { startRecording, stopRecording } = useRecorder2({
        canvas: canvasRef,
        sendCallback: useRecorderCB,
    });

    const handleLock = async () => {
        if (lock) {
            setLock(false);
            return;
        }
        const text = userText.map((x) => x.words_sequence).join(" ");
        const form = new FormData();
        form.append("text", text);
        const result = await fetch(import.meta.env.VITE_BACKEND_URL, {
            method: "POST",
            body: form,
        });
        const phones = ((await result.json()).text_phone as string).split("|");
        console.log("phones len: ", phones.length);
        console.log("userText len: ", userText.length);
        if (phones.length != userText.length) {
            toast.error("the len of phones and words differ");
            return;
        }
        for (let i = 0; i < phones.length; i++) {
            userText[i].equivalent_phone = phones[i];
        }

        console.log(userText);
        setUserText([...userText]);
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
                                onChange={handleTextAreaOnChange}
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
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default App;
