import torch
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from typing import BinaryIO, Union
import os

def speech_to_phoneme(audio_file_path: Union[BinaryIO, str, os.PathLike]) -> str:
    # Load the Wav2Vec 2.0 model and processor
    model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
    processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")

    # Load the audio file
    waveform, sample_rate = torchaudio.load(audio_file_path)

    # Resample if necessary
    if sample_rate != 16000:
        resampler = torchaudio.transforms.Resample(sample_rate, 16000)
        waveform = resampler(waveform)

    # Convert to mono if stereo
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)

    # Preprocess the audio
    input_values = processor(waveform.squeeze().numpy(), sampling_rate=16000, return_tensors="pt").input_values

    # Perform inference
    with torch.no_grad():
        logits = model(input_values).logits

    # Decode the output to get phonemes
    predicted_ids = torch.argmax(logits, dim=-1)
    phonemes = processor.decode(predicted_ids[0])

    return phonemes