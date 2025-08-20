import time
import re
import google.generativeai as genai

# 🔑 Configure Gemini
genai.configure(api_key="AIzaSyBbDi7kyb7tkjz0uRE4SvP48AsEKxHCw90")  # move to env variable later

def transcribe_and_translate(filepath: str) -> str:
    """Transcribes audio file and translates to English text only (no original word)."""
    # Upload file
    file = genai.upload_file(filepath)
    print(f"Uploaded file: {file.name}, state: {file.state}")

    # Wait until ACTIVE
    while file.state.name == "PROCESSING":
        print("⏳ File is still processing...")
        time.sleep(2)
        file = genai.get_file(file.name)

    if file.state.name != "ACTIVE":
        raise Exception(f"File did not become active. State: {file.state.name}")

    # Load model
    model = genai.GenerativeModel("gemini-1.5-flash")

    # Stronger instruction
    response = model.generate_content([
        file,
        "Transcribe the audio and translate into English. "
        "⚠️ IMPORTANT: Return ONLY the English translation. "
        "Do NOT include the original spoken word. Do NOT add punctuation or formatting."
    ])

    english_text = response.text.strip()

    # ✅ Clean (remove unwanted characters)
    cleaned_text = re.sub(r'[^A-Za-z0-9 ]+', '', english_text)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

    print("📝 Clean English Translation:", cleaned_text)
    return cleaned_text
