from fastapi import APIRouter, UploadFile, File
import cv2
import numpy as np
import os

from app.services.detector import detect_best_screen
from app.services.yolo_service import detect_phone_boxes
from app.utils.time import ts
from app.utils.image_enhance import enhance_image  # 🔥 NEW

router = APIRouter()

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 🔥 simple runtime lock
HAS_CAPTURED = False


@router.get("/")
def root():
    return {"message": "Payment Detector API Running"}


# =========================
# DETECT ONLY
# =========================
@router.post("/detect-payment-screen")
async def detect_payment_screen(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)

        if image is None:
            return {"detected": False}

        crop, score = detect_best_screen(image)
        phones = detect_phone_boxes(image)

        h, w = image.shape[:2]

        # 🔥 ALWAYS RETURN VALID BOX
        if len(phones) > 0:
            x1, y1, x2, y2 = phones[0]
            box = {
                "x": x1,
                "y": y1,
                "w": x2 - x1,
                "h": y2 - y1
            }
        else:
            box = {
                "x": 0,
                "y": 0,
                "w": w,
                "h": h
            }

        detected = crop is not None and score >= 0.45

        print(f"[DETECT] score={score:.2f} detected={detected}")

        return {
            "detected": detected,
            "confidence": round(float(score), 2),
            "box": box
        }

    except Exception as e:
        print("[ERROR DETECT]", str(e))
        return {"detected": False}


# =========================
# CAPTURE + SAVE IMAGE
# =========================
@router.post("/capture-payment")
async def capture_payment(file: UploadFile = File(...)):
    global HAS_CAPTURED

    # 🔥 HARD LOCK (prevent spam)
    if HAS_CAPTURED:
        return {
            "success": False,
            "message": "already_captured"
        }

    try:
        contents = await file.read()
        image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)

        if image is None:
            return {"success": False}

        crop, score = detect_best_screen(image)

        # 🔥 fallback
        final_image = crop if crop is not None else image

        # =========================
        # 🔥 ENHANCE IMAGE (NEW)
        # =========================
        final_image = enhance_image(final_image)

        filename = f"payment_{ts()}.jpg"
        save_path = os.path.join(OUTPUT_DIR, filename)

        cv2.imwrite(save_path, final_image)

        HAS_CAPTURED = True

        print(f"[CAPTURE] Saved: {filename}")

        return {
            "success": True,
            "filename": filename,
            "confidence": round(float(score), 2)
        }

    except Exception as e:
        print("[ERROR CAPTURE]", str(e))
        return {"success": False}