import React from "react";
import { FileText, Plus, User } from "lucide-react";
import { Document } from "@/lib/types";

interface HeaderProps {
  currentDoc: Document | null;
  currentView: string;
  onNewDocument: () => void;
  onOpenProfile: () => void;
}

export default function Header({ currentDoc, currentView, onNewDocument, onOpenProfile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-[#f8f5f0]/95 backdrop-blur">
      <div className="max-w-md mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0f766e] text-white flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <div className="font-bold tracking-tight text-lg leading-none">Gorkhay AI</div>
            <div className="text-[9px] text-[#555] tracking-tight mt-0.5">Speak. We write for you.</div>
          </div>
        </div>

        {/* Dynamic Actions */}
        <div className="flex items-center gap-2">
          {currentDoc && currentView === "write" && (
            <button
              onClick={onNewDocument}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-xs hover:bg-white transition-all bg-white/50"
              style={{ minHeight: "36px" }}
            >
              <Plus size={14} className="text-[#0f766e]" />
              <span className="font-medium">New</span>
            </button>
          )}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-xs hover:bg-white transition-all bg-white/50"
            style={{ minHeight: "36px" }}
          >
            <User size={14} className="text-[#0f766e]" />
            <span className="font-medium">Details</span>
          </button>
        </div>
      </div>
    </header>
  );
}
