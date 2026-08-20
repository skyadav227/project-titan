import sys
import json
from faster_whisper import WhisperModel

MODEL_SIZE = "base.en"

model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8"
)


def transcribe(audio_path):
    segments, info = model.transcribe(
        audio_path,
        language="en",
        beam_size=5,
        vad_filter=True,
        temperature=0,
        condition_on_previous_text=False
    )

    text = " ".join(
        segment.text.strip()
        for segment in segments
        if segment.text.strip()
    ).strip()

    return {
        "text": text,
        "language": info.language or "en",
        "confidence": None,
        "provider": "faster-whisper",
        "model": MODEL_SIZE,
        "available": True
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Audio path is required"
        }))
        sys.exit(1)

    audio_path = sys.argv[1]

    try:
        result = transcribe(audio_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "error": str(e)
        }))
        sys.exit(1)