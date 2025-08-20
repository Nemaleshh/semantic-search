import json
import re

def load_data(json_file="feedback_data/voice_history.json"):
    """Load raw data from JSON file"""
    with open(json_file, "r", encoding="utf-8") as f:
        return json.load(f)

def clean_transcription(transcription: str) -> str:
    """
    Extract only the translated part after 'The English translation is:'.
    Example:
    'The audio says: कपड़ा\n\nThe English translation is: **Cloth** or **Fabric**.'
    → 'Cloth or Fabric'
    """
    if "The English translation is:" in transcription:
        part = transcription.split("The English translation is:", 1)[1].strip()
        part = re.sub(r"\*\*(.*?)\*\*", r"\1", part)  # remove **...**
        return part.strip(" .")

    if "This translates to English as:" in transcription:
        part = transcription.split("This translates to English as:", 1)[1].strip()
        part = re.sub(r"\*\*(.*?)\*\*", r"\1", part)
        return part.strip(" .")

    return transcription.strip()

def process_data(json_file="feedback_data/voice_history.json"):
    """Return cleaned data with timestamp, transcription, and results"""
    raw_data = load_data(json_file)
    processed = []

    for entry in raw_data:
        processed_entry = {
            "timestamp": entry.get("timestamp"),
            "transcription": clean_transcription(entry.get("transcription", "")),
            "results": []
        }
        for result in entry.get("results", {}).get("results", []):
            processed_entry["results"].append({
                "title": result.get("title"),
                "NCO2015": result.get("NCO2015"),
                "confidence": result.get("confidence")
            })
        processed.append(processed_entry)

    return processed

# ----------------- EXISTING FUNCTIONS -----------------
def load_data(json_file):
    """Load raw data from JSON file"""
    with open(json_file, "r", encoding="utf-8") as f:
        return json.load(f)

def clean_transcription(transcription: str) -> str:
    """Extract only the translated part after English translation notes."""
    if "The English translation is:" in transcription:
        part = transcription.split("The English translation is:", 1)[1].strip()
        part = re.sub(r"\*\*(.*?)\*\*", r"\1", part)
        return part.strip(" .")

    if "This translates to English as:" in transcription:
        part = transcription.split("This translates to English as:", 1)[1].strip()
        part = re.sub(r"\*\*(.*?)\*\*", r"\1", part)
        return part.strip(" .")

    return transcription.strip()

def process_data(json_file="feedback_data/voice_history.json"):
    """Return cleaned data with timestamp, transcription, and results"""
    raw_data = load_data(json_file)
    processed = []

    for entry in raw_data:
        processed_entry = {
            "timestamp": entry.get("timestamp"),
            "transcription": clean_transcription(entry.get("transcription", "")),
            "results": []
        }
        for result in entry.get("results", {}).get("results", []):
            processed_entry["results"].append({
                "title": result.get("title"),
                "NCO2015": result.get("NCO2015"),
                "confidence": result.get("confidence")
            })
        processed.append(processed_entry)

    return processed


# ----------------- NEW FUNCTION -----------------
def process_feedback_data(json_file="feedback_data/history.json"):
    """Extract feedback, user_input, title, confidence, NCO2015"""
    raw_data = load_data(json_file)
    processed = []

    for entry in raw_data:
        processed.append({
            "user_input": entry.get("user_input"),
            "title": entry.get("title"),
            "confidence": entry.get("confidence"),
            "NCO2015": entry.get("NCO2015"),
            "feedback": entry.get("feedback")
        })

    return processed