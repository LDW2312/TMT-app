from flask import Flask, render_template, request, jsonify
from datetime import datetime
from flask_cors import CORS
import json
import os
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
    # Render 환경에서는 credentials.json 내용을 환경변수에서 가져오도록 설정
    service_account_info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT"])
    
    creds = Credentials.from_service_account_info(
        service_account_info,
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    
    gc = gspread.authorize(creds)
    sh = gc.open("TMT_B_Results")  # 시트 이름
    worksheet = sh.sheet1

    worksheet.append_row([
        data["timestamp"],
        data["name"],
        data["phone"],
        data["time_taken"],
        data["error_count"],
        data["reaction_time"],
        data["total_clicks"],
        data["accuracy"],
        data["first_click_time"],
        data["reaction_trigger_step"],
        data["reaction_success"],
        data["total_buttons"],
        data["first_error_position"],
        data["device_type"],
        data["screen_resolution"],
        data["completion_status"],
        data["test_type"],
        json.dumps(data["click_log"], ensure_ascii=False)  # JSON으로 저장
    ])

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