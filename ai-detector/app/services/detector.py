import cv2
from app.services.scorer import payment_screen_score
from app.utils.image import four_point_warp


def detect_best_screen(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    best_crop = None
    best_score = 0.0

    for cnt in sorted(contours, key=cv2.contourArea, reverse=True)[:20]:
        if cv2.contourArea(cnt) < 10000:
            continue

        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

        if not (4 <= len(approx) <= 6):
            continue

        crop = four_point_warp(image, approx)
        if crop is None:
            continue

        score = payment_screen_score(crop)

        if score > best_score:
            best_score = score
            best_crop = crop

    return best_crop, best_score