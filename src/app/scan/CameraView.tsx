"use client";

import {
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

import { useCameraCV } from "../../hooks/useCameraCV";
import { ScanOverlay } from "../../components/layout/ScanOverlay";

interface CameraViewProps {
  status: string;
  isCapturing: boolean;
  isCVReady: boolean;
  onAutoCapture?: () => void;
}

export const CameraView = forwardRef((props: CameraViewProps, ref) => {
  /*
   =====================================================
   CANVAS UNTUK CAPTURE FINAL (hasil screenshot)
   =====================================================
  */
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  /*
   =====================================================
   useCameraCV
   - videoRef = stream kamera
   - canvasRef = hidden canvas untuk OpenCV detection
   - phoneBox = bounding box deteksi HP dari YOLO
   =====================================================
  */
  const {
    videoRef,
    canvasRef,
    phoneBox,
  } = useCameraCV(
    props.isCVReady,
    props.isCapturing,
    props.onAutoCapture
  );

  /*
   =====================================================
   METHOD capture()
   dipanggil dari page.tsx
   =====================================================
  */
  useImperativeHandle(ref, () => ({
    capture: () => {
      if (!videoRef.current || !captureCanvasRef.current) {
        return null;
      }

      const video = videoRef.current;
      const canvas = captureCanvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png", 1);
      });
    },
  }));

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-black shadow-inner">
      {/* =====================================================
          VIDEO CAMERA
      ===================================================== */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-700 ${
          props.isCVReady
            ? "opacity-100"
            : "opacity-40"
        }`}
      />

      {/* =====================================================
          HIDDEN CANVAS
          1. canvasRef → OpenCV detection
          2. captureCanvasRef → final capture
      ===================================================== */}

      {/* untuk OpenCV detection */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* untuk hasil capture final */}
      <canvas
        ref={captureCanvasRef}
        className="hidden"
      />

      {/* =====================================================
          OVERLAY UI
      ===================================================== */}
      <ScanOverlay
        isCapturing={props.isCapturing}
        status={props.status}
        isCVReady={props.isCVReady}
        phoneBox={phoneBox}
      />
    </div>
  );
});

CameraView.displayName = "CameraView";