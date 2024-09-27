import { WaveFile } from "wavefile";

/** This function can throw */
const readAsyncBlobAsArrayBuffer = async (
    blob: Blob,
): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
    });
};

/** This function can throw */
export const convertBlobAudioToBlobWav = async (blob: Blob): Promise<Blob> => {
    const buffer = await readAsyncBlobAsArrayBuffer(blob);
    if (buffer === null || typeof buffer === "string") {
        throw new Error(
            "while trying to convert blob to buffer the buffer was null or string",
        );
    }
    // Convert WebM to WAV using wavefile.js (must include wavefile.js in your project)
    const wav = new WaveFile();
    wav.fromScratch(1, 16000, "16", new Uint8Array(buffer));
    const wavBlob = new Blob([wav.toBuffer()], { type: "audio/wav" });
    return wavBlob;
};
