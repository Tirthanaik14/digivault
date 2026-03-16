# app/services/voice_service.py
"""
Text-to-speech alerts via pyttsx3.
Plays audio on the server machine — ideal for live demos.

The three alerts triggered by the frontend:
  1. User Dashboard button      → "Welcome. Please complete your identity verification..."
  2. Analyst Hub flagged row    → "High-risk anomaly detected!"
  3. After Report action        → "High-risk anomaly reported to Central Bank."
"""
import logging
import threading

logger = logging.getLogger(__name__)

# Initialise the TTS engine once at module load
# pyttsx3 must be initialised in the main thread but can speak in any thread
_engine = None

def _get_engine():
    global _engine
    if _engine is None:
        try:
            import pyttsx3
            _engine = pyttsx3.init()
            _engine.setProperty("rate", 165)    # words per minute
            _engine.setProperty("volume", 0.95)
        except Exception as exc:
            logger.warning("pyttsx3 init failed (no audio device?): %s", exc)
    return _engine


def speak(text: str) -> bool:
    """
    Speaks `text` asynchronously on the server machine.
    Returns True if speech was triggered, False if TTS is unavailable.
    """
    engine = _get_engine()
    if engine is None:
        logger.warning("TTS unavailable — would have spoken: %s", text)
        return False

    def _speak():
        try:
            engine.say(text)
            engine.runAndWait()
        except Exception as exc:
            logger.error("TTS speak error: %s", exc)

    # Run in a daemon thread so it doesn't block the API response
    t = threading.Thread(target=_speak, daemon=True)
    t.start()
    return True


# ── Predefined alert texts (match the SRS exactly) ────────────────────────────
WELCOME_MESSAGE  = "Welcome. Please complete your identity verification to enable transactions."
ANOMALY_DETECTED = "High-risk anomaly detected!"
ANOMALY_REPORTED = "High-risk anomaly reported to Central Bank."
