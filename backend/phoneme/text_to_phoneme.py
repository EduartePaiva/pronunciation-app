from phonemizer import  phonemize
from phonemizer.separator import Separator

def text_to_phoneme(text:str):

    phn = phonemize(
        text,
        backend="espeak",
        separator=Separator(phone=None, word=' ', syllable='|'),
        strip=True,
        preserve_punctuation=False,
        njobs=4
    )

    return phn