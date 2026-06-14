import React, { useEffect } from "react";
import { Mic, MicOff, Volume2, ArrowLeft, Check, X, HelpCircle, Sparkles } from "lucide-react";
import { SlotDef } from "@/lib/documentRegistry";

interface ElicitationFlowProps {
  isEliciting: boolean;
  slots: Record<string, string>;
  currentSlotIndex: number;
  currentSlot: SlotDef | null;
  isConfirmingAll: boolean;
  onAnswer: (val: string) => void;
  onGoBack: () => void;
  onSpeakQuestion: () => void;
  onSpeakConfirmAll: () => void;
  onConfirmAll: () => void;
  onCancel: () => void;
  
  // Elicitation progress info
  activeSlotCount: number;
  totalUserSlots: number;
  
  // Voice states from useVoice
  isListening: boolean;
  isRecording: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  startServerSTT: () => void;
  stopServerSTT: () => void;
  voiceInputLang: string;
  setVoiceInputLang: (lang: any) => void;
}

export default function ElicitationFlow({
  isEliciting,
  slots,
  currentSlotIndex,
  currentSlot,
  isConfirmingAll,
  onAnswer,
  onGoBack,
  onSpeakQuestion,
  onSpeakConfirmAll,
  onConfirmAll,
  onCancel,
  activeSlotCount,
  totalUserSlots,
  isListening,
  isRecording,
  transcript,
  startListening,
  stopListening,
  startServerSTT,
  stopServerSTT,
  voiceInputLang,
  setVoiceInputLang,
}: ElicitationFlowProps) {
  if (!isEliciting) return null;

  // Auto-fill field values from transcript when voice recognition ends/stops
  useEffect(() => {
    if (!isListening && !isRecording && transcript.trim() && currentSlot && !isConfirmingAll) {
      // Auto save the spoken value
      const val = transcript.trim();
      onAnswer(val);
    }
  }, [isListening, isRecording, transcript, currentSlot, isConfirmingAll, onAnswer]);

  // Use actual slot count for progress indicator
  const progressDots = Math.max(totalUserSlots, 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfbf9] flex flex-col p-4 max-w-md mx-auto w-full">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
        <button
          onClick={onGoBack}
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          style={{ minHeight: "44px", minWidth: "44px" }}
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="font-bold text-gray-700 text-sm tracking-tight flex items-center gap-1.5">
          <Sparkles size={16} className="text-[#0f766e] animate-pulse" />
          <span>विवरण भर्दै (Filling details...)</span>
        </div>
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors text-red-500"
          style={{ minHeight: "44px", minWidth: "44px" }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Elicitation Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 space-y-6">
        
        {/* Scenario 1: Ask Single Slot Question */}
        {!isConfirmingAll && currentSlot && (
          <div className="w-full text-center space-y-6 flex-1 flex flex-col justify-center">
            
            {/* Field English Helper Label */}
            <div className="text-[10px] text-[#0f766e] font-bold uppercase tracking-widest bg-[#0f766e]/5 py-1 px-3 rounded-full mx-auto w-fit">
              {currentSlot.label}
            </div>

            {/* Nepali Question Text */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight leading-snug nepali px-2">
              {currentSlot.key === "purpose" 
                ? "K ko lagi application/memo lekhnuhudaicha?" 
                : currentSlot.label_ne}
            </h2>

            {/* Listen Button & TTS Speak again */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onSpeakQuestion}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                style={{ minHeight: "36px", minWidth: "36px" }}
                title="फेरि सुन्नुहोस्"
              >
                <Volume2 size={16} className="text-[#0f766e]" />
              </button>
              <span className="text-[10px] text-gray-400 font-medium">Listen to question</span>
            </div>

            {/* Select Options display (if slot has options) */}
            {currentSlot.type === "select" && currentSlot.options && (
              <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto p-1 bg-[#fbf9f5] border border-dashed rounded-2xl">
                {currentSlot.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAnswer(opt)}
                    className="w-full py-3 px-4 bg-white border border-[#e6e0d4] hover:bg-[#0f766e]/10 hover:border-[#0f766e] rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98]"
                    style={{ minHeight: "48px" }}
                  >
                    <span>{opt}</span>
                    <span className="text-[10px] text-gray-400 font-normal">Tap to choose</span>
                  </button>
                ))}
              </div>
            )}

            {/* Voice Input Section (Microphone) */}
            {currentSlot.type !== "select" && (
              <div className="flex flex-col items-center space-y-4">
                
                {/* Giant Red Mic button */}
                <button
                  onMouseDown={startServerSTT}
                  onMouseUp={stopServerSTT}
                  onTouchStart={startServerSTT}
                  onTouchEnd={stopServerSTT}
                  className={`w-28 h-28 rounded-full flex items-center justify-center text-white transition-all transform shadow-lg active:scale-95 ${
                    isRecording 
                      ? "bg-rose-500 animate-pulse ring-4 ring-rose-200" 
                      : isListening 
                        ? "bg-amber-500 ring-4 ring-amber-200" 
                        : "bg-[#b91c1c] hover:bg-[#a11818]"
                  }`}
                  style={{ minHeight: "112px", minWidth: "112px" }}
                >
                  {isRecording || isListening ? (
                    <MicOff size={44} className="animate-bounce" />
                  ) : (
                    <Mic size={44} />
                  )}
                </button>
                
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  {isRecording ? "Listening... Release when done" : "Hold button & speak in Nepali"}
                </p>

                {/* Show temporary text transcript */}
                {transcript && (
                  <div className="w-full max-w-xs mx-auto bg-gray-50 border rounded-2xl p-3 text-xs italic text-gray-600 font-serif leading-relaxed">
                    "{transcript}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scenario 2: Confirm All collected details */}
        {isConfirmingAll && (
          <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#ecfdf5] flex items-center justify-center mx-auto text-[#10b981]">
                <Check size={28} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 nepali">विवरण ठीक छ?</h2>
              <p className="text-xs text-gray-500">Confirm all gathered details before we generate the letter</p>
            </div>

            {/* TTS Speak confirmation */}
            <button
              onClick={onSpeakConfirmAll}
              className="mx-auto px-4 py-2 border border-[#0f766e]/30 bg-[#0f766e]/5 hover:bg-[#0f766e]/10 text-[#0f766e] rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={{ minHeight: "36px" }}
            >
              <Volume2 size={14} />
              <span>Read Confirmation Summary</span>
            </button>

            {/* Details List */}
            <div className="bg-[#fdfcf9] border border-[#e6e0d4] rounded-3xl p-4 space-y-2 max-h-[35vh] overflow-y-auto text-xs leading-relaxed">
              {Object.entries(slots).map(([k, v]) => {
                // Check if this slot was auto-filled from profile
                const isAutoFilled = activeSlotCount > 0 && totalUserSlots < activeSlotCount;
                return (
                  <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">{k}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800 bg-white border border-gray-100 px-2 py-0.5 rounded-lg max-w-[180px] truncate">
                        {v}
                      </span>
                    </div>
                  </div>
                );
              })}
              {totalUserSlots < activeSlotCount && (
                <div className="text-[9px] text-[#0f766e] font-semibold flex items-center gap-1 pt-1">
                  ✓ {activeSlotCount - totalUserSlots} fields auto-filled from your profile
                </div>
              )}
            </div>

            {/* Direct Generate triggers */}
            <div className="flex gap-3">
              <button
                onClick={onGoBack}
                className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold transition-colors"
                style={{ minHeight: "48px" }}
              >
                Go Back / सम्पादन गर्नुहोस्
              </button>
              <button
                onClick={onConfirmAll}
                className="flex-1 py-3 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                style={{ minHeight: "48px" }}
              >
                <Check size={16} />
                <span>Confirm / पत्र बनाउनुहोस्</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar / indicator dots */}
      {!isConfirmingAll && (
        <div className="flex justify-center items-center gap-1 py-4 border-t border-gray-100">
          {Array.from({ length: progressDots }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === (totalUserSlots > 0 ? Math.max(0, totalUserSlots - (activeSlotCount - currentSlotIndex - (activeSlotCount - totalUserSlots))) : currentSlotIndex)
                  ? "w-6 bg-[#0f766e]" 
                  : idx < currentSlotIndex ? "w-2 bg-[#0f766e]/40" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
