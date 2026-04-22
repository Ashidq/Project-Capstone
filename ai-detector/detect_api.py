"""
FastAPI YOLO Payment Screen Detector API
=========================================

Menjalankan deteksi layar HP bukti pembayaran menggunakan:
- YOLOv8n (cell phone detection)
- OpenCV quad detection
- Heuristic payment screen validation

Endpoint:
POST /detect-payment-screen

Install:
    pip install fastapi uvicorn python-multipart opencv-python numpy ultralytics

Run:
    uvicorn detect_api:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import os
from datetime import datetime

app = FastAPI(title="Payment Screen Detector API")

# WAJIB untuk Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("[YOLO] Loading yolov8n model...")
model = YOLO("yolov8n.pt")
print("[YOLO] Model ready")

PHONE_CLASS_ID = 67  # COCO class for cell phone


def ts():
    return datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]


def order_points(pts):
    pts = pts.reshape(4, 2).astype("float32")
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()

    return np.array([
        pts[np.argmin(s)],
        pts[np.argmin(d)],
        pts[np.argmax(s)],
        pts[np.argmax(d)],
    ], dtype="float32")


def four_point_warp(image, pts):
    rect = order_points(pts)
    tl, tr, br, bl = rect

    width = int(max(
        np.linalg.norm(br - bl),
        np.linalg.norm(tr - tl)
    ))

    height = int(max(
        np.linalg.norm(tr - br),
        np.linalg.norm(tl - bl)
    ))

    if width < 100 or height < 100:
        return None

    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1]
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (width, height))

    return warped


def payment_screen_score(crop):
    h, w = crop.shape[:2]
    if h == 0 or w == 0:
        return 0.0

    score = 0.0

    # portrait aspect ratio
    ar = h / max(w, 1)
    if 1.4 <= ar <= 2.5:
        score += 0.30

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    # bright UI screen
    bright_ratio = (gray > 180).mean()
    if bright_ratio > 0.35:
        score += 0.25

    # text lines
    edges = cv2.Canny(gray, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 1))
    lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)
    line_ratio = lines.sum() / (255 * h * w + 1)

    if line_ratio > 0.001:
        score += 0.25

    # UI low saturation
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    sat_mean = hsv[:, :, 1].mean()
    if sat_mean < 60:
        score += 0.20

    return min(score, 1.0)


def detect_phone_boxes(image):
    results = model(
        image,
        classes=[PHONE_CLASS_ID],
        verbose=False,
        conf=0.30
    )[0]

    boxes = []

    for box in results.boxes:
        conf = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        boxes.append((x1, y1, x2, y2, conf))

    return boxes


def detect_best_screen(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    phone_boxes = detect_phone_boxes(image)

    best_crop = None
    best_score = 0.0

    for cnt in sorted(contours, key=cv2.contourArea, reverse=True)[:30]:
        area = cv2.contourArea(cnt)
        if area < 15000:
            continue

        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

        if len(approx) < 4 or len(approx) > 6:
            continue

        crop = four_point_warp(image, approx)
        if crop is None:
            continue

        score = payment_screen_score(crop)

        x, y, w, h = cv2.boundingRect(approx)

        # bonus score jika overlap dengan YOLO phone box
        for bx1, by1, bx2, by2, conf in phone_boxes:
            ix = max(0, min(x + w, bx2) - max(x, bx1))
            iy = max(0, min(y + h, by2) - max(y, by1))
            inter = ix * iy
            union = (w * h) + ((bx2 - bx1) * (by2 - by1)) - inter

            if union > 0 and (inter / union) > 0.2:
                score += 0.25
                break

        if score > best_score:
            best_score = score
            best_crop = crop

    return best_crop, min(best_score, 1.0)


@app.get("/")
def root():
    return {"message": "Payment Detector API Running"}


@app.post("/detect-payment-screen")
async def detect_payment_screen(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            return {
                "detected": False
            }

        crop, score = detect_best_screen(image)

        # ambil phone box dari YOLO
        phone_boxes = detect_phone_boxes(image)

        if len(phone_boxes) == 0:
            return {
                "detected": False,
                "confidence": 0
            }

        # ambil box terbesar / terbaik
        x1, y1, x2, y2, conf = max(
            phone_boxes,
            key=lambda x: (x[2] - x[0]) * (x[3] - x[1])
        )

        if crop is None or score < 0.55:
            return {
                "detected": False,
                "confidence": round(float(score), 2),
                "box": {
                    "x": x1,
                    "y": y1,
                    "w": x2 - x1,
                    "h": y2 - y1
                }
            }

        filename = f"payment_{ts()}.jpg"
        save_path = os.path.join(OUTPUT_DIR, filename)
        cv2.imwrite(save_path, crop)

        return {
            "detected": True,
            "confidence": round(float(score), 2),
            "filename": filename,
            "path": save_path,
            "box": {
                "x": x1,
                "y": y1,
                "w": x2 - x1,
                "h": y2 - y1
            }
        }

    except Exception as e:
        return {
            "detected": False,
            "message": str(e)
        }