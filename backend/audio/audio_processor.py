from flask_socketio import SocketIO
import torch
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from typing import BinaryIO, Union
import os
import io
import numpy

import queue
import threading

from typing import Union, List, Dict

from phoneme.text_to_phoneme import text_to_phoneme
from phoneme.speech_to_phoneme_2 import speech_to_phoneme_without_audio_processing
from utils.levenshtein_distance import comparing_things
from pydub import AudioSegment

from werkzeug.datastructures import FileStorage


class AudioChuck:
    def __init__(self, phones_text: str):
        self.buffer: Union[numpy.ndarray,None] = None
        self.sample_rate = 16000
        self.processing_queue = queue.Queue()
        self.processing_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.processing_thread.start()
        self.words = [w for w in enumerate(phones_text.split("|"))] # Store the text with the word index
        self.equal_phones: list[list[bool]] = []

        for word in phones_text.split("|"):
            score: list[bool] = []
            for _ in word.split(" "):
                score.append(False)
            self.equal_phones.append(score)

    def add_audio(self, audio_data: bytes):
        audio_segment = io.BytesIO(audio_data)
        # Load the audio file
        waveform, sample_rate = torchaudio.load(audio_segment)

        # Resample if necessary
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            waveform = resampler(waveform)

        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)

        # Convert to numpy array
        audio_array = waveform.squeeze().numpy()

        # Append to the buffer
        if self.buffer is None:
            self.buffer = audio_array
        else:
            self.buffer = numpy.concatenate([self.buffer, audio_array])
        
        # this is two second
        if len(self.buffer) >= (self.sample_rate * 2):

            self.processing_queue.put(self.buffer.copy())
            # get the last half second and append it back to the buffer, this way we deal with fragmented phones
            endBuffer = self.buffer[max(len(self.buffer)-(self.sample_rate // 2), 0):].copy()
            self.buffer = endBuffer

    def _process_queue(self):
        while True:
            audio_data = self.processing_queue.get()
            if audio_data is None:
                break
            
            try:
                spoken_phonemes = speech_to_phoneme_without_audio_processing(audio_data)
                feedback = self.calculate_word_scores(spoken_phonemes)
                socketio.emit('pronunciation_feedback', feedback)
            
            except Exception as e:
                print(f"Error processing audio: {e}")
            
            finally:
                self.processing_queue.task_done()

    def calculate_word_scores(self, spoken_phonemes: str) -> List[Dict[str, int]]:
        feedback = []
        
        # get the first 10 words from that
        first_words = self.words[: min(10, len(self.words))]

        # calculate the phones
        words_score = comparing_things(spoken_phonemes, [w for _, w in first_words])

        # get the first 10 words from score
        first_score = self.equal_phones[: min(10, len(self.equal_phones))]

        for i in range(len(words_score)):
            for j in range(len(words_score[i])):
                first_score[i][j] = (first_score[i][j] or words_score[i][j])

        for i in range(len(first_words)):
            feedback.append({
                "word_index": first_words[i],
                "word_score": first_score[i].count(True) / len(first_score[i]),
            })

        # now I have to eliminate words that are already with a score

        ############################################################################################################################



        return feedback
    

class AudioChuckSimplified:
    def __init__(self, socket: SocketIO):
        self.buffer = numpy.array([], dtype=numpy.float32)
        self.sample_rate = 16000
        self.processing_queue = queue.Queue()
        self.processing_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.processing_thread.start() 
        self.socketio = socket

    def add_audio(self, audio_data: bytes):
        test = io.BytesIO(audio_data)
        sound = AudioSegment.from_file_using_temporary_files(test, codec="opus", format="webm")
        print("this is erroing")

        # resample to 16k
        sound = sound.set_frame_rate(self.sample_rate)
        # convert to mono
        sound = sound.set_channels(1)
        # get samples
        audio_array = numpy.array(sound.get_array_of_samples(), dtype=numpy.float32)
        # Normalize audio
        audio_array = audio_array / numpy.max(numpy.abs(audio_array)) 
        # concatenate audio
        self.buffer = numpy.concatenate([self.buffer, audio_array])
        # this is two second
        if len(self.buffer) >= (self.sample_rate * 2):
            print("this executed 3")
            self.processing_queue.put(self.buffer.copy())
            self.buffer = numpy.array([], dtype=numpy.float32)

    def _process_queue(self):
        while True:
            audio_data = self.processing_queue.get()
            if audio_data is None:
                break
            
            try:
                spoken_phonemes = speech_to_phoneme_without_audio_processing(audio_data)
                self.socketio.emit('pronunciation_feedback', spoken_phonemes)
            
            except Exception as e:
                print(f"Error processing audio: {e}")
            
            finally:
                self.processing_queue.task_done()