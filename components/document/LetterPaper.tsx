import React from "react";
import {
  Volume2,
  Play,
  Copy,
  Edit,
  Download,
  Share2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Document } from "@/lib/types";

interface LetterPaperProps {
  currentDoc: Document | null;
  letterParagraphs: string[];
  onParagraphClick: (para: string) => void;
  onOpenReader: () => void;
  onReadInNepali: (useSummary: boolean) => void;
  onCopyText: () => void;
  onEnterEditMode: () => void;
  onDownloadText: () => void;
  onDownloadPDF: () => void;
  onShareWhatsApp: () => void;
  isReady: boolean;
  missingSlots: string[];
  onResumeElicitation: () => void;
  isSynthesizing: boolean;
}

export default function LetterPaper({
  currentDoc,
  letterParagraphs,
  onParagraphClick,
  onOpenReader,
  onReadInNepali,
  onCopyText,
  onEnterEditMode,
  onDownloadText,
  onDownloadPDF,
  onShareWhatsApp,
  isReady,
  missingSlots,
  onResumeElicitation,
  isSynthesizing,
}: LetterPaperProps) {
  if (!currentDoc) return null;

  return (
    <div className="space-y-4">
      {/* Completeness & Ready Banner */}
      <div
        className={`p-3.5 rounded-2xl text-xs flex flex-col gap-2 transition-all ${
          isReady
            ? "bg-[#ecfdf5] border border-[#10b981] text-[#065f46]"
            : "bg-[#fffbeb] border border-[#f59e0b] text-[#92400e]"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {isReady ? (
            <>
              <CheckCircle size={18} className="text-[#10b981]" />
              <span>कागजात तयार छ! (Ready to Print)</span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} className="text-[#f59e0b] animate-bounce" />
              <span>केही कुरा थप्न बाँकी छ (Information Needed)</span>
            </>
          )}
        </div>
        <p className="leading-relaxed">
          {isReady
            ? "There are no placeholder brackets (like [Your Name]) left. You can now read, share, or download this document."
            : "There are missing details in this letter. Press the button below to answer them quickly with your voice."}
        </p>
        {!isReady && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold">Missing:</span>
            {missingSlots.map((s, idx) => (
              <span key={idx} className="bg-[#fef3c7] text-[#78350f] px-2 py-0.5 rounded-full border border-[#f59e0b]/30">
                {s}
              </span>
            ))}
            <button
              onClick={onResumeElicitation}
              className="ml-auto px-4 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl font-bold flex items-center gap-1 shadow-sm transition-colors text-[10px]"
              style={{ minHeight: "36px" }}
            >
              <Sparkles size={11} />
              <span>Fill Missing Details</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Letter Paper Card */}
      <div className="paper rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Envelope stamp effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#0f766e]/5 rounded-bl-full flex items-center justify-center pointer-events-none">
          <FileText size={28} className="text-[#0f766e]/20 rotate-12 -mt-4 -mr-4" />
        </div>

        {/* Letter Head metadata */}
        <div className="border-b border-dashed border-[#e6e0d4] pb-4 mb-6 flex justify-between items-baseline text-xs text-gray-500">
          <div>
            <span>Title: </span>
            <span className="font-bold text-gray-800">{currentDoc.title}</span>
          </div>
          <div>
            <span>Language: </span>
            <span className="font-bold uppercase text-gray-700">{currentDoc.language}</span>
          </div>
        </div>

        {/* Letter Body paragraphs (Click to select for refinement) */}
        <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#111] font-serif pr-2 select-text">
          {letterParagraphs.map((para, idx) => (
            <p
              key={idx}
              onClick={() => onParagraphClick(para)}
              className="cursor-pointer hover:bg-[#0f766e]/5 hover:text-[#0f766e] rounded-lg p-2 -m-2 transition-all duration-150 relative group"
              title="Click to change or improve this section with voice"
            >
              {para}
              <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-[10px] bg-[#0f766e]/10 px-1.5 py-0.5 rounded text-[#0f766e] font-sans font-semibold">
                ✏️ Edit Part
              </span>
            </p>
          ))}
        </div>
      </div>

      {/* Primary voice action controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={onOpenReader}
          className="py-3 bg-white border border-[#e6e0d4] hover:bg-[#faf9f6] text-gray-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          style={{ minHeight: "48px" }}
        >
          <Volume2 size={16} className="text-[#0f766e]" />
          <span>Read Line-by-Line</span>
        </button>

        <button
          onClick={() => onReadInNepali(false)}
          disabled={isSynthesizing}
          className="py-3 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:bg-gray-400"
          style={{ minHeight: "48px" }}
        >
          {isSynthesizing ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          ) : (
            <Play size={16} />
          )}
          <span>Read in Nepali (Full)</span>
        </button>

        <button
          onClick={() => onReadInNepali(true)}
          disabled={isSynthesizing}
          className="py-3 bg-[#0f766e]/10 hover:bg-[#0f766e]/20 text-[#0f766e] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          style={{ minHeight: "48px" }}
        >
          <Play size={16} />
          <span>Read in Nepali (Summary)</span>
        </button>
      </div>

      {/* Export & Action Controls grid */}
      <div className="bg-white border border-[#e6e0d4] rounded-3xl p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
        <button
          onClick={onCopyText}
          className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-2xl transition-colors"
          style={{ minHeight: "60px" }}
        >
          <Copy size={18} className="text-[#0f766e] mb-1" />
          <span className="text-[10px] text-gray-600 font-medium">Copy</span>
        </button>

        <button
          onClick={onEnterEditMode}
          className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-2xl transition-colors"
          style={{ minHeight: "60px" }}
        >
          <Edit size={18} className="text-[#0f766e] mb-1" />
          <span className="text-[10px] text-gray-600 font-medium">Edit</span>
        </button>

        <button
          onClick={onDownloadText}
          className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-2xl transition-colors"
          style={{ minHeight: "60px" }}
        >
          <Download size={18} className="text-[#0f766e] mb-1" />
          <span className="text-[10px] text-gray-600 font-medium">Download TXT</span>
        </button>

        <button
          onClick={onDownloadPDF}
          className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-2xl transition-colors"
          style={{ minHeight: "60px" }}
        >
          <Download size={18} className="text-[#0f766e] mb-1" />
          <span className="text-[10px] text-gray-600 font-medium">PDF Print</span>
        </button>

        <button
          onClick={onShareWhatsApp}
          className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-2xl transition-colors"
          style={{ minHeight: "60px" }}
        >
          <Share2 size={18} className="text-[#0f766e] mb-1" />
          <span className="text-[10px] text-gray-600 font-medium">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
