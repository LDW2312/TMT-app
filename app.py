from flask import Flask, render_template, request, jsonify
from datetime import datetime
import csv
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_FILE = "results.csv"
FIELDNAMES = [
    "timestamp", "name", "phone", "time_taken", "error_count", "reaction_time",
    "total_clicks", "accuracy", "first_click_time", "reaction_trigger_step",
    "reaction_success", "total_buttons", "first_error_position",
    "device_type", "screen_resolution", "completion_status", "test_type", "click_log"
]

# Ensure CSV header
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json()
    data["timestamp"] = datetime.utcnow().isoformat()
    data["test_type"] = "TMT-B"
    data["completion_status"] = "completed"

    with open(DATA_FILE, mode="a", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writerow(data)

    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)