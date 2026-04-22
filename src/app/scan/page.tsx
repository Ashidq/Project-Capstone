"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { MdLightbulbOutline } from "react-icons/md";
import { MdOutlineLightMode } from "react-icons/md";
import { HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import { LuScanLine } from "react-icons/lu";
import { CameraView } from "./CameraView";
import { uploadAndSaveTransaction } from "./supabase-logic";
import Footer from "../../components/layout/Footer";

declare global {
  interface Window {
    cv: any;
  }
}

export default function ScanPage() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isOpenCVReady, setIsOpenCVReady] = useState(false);
  const [status, setStatus] = useState("Menyiapkan Engine CV...");

  const [cameraPermission, setCameraPermission] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  /**
   * CHECK CAMERA PERMISSION
   */
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });

        stream.getTracks().forEach((track) => track.stop());

        setCameraPermission("granted");
        setStatus("Kamera Aktif");
      } catch (error) {
        console.error("Akses kamera ditolak:", error);

        setCameraPermission("denied");
        setStatus("Akses Kamera Denied");
      }
    };

    checkCameraPermission();
  }, []);

  /**
   * CHECK OPENCV READY
   */
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const validateCV = () => {
      if (typeof window.cv !== "undefined") {
        if (window.cv.Mat) {
          setIsOpenCVReady(true);

          if (cameraPermission === "granted") {
            setStatus("Kamera Aktif");
          }

          if (checkInterval) clearInterval(checkInterval);
          return;
        }

        window.cv.onRuntimeInitialized = () => {
          setIsOpenCVReady(true);

          if (cameraPermission === "granted") {
            setStatus("Kamera Aktif");
          }

          if (checkInterval) clearInterval(checkInterval);
        };
      }
    };

    validateCV();
    checkInterval = setInterval(validateCV, 500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [cameraPermission]);

  /**
   * HANDLE CAPTURE
   */
  const onCapture = useCallback(async () => {
    if (isCapturing || cameraPermission !== "granted") return;

    const blob = await cameraRef.current?.capture();
    if (!blob) return;

    setIsCapturing(true);
    setStatus("Memproses Bukti...");

    try {
      await uploadAndSaveTransaction(blob);

      setStatus("Transfer Berhasil! Mengalihkan...");

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Gagal memproses transaksi:", err);

      setStatus("Gagal Simpan. Coba lagi.");
      setIsCapturing(false);
    }
  }, [isCapturing, router, cameraPermission]);

  /**
   * RETRY CAMERA PERMISSION
   */
  const retryCameraPermission = async () => {
    try {
      setStatus("Meminta izin kamera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());

      setCameraPermission("granted");
      setStatus("Kamera Aktif");
    } catch (error) {
      console.error("Permission gagal:", error);

      setCameraPermission("denied");
      setStatus("Akses Kamera Denied");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col">
      {/* MAIN */}
      <div className="flex-grow flex items-center justify-center px-6 py-8 pb-28">
        <div className="w-full max-w-7xl grid lg:grid-cols-[1fr_320px] gap-8">

          {/* CAMERA AREA */}
          <div className="bg-white rounded-[28px] shadow-lg">
            <>
              <div className="rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
                <CameraView
                  ref={cameraRef}
                  status={status}
                  isCapturing={isCapturing}
                  isCVReady={isOpenCVReady}
                  onAutoCapture={onCapture}
                />
              </div>

              <div className="flex justify-between mt-5 p-5">
                <button
                  onClick={() => router.back()}
                  className="px-8 py-2 rounded-full border border-[#487ADB] text-[#487ADB] font-medium text-sm"
                >
                  ✕ Batal
                </button>

                <button
                  onClick={
                    cameraPermission !== "granted"
                      ? retryCameraPermission
                      : onCapture
                  }
                  disabled={
                    isCapturing || !isOpenCVReady
                  }
                  className={`px-8 py-2 rounded-full font-semibold text-sm shadow ${
                    isCapturing || !isOpenCVReady
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-[#487ADB] text-white hover:bg-[#3E69BE]"
                  }`}
                >
                  {cameraPermission !== "granted"
                    ? "Izinkan Kamera"
                    : isCapturing
                    ? "Memproses..."
                    : !isOpenCVReady
                    ? "Memuat AI..."
                    : "Scan Ulang"}
                </button>
              </div>
            </>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl shadow-md p-6">
              <div className="flex items-center gap-5">
                <div className="bg-[#E6F1FD] text-[#487ADB] rounded-full p-2 shadow-md">
                  <MdLightbulbOutline size={45} />
                </div>
                <h3 className="text-[#487ADB] font-bold text-lg">
                  Tips
                </h3>
              </div>

              <p className="text-m text-black leading-relaxed mt-2">
                Pastikan bukti pembayaran terlihat jelas dan tidak buram.
              </p>
            </div>

            <div className="bg-[#487ADB] rounded-3xl p-5 shadow-md overflow-hidden">
              <div className="flex items-center  p-5 gap-5">
                <div className="bg-[#E6F1FD] text-[#487ADB] rounded-full p-2 shadow-md">
                  <MdOutlineLightMode size={25} />
                </div>
                <h3 className="text-white text-lg">
                  Cahaya cukup
                </h3>
              </div>
              <div className="flex items-center  p-5 gap-5">
                <div className="bg-[#E6F1FD] text-[#487ADB] rounded-full p-2 shadow-md">
                  <LuScanLine size={25} />
                </div>
                <h3 className="text-white text-lg">
                  posisi didalam frame
                </h3>
              </div>
              <div className="flex items-center  p-5 gap-5">
                <div className="bg-[#E6F1FD] text-[#487ADB] rounded-full p-2 shadow-md">
                  <HiOutlineDevicePhoneMobile size={25} />
                </div>
                <h3 className="text-white text-lg">
                  Jangan miring
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  AI Core Status
                </span>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isOpenCVReady
                      ? "bg-green-50 text-green-600"
                      : "bg-yellow-50 text-yellow-600"
                  }`}
                >
                  {isOpenCVReady
                    ? "CORE ACTIVE"
                    : "INITIALIZING"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#487ADB] text-white">
        <Footer />
      </footer>
    </div>
  );
}