from flask import Flask, request, jsonify, send_from_directory
import os
from datetime import datetime
from flask_cors import CORS
from search_nco import semantic_search  # 👈 import the function
from gemini import transcribe_and_translate
from performance import process_data, process_feedback_data

import json

import pandas as pd
from index_nco import indexing   # 👈 import your function
CSV_FILES = {
    "division": "dataset/division.csv",
    "subdivision": "dataset/subdivision.csv",
    "group": "dataset/group.csv",
    "family": "dataset/family.csv",
    "occupation": "dataset/nco2015_full.csv"
}

# Ensure dataset folder exists
os.makedirs("dataset", exist_ok=True)


FEEDBACK_FOLDER = "feedback_data"
os.makedirs(FEEDBACK_FOLDER, exist_ok=True)

HISTORY_FILE = os.path.join(FEEDBACK_FOLDER, "history.json")

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return send_from_directory("frontend", "index.html")

@app.route("/submit_text", methods=["POST"])
def submit_text():
    data = request.get_json()
    text = data.get("text", "")
    print(f"📝 Received text: {text}")
    search_results = semantic_search(text)
    return jsonify(search_results), 200

@app.route("/submit_voice", methods=["POST"])
def submit_voice():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Empty filename"}), 400
    
    filename = datetime.now().strftime("%Y%m%d_%H%M%S") + ".wav"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    print(f"🎤 Voice recording saved at: {filepath}")

    try:
        # 🔑 Step 1: Gemini → Transcribe + Translate
        english_text = transcribe_and_translate(filepath)
        print(english_text)

        # 🔑 Step 2: Semantic search
        search_results = semantic_search(english_text)

        # 🔑 Step 3: Append results to single JSON history file
        feedback_dir = r"D:\stathon\feedback_data"
        os.makedirs(feedback_dir, exist_ok=True)
        history_file = os.path.join(feedback_dir, "voice_history.json")

        # Load existing history
        if os.path.exists(history_file):
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        else:
            history = []

        # Append new entry
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "transcription": english_text,
            "results": search_results
        }
        history.append(history_entry)

        # Save back
        with open(history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)

        print(f"📁 Voice history updated at: {history_file}")

        # 🔑 Step 4: Return to frontend
        return jsonify({
            "status": "success",
            "transcription": english_text,
            "results": search_results
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/feedback", methods=["POST"])
def save_feedback():
    import os, json

    data = request.get_json()

    # Extract all necessary fields from frontend
    result = data.get("result", {})  # The whole result object
    feedback = data.get("feedback", "")  # "good" or "bad"
    user_input = data.get("user_input", "")  # The original text query

    # Add additional fields if missing
    history_entry = {
        "user_input": user_input,
        "title": result.get("title", ""),
        "NCO2004": result.get("NCO2004", ""),
        "NCO2015": result.get("NCO2015", ""),
        "confidence": result.get("confidence", 0),
        "hierarchy": result.get("hierarchy", {}),
        "text": result.get("text", ""),
        "embedding": result.get("embedding", []),
        "feedback": feedback
    }

    # Save in one history.json
    FEEDBACK_FOLDER = "feedback_data"
    os.makedirs(FEEDBACK_FOLDER, exist_ok=True)
    filepath = os.path.join(FEEDBACK_FOLDER, "history.json")

    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = []

    history.append(history_entry)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

    return jsonify({"status": "success", "message": "Feedback saved"}), 200

@app.route("/get_history", methods=["GET"])
def get_history():
    import os, json
    FEEDBACK_FOLDER = "feedback_data"
    filepath = os.path.join(FEEDBACK_FOLDER, "history.json")

    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            history = json.load(f)
        return jsonify(history), 200
    else:
        return jsonify([]), 200

@app.route("/clear_history", methods=["POST"])
def clear_history():
    FEEDBACK_FOLDER = "feedback_data"
    filepath = os.path.join(FEEDBACK_FOLDER, "history.json")

    if os.path.exists(filepath):
        # Overwrite with empty list
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2, ensure_ascii=False)
        return jsonify({"status": "success", "message": "History cleared"}), 200
    else:
        return jsonify({"status": "success", "message": "No history file found"}), 200
    
@app.route("/add_entry", methods=["POST"])
def add_entry():
    data = request.get_json()
    entry_type = data.get("type")
    code = str(data.get("code", "")).strip()
    name = str(data.get("name", "")).strip()

    if entry_type not in CSV_FILES:
        return jsonify({"status": "error", "message": "Invalid type"}), 400

    file_path = CSV_FILES[entry_type]

    # Load CSV if exists, else create
    if os.path.exists(file_path):
        df = pd.read_csv(file_path, dtype=str)
    else:
        df = pd.DataFrame(columns=["code", "name"])

    # ✅ Check for duplicates ONLY by code
    if code in df["code"].values:
        return jsonify({"status": "error", "message": f"Duplicate code in {entry_type}"}), 400

    # Append new entry
    new_row = pd.DataFrame([[code, name]], columns=["code", "name"])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(file_path, index=False)

    # Call indexing (rebuilds from nco2015_full.csv)
    try:
        indexing()
    except Exception as e:
        return jsonify({"status": "error", "message": f"Added but indexing failed: {str(e)}"}), 500

    return jsonify({"status": "success", "message": f"{entry_type.capitalize()} successfully added"}), 200

@app.route("/voice-data", methods=["GET"])
def voice_data():
    """API endpoint to return processed voice performance data"""
    data = process_data("feedback_data/voice_history.json")
    return jsonify(data)
@app.route("/feedback-data", methods=["GET"])
def feedback_data():
    data = process_feedback_data("feedback_data/history.json")
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
