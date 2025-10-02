import os
import sounddevice as sd
import numpy as np
import whisper
import tempfile
import scipy.io.wavfile as wav

# 🔹 Force Whisper to find ffmpeg (CHANGE this to your actual bin folder)
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg-8.0-essentials_build\bin"
# Example if you installed on D drive:
# os.environ["PATH"] += os.pathsep + r"D:\tools\ffmpeg\bin"

# Load Whisper model (options: tiny, base, small, medium, large)
model = whisper.load_model("base")  # "tiny" is fastest, "large" is most accurate

def record_and_transcribe(duration=7, samplerate=16000):
    """
    Record audio from mic and transcribe it using Whisper
    :param duration: seconds to record
    :param samplerate: audio sample rate
    """
    print(f"🎤 Recording for {duration} seconds... Speak now!")
    recording = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype='int16')
    sd.wait()
    print("✅ Recording finished!")

    # Save temp audio file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmpfile:
        wav.write(tmpfile.name, samplerate, recording)
        audio_path = tmpfile.name

    # Transcribe with Whisper
    print("⏳ Transcribing...")
    result = model.transcribe(audio_path)
    text = result["text"]

    # Cleanup
    os.remove(audio_path)
    
    return text

# Run the script
if __name__ == "__main__":
    output = record_and_transcribe(duration=30)  # record for 7 seconds
    print("📝 Transcribed text:", output)
