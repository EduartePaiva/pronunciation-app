from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
import io

from phoneme.speech_to_phoneme import speech_to_phoneme
from phoneme.text_to_phoneme import text_to_phoneme
from utils.levenshtein_distance import comparing_things
from audio.audio_processor import AudioChuck, AudioChuckSimplified


app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")
# logger=True, engineio_logger=True,
audio_processor = AudioChuckSimplified(socketio)


@app.get("/")
def get_index():
    return "<p>it worked</p>"
@app.post("/")
def post_index():

    f = request.files["audio"]
    text = request.form["text"]
    speech_phone = speech_to_phoneme(f.stream)
    text_phone = text_to_phoneme(text)

    print(speech_phone)
    print(text_phone)

    
    # f.save(f.filename)
    data = {
        "speech_phone":speech_phone,
        "text_phone": text_phone,
        "right_words": comparing_things(speech_phone, text_phone)
    }
    json_data = json.dumps(data, ensure_ascii=False).encode('utf8')
    response = Response(json_data,201)
    response.content_type = "application/json"
    
    return  response

@socketio.on('connect')
def test_connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')


@socketio.on('audio_stream')
def handle_audio_stream(audio_data: bytes):
    print("received audio")
    audio_processor.add_audio(audio_data)

# @socketio.on('set_text')
# def handle_set_text(text: str):
#     audio_processor.set_text(text)


if __name__ == '__main__':
    socketio.run(app, debug=True)
