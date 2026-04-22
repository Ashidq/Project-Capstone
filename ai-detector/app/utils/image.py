import cv2
import numpy as np


# =========================
# ORDER POINTS
# =========================
def order_points(pts):
    pts = pts.reshape(4, 2).astype("float32")

    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()

    return np.array([
        pts[np.argmin(s)],  # top-left
        pts[np.argmin(d)],  # top-right
        pts[np.argmax(s)],  # bottom-right
        pts[np.argmax(d)],  # bottom-left
    ], dtype="float32")


# =========================
# ASPECT RATIO NORMALIZER
# =========================
def normalize_aspect_ratio(width, height):
    """
    Menjaga agar hasil tidak gepeng / ketarik.
    Target rasio: portrait (HP)
    """

    if width == 0 or height == 0:
        return width, height

    # 🔥 tentukan orientasi
    is_portrait = height >= width

    if is_portrait:
        TARGET_RATIO = 16 / 9  # tinggi:lebar
    else:
        TARGET_RATIO = 9 / 16

    current_ratio = height / width

    # 🔥 koreksi dimensi
    if current_ratio > TARGET_RATIO:
        # terlalu tinggi → lebarkan
        width = int(height / TARGET_RATIO)
    else:
        # terlalu lebar → tinggikan
        height = int(width * TARGET_RATIO)

    return width, height


# =========================
# PERSPECTIVE WARP
# =========================
def four_point_warp(image, pts):
    rect = order_points(pts)
    tl, tr, br, bl = rect

    # ukuran awal dari kontur
    width = int(max(
        np.linalg.norm(br - bl),
        np.linalg.norm(tr - tl)
    ))

    height = int(max(
        np.linalg.norm(tr - br),
        np.linalg.norm(tl - bl)
    ))

    # filter noise kecil
    if width < 100 or height < 100:
        return None

    # 🔥 FIX UTAMA: NORMALISASI RATIO
    width, height = normalize_aspect_ratio(width, height)

    # optional: limit biar nggak terlalu gede (hemat RAM + lebih stabil)
    MAX_SIZE = 1024
    scale = min(MAX_SIZE / max(width, height), 1.0)

    width = int(width * scale)
    height = int(height * scale)

    # destination points
    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1]
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (width, height))

    return warped