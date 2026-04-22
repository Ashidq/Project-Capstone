"use client";

interface PhoneBoxType {
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
}

export const ScanOverlay = ({
  isCapturing,
  status,
  isCVReady,
  phoneBox,
}: {
  isCapturing: boolean;
  status: string;
  isCVReady: boolean;
  phoneBox?: PhoneBoxType | null;
}) => {
  const isDenied = status === "Akses Kamera Denied";

  const topStatusClass = isCapturing
    ? "bg-yellow-500 shadow-lg"
    : isDenied
    ? "bg-red-500/80 shadow-lg"
    : "bg-[#5EBA59]/30";

  const topStatusText = isCapturing
    ? "⏳ Processing"
    : isDenied
    ? `🔴 ${status}`
    : `🟢 ${status}`;

  const frameClass = isCapturing
    ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] scale-95"
    : isDenied
    ? "border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
    : "border-[#487ADB]/60 shadow-[0_0_20px_rgba(72,122,219,0.3)]";

  return (
    <>
      {/* STATUS OVERLAY */}
      <div className={`absolute top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full z-30 transition-colors duration-300 ${topStatusClass}`}>
        {topStatusText}
      </div>

      {/* PHONE BOX BOUNDING BOX - Dari YOLO Detection */}
      {phoneBox && (
        <div
          className="absolute z-20 border-4 border-green-400 rounded-2xl shadow-[0_0_25px_rgba(74,222,128,0.6)] pointer-events-none transition-all duration-300"
          style={{
            left: `${(phoneBox.x / 720) * 100}%`,
            top: `${(phoneBox.y / 1280) * 100}%`,
            width: `${(phoneBox.w / 720) * 100}%`,
            height: `${(phoneBox.h / 1280) * 100}%`,
          }}
        >
          <div className="absolute -top-8 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            ✅ Detected ({Math.round(phoneBox.confidence * 100)}%)
          </div>
        </div>
      )}

      {/* OUTSIDE DARK OVERLAY (tanpa blur di tengah frame) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* TOP */}
        <div className="absolute top-0 left-72 w-72 h-[calc(50%-12.5rem)] bg-black/5 backdrop-blur-xl" />

        {/* BOTTOM */}
        <div className="absolute bottom-0 left-72 w-72 h-[calc(50%-12.5rem)] bg-black/5 backdrop-blur-xl" />

        {/* LEFT */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[calc(50%-9rem)] h-110 bg-black/10 backdrop-blur-xl" />

        {/* RIGHT */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[calc(50%-9rem)] h-110 bg-black/10 backdrop-blur-xl" />
      </div>

      {/* SCAN FRAME */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className={`w-70 h-98 border-2 rounded-3xl relative transition-all duration-500 ${frameClass}`}>
          {/* CORNER FRAME */}
          <div className="absolute w-10 h-10 border-t-5 border-l-5 border-inherit top-0 left-0 rounded-tl-2xl" />
          <div className="absolute w-10 h-10 border-t-5 border-r-5 border-inherit top-0 right-0 rounded-tr-2xl" />
          <div className="absolute w-10 h-10 border-b-5 border-l-5 border-inherit bottom-0 left-0 rounded-bl-2xl" />
          <div className="absolute w-10 h-10 border-b-5 border-r-5 border-inherit bottom-0 right-0 rounded-br-2xl" />

          {/* SCAN LINE */}
          {!isDenied && (
            <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#487ADB] to-transparent animate-scan top-1/2" />
          )}
        </div>
      </div>

      {/* BOTTOM STATUS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] px-5 py-1.5 rounded-full z-30 border border-white/10">
        ✨{" "}
        {isCapturing
          ? "Menyimpan ke Database..."
          : isDenied
          ? "Izin Kamera Dibutuhkan"
          : isCVReady
          ? "Siap Mendeteksi Bukti"
          : "Menginisialisasi AI Engine..."}
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 10%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 90%;
            opacity: 0;
          }
        }

        .animate-scan {
          animation: scan 2.5s infinite linear;
        }
      `}</style>
    </>
  );
};