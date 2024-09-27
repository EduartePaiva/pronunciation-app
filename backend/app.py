from flask import Flask, request

app = Flask(__name__)

@app.get("/")
def get_index():
    return "<p>it worked</p>"
@app.post("/")
def post_index():
    print("post text:" +request.form["text"])

    f = request.files["audio"]
    f.save("C:\\Users\\Eduarte\\Documents\\GitHub\\pronunciation-app\\backend\\audio.wav")
    return "it worked"

if __name__ == "__main__":
    app.run(debug=True, port=3000)