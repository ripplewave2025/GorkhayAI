import React from "react";
import { ChevronLeft, ChevronRight, Play, Download, Volume2, History } from "lucide-react";
import { NarrationVersion } from "@/lib/types";

interface NarrationPanelProps {
  nepaliNarration: string;
  narrationHistory: NarrationVersion[];
  currentNarrationIndex: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDownload: () => void;
}

export default function NarrationPanel({
  nepaliNarration,
  narrationHistory,
  currentNarrationIndex,
  onPlay,
  onPrev,
  onNext,
  onDownload,
}: NarrationPanelProps) {
  if (!nepaliNarration) return null;

  const totalVersions = narrationHistory.length;
  const currentNum = currentNarrationIndex + 1;
  const currentVersionObj = narrationHistory[currentNarrationIndex];

  return (
    <div className="bg-white border border-[#e6e0d4] rounded-3xl p-5 shadow-sm space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Volume2 size={20} className="text-[#0f766e]" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm leading-none">Nepali Audio Narration</h4>
            <p className="text-[10px] text-gray-500 mt-1">Sajilo Nepali summary &amp; rephrasing of the letter</p>
          </div>
        </div>

        {/* Version Picker */}
        {totalVersions > 1 && (
          <div className="flex items-center gap-1.5 bg-[#fcfbf9] border rounded-full px-2.5 py-1 text-xs">
            <History size={11} className="text-gray-400" />
            <button
              onClick={onPrev}
              disabled={currentNarrationIndex <= 0}
              className="hover:bg-gray-200 rounded p-0.5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-semibold text-gray-700 select-none">
              v{currentNum} / {totalVersions}
            </span>
            <button
              onClick={onNext}
              disabled={currentNarrationIndex >= totalVersions - 1}
              className="hover:bg-gray-200 rounded p-0.5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Nepali Text Display Box */}
      <div className="bg-[#fcfbf7] border border-dashed border-[#e6e0d4] rounded-2xl p-4 text-sm md:text-base text-gray-800 leading-relaxed font-serif nepali max-h-[25vh] overflow-y-auto">
        {nepaliNarration.split(/\n+/).map((para, idx) => (
          <p key={idx} className="mb-2 last:mb-0">
            {para}
          </p>
        ))}
      </div>

      {/* Audio Actions */}
      <div className="flex gap-2">
        <button
          onClick={onPlay}
          className="flex-1 py-2.5 bg-[#0f766e]/10 hover:bg-[#0f766e]/20 text-[#0f766e] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          style={{ minHeight: "44px" }}
        >
          <Play size={14} />
          <span>Replay Audio</span>
        </button>

        {currentVersionObj?.audioBase64 && (
          <button
            onClick={onDownload}
            className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{ minHeight: "44px" }}
          >
            <Download size={14} />
            <span>Download MP3</span>
          </button>
        )}
      </div>
    </div>
  );
}
