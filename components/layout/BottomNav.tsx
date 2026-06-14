import React from "react";
import { Home, FolderOpen, Search, MapPin } from "lucide-react";

interface BottomNavProps {
  currentView: "write" | "documents" | "samples" | "offices";
  setCurrentView: (view: "write" | "documents" | "samples" | "offices") => void;
}

export default function BottomNav({ currentView, setCurrentView }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 max-w-md mx-auto shadow-lg">
      <div className="flex justify-around py-2 text-xs">
        <button
          onClick={() => setCurrentView("write")}
          className={`flex flex-col items-center px-4 py-1 transition-all ${
            currentView === "write" ? "text-[#0f766e] font-semibold scale-105" : "text-gray-500"
          }`}
          style={{ minHeight: "56px" }}
        >
          <Home size={22} className={currentView === "write" ? "text-[#0f766e]" : "text-gray-400"} />
          <span className="text-[10px] mt-1">Home</span>
          <span className="text-[8px] text-gray-400 -mt-0.5 nepali font-normal">गृह</span>
        </button>

        <button
          onClick={() => setCurrentView("documents")}
          className={`flex flex-col items-center px-4 py-1 transition-all ${
            currentView === "documents" ? "text-[#0f766e] font-semibold scale-105" : "text-gray-500"
          }`}
          style={{ minHeight: "56px" }}
        >
          <FolderOpen size={22} className={currentView === "documents" ? "text-[#0f766e]" : "text-gray-400"} />
          <span className="text-[10px] mt-1">Documents</span>
          <span className="text-[8px] text-gray-400 -mt-0.5 nepali font-normal">कागजात</span>
        </button>

        <button
          onClick={() => setCurrentView("samples")}
          className={`flex flex-col items-center px-4 py-1 transition-all ${
            currentView === "samples" ? "text-[#0f766e] font-semibold scale-105" : "text-gray-500"
          }`}
          style={{ minHeight: "56px" }}
        >
          <Search size={22} className={currentView === "samples" ? "text-[#0f766e]" : "text-gray-400"} />
          <span className="text-[10px] mt-1">Samples</span>
          <span className="text-[8px] text-gray-400 -mt-0.5 nepali font-normal">नमुना</span>
        </button>

        <button
          onClick={() => setCurrentView("offices")}
          className={`flex flex-col items-center px-4 py-1 transition-all ${
            currentView === "offices" ? "text-[#0f766e] font-semibold scale-105" : "text-gray-500"
          }`}
          style={{ minHeight: "56px" }}
        >
          <MapPin size={22} className={currentView === "offices" ? "text-[#0f766e]" : "text-gray-400"} />
          <span className="text-[10px] mt-1">Offices</span>
          <span className="text-[8px] text-gray-400 -mt-0.5 nepali font-normal">कार्यालय</span>
        </button>
      </div>
    </div>
  );
}
