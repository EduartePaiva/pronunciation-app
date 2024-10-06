import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import  numpy 

def speech_to_phoneme_without_audio_processing(audio: numpy.ndarray) -> str:
    # Load the Wav2Vec 2.0 model and processor
    model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
    processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")

    input_values = processor(audio, sampling_rate=16000, return_tensors="pt").input_values

    # Perform inference
    with torch.no_grad():
        logits = model(input_values).logits

    # Decode the output to get phonemes
    predicted_ids = torch.argmax(logits, dim=-1)
    phonemes = processor.decode(predicted_ids[0])

    return phonemes