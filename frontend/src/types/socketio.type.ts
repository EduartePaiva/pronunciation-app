import type { Socket } from "socket.io-client";

export interface BackendData {
    word_index: number;
    word_score: number;
}

interface ServerToClientEvents {
    pronunciation_feedback: (data: BackendData[]) => void;
}

interface ClientToServerEvents {
    audio_stream: (data: ArrayBuffer) => void;
    set_frequency: (data: string) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
