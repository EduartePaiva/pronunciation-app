from array import array
from flask import Flask, request, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json


from phoneme.text_to_phoneme import text_to_phoneme
from utils.levenshtein_distance import comparing_things
from audio.audio_processor import AudioChuck, AudioChuckSimplified


app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*",logger=True, engineio_logger=True)
# logger=True, engineio_logger=True,
audio_processor = AudioChuckSimplified(socketio)


@app.get("/")
def get_index():
    return "<p>it worked</p>"
@app.post("/")
def post_index():
    text = request.form["text"]
    text_phone = text_to_phoneme(text)
    print(text_phone)
    data = {
        "text_phone": text_phone,
    }
    json_data = json.dumps(data, ensure_ascii=False).encode('utf8')
    response = Response(json_data,201)
    response.content_type = "application/json"
    return  response

@socketio.on('connect')
def test_connect():
    emit('pronunciation_feedback', {'data': 'Connected'})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')


@socketio.on('audio_stream')
def handle_audio_stream(audio_data: bytes):
    audio_processor.add_audio(audio_data)

# @socketio.on('set_text')
# def handle_set_text(text: str):
#     audio_processor.set_text(text)


if __name__ == '__main__':
    socketio.run(app, debug=True)
