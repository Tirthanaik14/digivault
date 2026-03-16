# app/services/face_service.py
import base64
import logging
import os
import tempfile

from fastapi import HTTPException
from app.core.config import FACE_MATCH_THRESHOLD

logger = logging.getLogger(__name__)

def compare_faces(aadhaar_photo_b64: str, selfie_b64: str) -> dict:
    from deepface import DeepFace

    def clean(s):
        """Strip data URI prefix if present (e.g., data:image/jpeg;base64,)."""
        return s.split(",")[1] if "," in s else s

    aadhaar_path = selfie_path = None
    try:
        # 1. Prepare Base64 Data
        aadhaar_clean = clean(aadhaar_photo_b64)
        selfie_clean  = clean(selfie_b64)

        logger.info("Aadhaar photo b64 length: %d", len(aadhaar_clean))
        logger.info("Selfie b64 length: %d", len(selfie_clean))

        if len(aadhaar_clean) < 100:
            raise HTTPException(
                status_code=422,
                detail="Aadhaar photo is missing or too small."
            )

        # 2. Save to temporary files for DeepFace to read
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f1:
            f1.write(base64.b64decode(aadhaar_clean))
            aadhaar_path = f1.name

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f2:
            f2.write(base64.b64decode(selfie_clean))
            selfie_path = f2.name

        # 3. Run DeepFace Verification
        # Using Cosine distance: 0.0 is exact match, 1.0 is completely different
        result = DeepFace.verify(
            img1_path         = aadhaar_path,
            img2_path         = selfie_path,
            model_name        = "VGG-Face",
            distance_metric   = "cosine",
            enforce_detection = False,  # Useful for low-res Aadhaar photos
        )

        distance = float(result.get("distance", 1.0))
        
        # 4. Logical Check
        # If distance is SMALLER than threshold, it's the same person.
        matched = distance <= FACE_MATCH_THRESHOLD

        # Optional: Convert to a 0-100% confidence for logging/frontend
        confidence = max(0.0, min(100.0, (1.0 - distance) * 100))

        logger.info(
            "Face match result -> Distance: %.3f, Threshold: %.2f, Confidence: %.1f%%, Matched: %s",
            distance, FACE_MATCH_THRESHOLD, confidence, matched
        )

        if not matched:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Face verification failed. Match distance ({distance:.3f}) "
                    f"exceeds the allowed threshold ({FACE_MATCH_THRESHOLD}). "
                    "Please ensure you are in a well-lit area."
                )
            )

        return {
            "similarity": 1.0 - distance,  # Add this back for kyc.py
            "distance": distance,
            "matched": matched
        }

    except HTTPException:
        # Re-raise FastAPIs HTTPExceptions so they reach the client
        raise
    except Exception as exc:
        logger.error("DeepFace engine error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Facial recognition engine error: {str(exc)}"
        )
    finally:
        # 5. Clean up temporary files
        for path in [aadhaar_path, selfie_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except Exception:
                    pass