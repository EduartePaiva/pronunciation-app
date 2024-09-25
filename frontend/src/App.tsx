import "./App.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./components/ui/button";
import { useState } from "react";

function App() {
    const [lock, setLock] = useState(false);

    const handleLock = () => {
        if (lock) {
            setLock(false);
            return;
        }
        setLock(true);
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
                            <Button variant={"outline"}>Start Spelling</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
