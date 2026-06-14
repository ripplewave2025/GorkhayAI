import React from "react";
import { X, Play, Square, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LineByLineReaderProps {
  isReaderOpen: boolean;
  onClose: () => void;
  readerLines: string[];
  currentLineIndex: number;
  onPlayLine: (idx: number) => void;
  onPlayAll: () => void;
  onStop: () => void;
}

export default function LineByLineReader({
  isReaderOpen,
  onClose,
  readerLines,
  currentLineIndex,
  onPlayLine,
  onPlayAll,
  onStop,
}: LineByLineReaderProps) {
  return (
    <AnimatePresence>
      {isReaderOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[#fcfbf9]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex flex-col max-w-md mx-auto w-full"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-1.5">
                  <Volume2 size={20} className="text-[#0f766e]" />
                  <span>Line Reader</span>
                </h3>
                <p className="text-[10px] text-gray-500">Tap any line below to hear it read aloud</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                style={{ minHeight: "44px", minWidth: "44px" }}
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            {/* Read lines list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {readerLines.map((line, idx) => {
                const isCurrent = idx === currentLineIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => onPlayLine(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all border text-sm leading-relaxed ${
                      isCurrent
                        ? "bg-[#0f766e]/10 border-[#0f766e] text-[#0f766e] font-semibold scale-[1.01]"
                        : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                    }`}
                    style={{ minHeight: "56px" }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 mt-0.5 select-none">
                        {idx + 1}
                      </span>
                      <span className="flex-1 select-text">{line}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sticky Actions bar */}
            <div className="border-t border-gray-200 p-4 bg-white flex gap-3">
              <button
                onClick={onPlayAll}
                className="flex-1 py-3 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                style={{ minHeight: "48px" }}
              >
                <Play size={16} />
                <span>Play All Lines</span>
              </button>

              <button
                onClick={onStop}
                className="py-3 px-5 border border-red-200 hover:bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                style={{ minHeight: "48px" }}
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
