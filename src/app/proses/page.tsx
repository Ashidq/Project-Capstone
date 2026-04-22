"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-5">
      {/* STEP 1: Persiapan AI Engine (Versi Lokal)
        Pastikan file opencv.js sudah Anda simpan di folder /public/
      */}
      <Script
        src="/opencv.js" // Memanggil file lokal di folder public
        strategy="afterInteractive"
        onLoad={() => {
          // Inisialisasi eksplisit untuk memastikan variabel 'cv' terdaftar di window
          if (window.cv) {
            window.cv.onRuntimeInitialized = () => {
              console.log("✅ AI Engine: Local OpenCV.js Ready");
            };
            
            // Antisipasi jika runtime sudah siap sebelum log terpanggil
            if (window.cv.Mat) {
               console.log("✅ AI Engine: OpenCV.js is already initialized");
            }
          }
        }}
        onError={() => {
          console.error("❌ AI Engine: Failed to load local opencv.js. Make sure it exists in /public folder.");
        }}
      />

      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20 lg:gap-32">
        
        {/* LEFT - IMAGE SECTION */}
        <div className="relative flex items-center justify-center">
          {/* Decorative Blobs */}
          <div className="absolute w-64 h-64 md:w-72 md:h-72 bg-[#E9F3FD] rounded-full top-[-30px] right-[-30px] z-0"></div>
          <div className="absolute w-40 h-40 md:w-50 md:h-50 bg-[#B5DAFF] rounded-full bottom-[-10px] right-[-60px] z-0"></div>
          <div className="absolute w-60 h-60 md:w-75 md:h-75 bg-[#CDE1F8] rounded-full bottom-[-30px] left-[-80px] z-0"></div>

          {/* QR Container */}
          <div className="relative z-10 bg-white p-2 rounded-2xl shadow-2xl border border-gray-100">
            <Image
              src="/Qris.png"
              alt="QRIS Payment Gateway"
              width={250}
              height={350}
              className="rounded-xl shadow-inner"
              priority
            />
          </div>
        </div>

        {/* RIGHT - CONTENT SECTION */}
        <div className="text-center md:text-left max-w-md mt-10 md:mt-0">
          
          <h1 className="text-3xl md:text-4xl font-bold text-[#2B4C7E] mb-4 leading-tight">
            Silakan lakukan pembayaran terlebih dahulu
          </h1>

          <p className="text-[#5f6f89] mb-8 text-lg leading-relaxed">
            Scan Qris di samping melalui aplikasi e-wallet Anda, lalu tekan tombol di bawah untuk memverifikasi bukti transfer secara otomatis.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/scan")}
              className="w-full md:w-auto bg-gradient-to-r from-[#5A8DEE] to-[#487ADB] text-white px-12 py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-[#487ADB]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold text-lg"
            >
              Mulai Scan Bukti
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}