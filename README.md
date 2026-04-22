# Jujurly Canteen (Next.js + FastAPI + YOLOv8)

Project ini adalah sistem deteksi layar pembayaran berbasis **Computer Vision + AI (YOLOv8)** yang terintegrasi dengan frontend **Next.js**.

Sistem ini dapat:
- 📱 Mendeteksi layar HP dari kamera secara real-time
- 🔍 Menentukan area layar pembayaran
- 📸 Auto capture ketika kondisi stabil
- 🧠 Menyediakan hasil untuk OCR / ekstraksi QRIS / payment data

---

## 🏗️ Project Structure

```
Project-Capstone/
│
├── src/                      # FRONTEND (Next.js)
│   ├── app/
│   │   ├── scan/            # Camera scanning page
│   │   ├── proses/
│   │   ├── hasil/
│   │   └── page.tsx
│   │
│   ├── hooks/               # CV logic frontend
│   │   ├── useCameraCV.ts
│   │   ├── useCameraStream.ts
│   │   ├── useFrameSender.ts
│   │   └── useStability.ts
│   │
│   ├── components/
│   └── types/
│
├── ai-detector/             # BACKEND (FastAPI + YOLOv8)
│   ├── app/
│   │   ├── routes/
│   │   │   └── payment.py   # API endpoints
│   │   │
│   │   ├── services/
│   │   │   ├── detector.py  # screen detection logic
│   │   │   ├── scorer.py    # scoring system
│   │   │   └── yolo_service.py
│   │   │
│   │   ├── utils/
│   │   │   ├── image.py
│   │   │   ├── image_enhance.py
│   │   │   └── time.py
│   │   │
│   │   └── main.py
│   │
│   ├── output/              # hasil capture image
│   ├── run.py               # entry point backend
│   └── yolov8n.pt
│
├── public/                  # static assets (QRIS, opencv.js)
└── package.json
```

---

## 🚀 Backend Setup (FastAPI)

Masuk ke folder backend:

```bash
cd ai-detector
```

Install dependency:

```bash
pip install fastapi uvicorn opencv-python numpy ultralytics
```

Jalankan server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🌐 Frontend Setup (Next.js)

Dari root project:

```bash
npm install
npm run dev
```

Akses:

```
http://localhost:3000
```

---

## 🔗 API Endpoint

### 📌 Detect Screen

```
POST /detect-payment-screen
```

Response:

```json
{
  "detected": true,
  "confidence": 0.87,
  "box": {
    "x": 120,
    "y": 200,
    "w": 400,
    "h": 800
  }
}
```

---

### 📸 Capture Image

```
POST /capture-payment
```

Response:

```json
{
  "success": true,
  "filename": "payment_20260422.jpg",
  "confidence": 0.85
}
```

---

## 🧠 AI Pipeline Flow

1. Webcam stream (Next.js)
2. Frame dikirim ke backend setiap 500ms
3. YOLOv8 detect phone area
4. OpenCV crop + perspective warp
5. Stability check (frontend)
6. Auto capture jika stabil
7. Image disimpan di `/output`
8. Siap untuk OCR / QRIS reading

---

## 🔥 Features

* Real-time camera detection
* YOLOv8 object detection
* Perspective correction (warp)
* Stability-based auto capture
* Modular backend architecture
* Ready OCR pipeline (next step)

---

## 📦 Output Sample

File hasil tersimpan di:

```
ai-detector/output/
```

---

## 🧪 Tech Stack

* **Frontend:** Next.js, TypeScript, React Hooks
* **Backend:** FastAPI, Python
* **AI/ML:** YOLOv8 (Ultralytics)
* **Image Processing:** OpenCV
* **Others:** NumPy

---

## 🚀 Next Improvement (Roadmap)

- [ ] OCR QRIS / payment extraction
- [ ] Image enhancement (contrast, sharpen, denoise)
- [ ] Multi-device support
- [ ] Database logging (Supabase / PostgreSQL)
- [ ] Export transaksi

---

## 📌 Important Notes

- Backend harus dijalankan sebelum frontend detection bekerja
- Model file `yolov8n.pt` wajib ada
- Jangan commit folder `/output`

---

## 👨‍💻 Author

Capstone Project – AI Payment Detection System

---

**Last Updated:** April 22, 2026
