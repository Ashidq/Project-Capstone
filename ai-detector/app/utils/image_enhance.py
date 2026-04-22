import cv2
import numpy as np


def auto_brightness_contrast(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # histogram stretch
    min_val = np.percentile(gray, 2)
    max_val = np.percentile(gray, 98)

    alpha = 255 / (max_val - min_val + 1e-5)
    beta = -min_val * alpha

    adjusted = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
    return adjusted


def sharpen(image):
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])

    return cv2.filter2D(image, -1, kernel)


def denoise(image):
    return cv2.bilateralFilter(image, 9, 75, 75)


def enhance_image(image):
    """
    Pipeline utama:
    1. brightness/contrast normalize
    2. denoise
    3. sharpen
    """

    img = auto_brightness_contrast(image)
    img = denoise(img)
    img = sharpen(img)

    return img