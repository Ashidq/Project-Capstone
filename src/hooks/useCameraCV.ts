// src/hooks/useCameraCV.ts
// Next.js App Router + FastAPI YOLO Detector
// Flow:
// Camera → Frame → Python YOLO API → Stable Detection → Auto Capture

"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

interface PhoneBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
}

export const useCameraCV = (
  isCVReady: boolean,
  isCapturing: boolean,
  onAutoCapture?: () => void
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectCanvasRef = useRef<HTMLCanvasElement>(null);

  const detectionCountRef = useRef<number>(0);
  const requestLockRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ===== STATE untuk phoneBox =====
  const [phoneBox, setPhoneBox] = useState<PhoneBox | null>(null);

  /*
  =====================================
  INIT CAMERA
  =====================================
  */
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (videoRef.current) {
          const video = videoRef.current;

          // Hindari reload stream berulang
          if (!video.srcObject) {
            video.srcObject = stream;
          }

          // Tunggu metadata siap sebelum play()
          video.onloadedmetadata = async () => {
            try {
              await video.play();
              console.log("✅ Camera ready");
            } catch (err) {
              console.error("Video play error:", err);
            }
          };
        }
      } catch (error) {
        console.error("Camera access denied:", error);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /*
  =====================================
  SEND FRAME TO PYTHON YOLO API
  =====================================
  */
  useEffect(() => {
    if (!isCVReady || isCapturing) return;

    const video = videoRef.current;
    const canvas = detectCanvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const detectPaymentScreen = async () => {
      if (
        requestLockRef.current ||
        !video ||
        video.videoWidth === 0 ||
        video.paused ||
        video.ended ||
        isCapturing
      ) {
        return;
      }

      requestLockRef.current = true;

      try {
        /*
        =====================================
        Resize lebih kecil agar request cepat
        =====================================
        */
        canvas.width = 720;
        canvas.height = 1280;

        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        /*
        =====================================
        Convert canvas → blob
        =====================================
        */
        const blob: Blob | null = await new Promise((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (!blob) {
          requestLockRef.current = false;
          return;
        }

        /*
        =====================================
        Send to FastAPI
        =====================================
        */
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const response = await fetch(
          `${API_URL}/detect-payment-screen`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();

        if (result.box) {
          setPhoneBox(result.box);
        } else {
          setPhoneBox(null);
        }

        /*
        =====================================
        STABILITY CHECK
        harus detect beberapa kali
        =====================================
        */
        if (result.detected) {
          detectionCountRef.current += 1;

          console.log(
            `📱 Stable Detection Count: ${detectionCountRef.current}`,
            result.confidence
          );

          /*
          =====================================
          Auto capture setelah stabil 3x
          =====================================
          */
          if (detectionCountRef.current >= 3) {
            detectionCountRef.current = 0;

            console.log("📸 AUTO CAPTURE TRIGGERED");

            if (onAutoCapture) {
              onAutoCapture();
            }
          }
        } else {
          detectionCountRef.current = Math.max(
            0,
            detectionCountRef.current - 1
          );
        }
      } catch (error) {
        console.error("YOLO API Detection Error:", error);
      } finally {
        requestLockRef.current = false;
      }
    };

    /*
    =====================================
    Detect tiap 1 detik
    =====================================
    */
    intervalRef.current = setInterval(() => {
      detectPaymentScreen();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCVReady, isCapturing, onAutoCapture]);

  // return di bawah ganti jadi:
  return {
    videoRef,
    canvasRef: detectCanvasRef,
    phoneBox,
  };
};