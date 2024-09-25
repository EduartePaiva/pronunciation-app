import "./App.css";
import { Button } from "./components/ui/button";
import { useRef, useState } from "react";

import toast, { Toaster } from "react-hot-toast";
import useRecorder from "./hooks/useRecorder";

function App() {
    const [record, setRecord] = useState(false);
    const ref = useRef<HTMLCanvasElement>(null);
    useRecorder({ canvas: ref, record });

    const handleRecord = () => {
        if (record) {
            setRecord(false);
            return;
        }
        setRecord(true);
    };

    return (
        <div className="h-screen w-screen bg-slate-100 flex justify-center">
            <div className="container">
                <div className="flex flex-col items-center">
                    <span className="my-6 font-semibold text-lg">
                        Web dictaphone
                    </span>
                    <div className="w-[400px] sm:w-[500px] md:w-[600px] lg:w-[800px]">
                        <canvas
                            ref={ref}
                            className="block bg-gray-300 w-full h-[60px]"
                        ></canvas>
                        <div className="w-full my-6 flex justify-around">
                            <Button
                                onClick={handleRecord}
                                variant={record ? "destructive" : "default"}
                            >
                                {record ? "Stop" : "Record"}
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
