"use client";

import { FaInstagram, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#487ADB] text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* LEFT - SOCIAL MEDIA */}
        <div className="flex items-center gap-20 text-sm">
          <div className="flex items-center gap-5">
            <div className="bg-white text-[#487ADB] rounded-full p-2 shadow-md hover:scale-110 transition">
              <FaTiktok size={16} />
            </div>
            <span>@hmit.store</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="bg-white text-[#487ADB] rounded-full p-2 shadow-md hover:scale-110 transition">
              <FaInstagram size={16} />
            </div>
            <span>@hmit.store</span>
            </div>
        </div>

        {/* CENTER - PROJECT */}
        <div className="text-sm font-medium">
          Project Capstone
        </div>

        {/* RIGHT - TEAM */}
        <div className="text-sm flex gap-5">
          <span>Wira</span>
          <span>|</span>
          <span>Abid</span>
          <span>|</span>
          <span>Satya</span>
          <span>|</span>
          <span>Syahmi</span>
        </div>

      </div>
    </footer>
  );
}