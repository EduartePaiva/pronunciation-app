import "./App.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { useState } from "react";

import toast, { Toaster } from "react-hot-toast";

function App() {
    const [lock, setLock] = useState(false);
    const [recording, setRecording] = useState(false);

    const handleLock = () => {
        if (lock) {
            setLock(false);
            return;
        }
        setLock(true);
    };

    const handleRecording = async () => {
        if (recording) {
            setRecording(false);
            return;
        }
        // Check if the browser supports the required APIs
        if (
            !window.AudioContext ||
            !window.MediaStreamAudioSourceNode ||
            !window.AudioWorkletNode
        ) {
            toast.error("Your browser does not support the required APIs");
            return;
        }
        setRecording(true);

        // Request access to the user's microphone
    };

    return (
        <div className="h-screen w-screen bg-slate-100 flex justify-center">
            <div className="container">
                <div className="flex flex-col items-center">
                    <span className="my-6 font-semibold text-lg">Speller</span>
                    <div className="w-[400px] sm:w-[500px] md:w-[600px] lg:w-[800px]">
                        <Textarea
                            placeholder="Paste some text here"
                            className="resize-none  h-[200px]"
                            disabled={lock}
                        />
                        <div className="w-full my-6 flex justify-around">
                            <Button onClick={handleLock}>
                                {lock ? "Unlock Text" : "Lock Text"}
                            </Button>
                            <Button
                                onClick={handleRecording}
                                variant={"outline"}
                            >
                                {recording
                                    ? "Stop Recording"
                                    : "Start Recording"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default App;
