from flask import Flask, render_template, request, jsonify
from datetime import datetime
from flask_cors import CORS
from google.oauth2.service_account import Credentials
import gspread

app = Flask(__name__)
CORS(app)

DATA_FILE = "results.csv"
FIELDNAMES = [
    "timestamp", "name", "phone", "time_taken", "error_count", "reaction_time",
    "total_clicks", "accuracy", "first_click_time", "reaction_trigger_step",
    "reaction_success", "total_buttons", "first_error_position",
    "device_type", "screen_resolution", "completion_status", "test_type", "click_log"
]

def save_to_google_sheets(data):
    creds = Credentials.from_service_account_file("credentials.json", scopes=["https://www.googleapis.com/auth/spreadsheets"])
    gc = gspread.authorize(creds)
    sh = gc.open("TMT_B_Results")  # 시트 이름
    ws = sh.sheet1

    row = [
        data["timestamp"], data["name"], data["phone"], data["time_taken"], data["error_count"],
        data["reaction_time"], data["total_clicks"], data["accuracy"], data["first_click_time"],
        data["reaction_trigger_step"], data["reaction_success"], data["total_buttons"], data["first_error_position"],
        data["device_type"], data["screen_resolution"], data["completion_status"], data["test_type"],
        str(data["click_log"])
    ]
    ws.append_row(row)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json()
    data["timestamp"] = datetime.utcnow().isoformat()
    data["test_type"] = "TMT-B"
    data["completion_status"] = "completed"
    save_to_google_sheets(data)
    return jsonify({"status": "success"})