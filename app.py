from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
from flask_cors import CORS
import cv2
import numpy as np
import socket

app = Flask(__name__)
CORS(app)

# Load model once
model = YOLO("yolo11n.pt")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/detect", methods=["POST"])
def detect():

    file = request.files["image"]

    image = cv2.imdecode(
        np.frombuffer(file.read(), np.uint8),
        cv2.IMREAD_COLOR
    )

    results = model(image)[0]

    detections = []

    for box in results.boxes:

        x1, y1, x2, y2 = box.xyxy[0].tolist()

        cls = int(box.cls[0])
        conf = float(box.conf[0])

        detections.append({
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "class": model.names[cls],
            "confidence": round(conf, 2)
        })

    return jsonify(detections)


# New endpoint
@app.route("/model", methods=["GET"])
def get_model_info():
    return jsonify({
        "model_name": "yolo11n.pt",
        "task": model.task,
        "classes": model.names,
        "num_classes": len(model.names)
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "message": "Flask YOLO API is working fine"
    })

@app.route("/server-info", methods=["GET"])
def server_info():
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    return jsonify({
        "hostname": hostname,
        "local_ip": local_ip,
        "api": f"http://{local_ip}:5000"
    })

if __name__ == "__main__":
    app.run(debug=True)