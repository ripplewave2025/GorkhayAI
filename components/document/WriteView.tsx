import React from "react";
import { Mic, MicOff, RefreshCw, FileText, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { Document, DocLanguage } from "@/lib/types";
import { VoiceLang } from "@/lib/voice";
import LetterPaper from "./LetterPaper";
import NarrationPanel from "./NarrationPanel";

interface RefineContext {
  paragraph?: string;
}

interface WriteViewProps {
  currentDoc: Document | null;
  isGenerating: boolean;
  isRefining: boolean;
  outputLang: DocLanguage;
  setOutputLang: (lang: DocLanguage) => void;
  voiceInputLang: VoiceLang;
  setVoiceInputLang: (lang: VoiceLang) => void;
  transcript: string;
  setTranscript: (val: string) => void;
  isListening: boolean;
  isRecording: boolean;
  startListening: () => void;
  stopListening: () => void;
  startServerSTT: () => void;
  stopServerSTT: () => void;
  useTranscriptForGeneration: () => void;
  selectedGP: any;
  setSelectedGP: (gp: any) => void;
  selectedOffice: any;
  setSelectedOffice: (office: any) => void;
  setShowTemplates: (show: boolean) => void;
  onQuickRequest?: (templateLabel: string) => void;
  
  // Document actions
  letterParagraphs: string[];
  onParagraphClick: (para: string) => void;
  onOpenReader: () => void;
  onReadInNepali: (useSummary: boolean) => void;
  onCopyText: () => void;
  
  // Manual edit
  isEditingManually: boolean;
  manualDraft: string;
  setManualDraft: (val: string) => void;
  enterManualEdit: () => void;
  cancelManualEdit: () => void;
  saveManualEdit: () => void;
  
  // Refine
  refineInstruction: string;
  setRefineInstruction: (val: string) => void;
  refineContext: RefineContext;
  setRefineContext: (ctx: RefineContext) => void;
  refineDocument: (instr?: string) => void;
  startVoiceRefine: () => void;

  // Export
  onDownloadText: () => void;
  onDownloadPDF: () => void;
  onShareWhatsApp: () => void;

  // Completeness check
  isReady: boolean;
  missingSlots: string[];
  onResumeElicitation: () => void;

  // Audio state
  nepaliNarration: string;
  narrationHistory: any[];
  currentNarrationIndex: number;
  playCurrentNarrationVersion: () => void;
  goToPreviousNarrationVersion: () => void;
  goToNextNarrationVersion: () => void;
  downloadCurrentNarration: () => void;
  isSynthesizing: boolean;
}

export default function WriteView({
  currentDoc,
  isGenerating,
  isRefining,
  outputLang,
  setOutputLang,
  voiceInputLang,
  setVoiceInputLang,
  transcript,
  setTranscript,
  isListening,
  isRecording,
  startListening,
  stopListening,
  startServerSTT,
  stopServerSTT,
  useTranscriptForGeneration,
  selectedGP,
  setSelectedGP,
  selectedOffice,
  setSelectedOffice,
  setShowTemplates,
  onQuickRequest,
  letterParagraphs,
  onParagraphClick,
  onOpenReader,
  onReadInNepali,
  onCopyText,
  isEditingManually,
  manualDraft,
  setManualDraft,
  enterManualEdit,
  cancelManualEdit,
  saveManualEdit,
  refineInstruction,
  setRefineInstruction,
  refineContext,
  setRefineContext,
  refineDocument,
  startVoiceRefine,
  onDownloadText,
  onDownloadPDF,
  onShareWhatsApp,
  isReady,
  missingSlots,
  onResumeElicitation,
  nepaliNarration,
  narrationHistory,
  currentNarrationIndex,
  playCurrentNarrationVersion,
  goToPreviousNarrationVersion,
  goToNextNarrationVersion,
  downloadCurrentNarration,
  isSynthesizing,
}: WriteViewProps) {

  // Quick Start helpers
  const handleQuickRequest = (type: string) => {
    if (onQuickRequest) {
      onQuickRequest(type);
    } else {
      setTranscript(type);
    }
  };

  return (
    <div className="pt-4 max-w-md mx-auto w-full">
      {/* GP Address Selection Banner */}
      {selectedGP && !currentDoc && (
        <div className="mb-4 p-3.5 bg-[#ecfdf5] border border-[#10b981]/50 rounded-2xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#10b981] text-base">📍</span>
            <div>
              <div className="font-bold text-gray-800">Addressing GP:</div>
              <div className="text-gray-600 font-medium">
                {selectedGP.official_gp_name} GP, {selectedGP.block} Block
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedGP(null)}
            className="text-[10px] bg-white border border-[#10b981]/30 text-red-500 font-bold px-2.5 py-1 rounded-xl hover:bg-red-50 transition-colors"
            style={{ minHeight: "32px" }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Office Address Selection Banner */}
      {selectedOffice && !currentDoc && (
        <div className="mb-4 p-3.5 bg-[#eff6ff] border border-[#3b82f6]/50 rounded-2xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#3b82f6] text-base">🏢</span>
            <div>
              <div className="font-bold text-gray-800">Addressing Office:</div>
              <div className="text-gray-600 font-medium">
                {selectedOffice.name || selectedOffice.block_name}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedOffice(null)}
            className="text-[10px] bg-white border border-[#3b82f6]/30 text-red-500 font-bold px-2.5 py-1 rounded-xl hover:bg-red-50 transition-colors"
            style={{ minHeight: "32px" }}
          >
            Clear
          </button>
        </div>
      )}

      {/* RENDER PHASE 1: Compose Letter UI (Mic & Setup) */}
      {!currentDoc && !isGenerating && (
        <div className="space-y-6">
          {/* Header titles */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 leading-none">
              बोल्नुहोस्।
              <br />
              <span className="text-[#0f766e]">हामी लेख्छौं।</span>
            </h1>
            <p className="text-xs text-gray-500">Speak in Nepali. We will generate the formal letter.</p>
          </div>

          {/* Language Selector Toggles */}
          <div className="bg-[#f2efe9] p-1.5 rounded-2xl flex gap-1.5 text-xs">
            <button
              onClick={() => setOutputLang("en")}
              className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
                outputLang === "en" ? "bg-[#0f766e] text-white shadow" : "text-gray-600 hover:bg-white/50"
              }`}
              style={{ minHeight: "36px" }}
            >
              English Letter
            </button>
            <button
              onClick={() => setOutputLang("ne")}
              className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
                outputLang === "ne" ? "bg-[#0f766e] text-white shadow" : "text-gray-600 hover:bg-white/50"
              }`}
              style={{ minHeight: "36px" }}
            >
              Nepali Letter
            </button>
          </div>

          {/* Giant Mic Button */}
          <div className="flex flex-col items-center gap-2.5 py-2">
            <button
              onMouseDown={startServerSTT}
              onMouseUp={stopServerSTT}
              onTouchStart={startServerSTT}
              onTouchEnd={stopServerSTT}
              className={`w-32 h-32 rounded-full flex items-center justify-center text-white transition-all transform shadow-2xl active:scale-95 border-4 border-white ${
                isRecording 
                  ? "bg-rose-500 animate-pulse ring-4 ring-rose-200" 
                  : isListening 
                    ? "bg-amber-500 ring-4 ring-amber-200" 
                    : "bg-[#b91c1c] hover:bg-[#a11818]"
              }`}
              style={{ minHeight: "128px", minWidth: "128px" }}
              aria-label={isRecording ? "Stop recording" : "Start speaking"}
            >
              {isRecording || isListening ? (
                <MicOff size={56} className="animate-bounce" />
              ) : (
                <Mic size={56} />
              )}
            </button>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {isRecording ? "Listening... Release when done" : "Hold button & speak in Nepali"}
            </span>
            <span className="text-[10px] text-gray-400 nepali text-center px-4 leading-relaxed">
              Example: “मलाई बसोबास प्रमाणपत्रको लागि सिफारिस पत्र चाहिन्छ”
            </span>
          </div>

          {/* Real-time transcription feedback */}
          <div className="bg-white border border-[#e6e0d4] rounded-3xl p-4 shadow-sm min-h-[80px] flex flex-col justify-between">
            {transcript ? (
              <div>
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block mb-1">
                  Heard / Transcribed:
                </span>
                <p className="text-gray-800 text-sm leading-relaxed font-serif italic">"{transcript}"</p>
              </div>
            ) : (
              <p className="text-gray-400 text-xs italic text-center my-auto">
                Your spoken words will appear here...
              </p>
            )}

            {/* Transcription Controls */}
            {transcript && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setTranscript("")}
                  className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold rounded-xl text-xs flex items-center gap-1"
                  style={{ minHeight: "36px" }}
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
                <button
                  onClick={useTranscriptForGeneration}
                  className="flex-1 py-1.5 bg-[#0f766e] hover:bg-[#0d645d] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  style={{ minHeight: "36px" }}
                >
                  <FileText size={14} />
                  <span>Create Letter / पत्र बनाउनुहोस्</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Common Request Cards */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 mb-2">
                Quick requests (सजिलो छनौट)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { title: "Caste Certificate", neTitle: "जात प्रमाणपत्र", type: "Caste Certificate" },
                  { title: "Income Certificate", neTitle: "आय प्रमाणपत्र", type: "Income Certificate" },
                  { title: "Residential Cert.", neTitle: "बसोबास पत्र", type: "Residential Certificate" },
                  { title: "FIR to Police", neTitle: "FIR निवेदन", type: "FIR Request" },
                ].map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickRequest(card.type)}
                    className="border border-[#e6e0d4] rounded-2xl p-3 bg-white hover:bg-gray-50 text-left active:scale-[0.98] transition-all shadow-sm flex flex-col justify-between"
                    style={{ minHeight: "64px" }}
                  >
                    <span className="font-bold text-gray-800 text-xs leading-none">{card.title}</span>
                    <span className="text-[10px] text-gray-500 nepali leading-none mt-1">{card.neTitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Showcase Cards / Examples */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                Popular Applications with Pre-filled Previews (नमुना पत्रहरू)
              </div>
              <div className="space-y-4">
                {SHOWCASE_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-[#e6e0d4] rounded-3xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top row: Title and stars */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-xs sm:text-sm">{item.title}</h3>
                        <p className="text-[10px] text-gray-400 nepali mt-0.5">{item.neTitle}</p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="flex text-amber-500 text-xs">
                          {"★".repeat(item.stars)}
                        </div>
                        <span className="text-[9px] font-bold text-[#0f766e] bg-[#0f766e]/10 px-1.5 py-0.5 rounded-md mt-1 font-sans">
                          {item.priority}
                        </span>
                      </div>
                    </div>

                    {/* Use-cases / Tags */}
                    <div className="flex flex-wrap gap-1 my-2">
                      {item.useCases.map((uc, uIdx) => (
                        <span
                          key={uIdx}
                          className="bg-[#0f766e]/5 text-[#0f766e] text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        >
                          {uc}
                        </span>
                      ))}
                    </div>

                    {/* Fading Preview Box */}
                    <div className="bg-[#fcfbf9] border border-gray-100 rounded-xl p-3 text-[10px] leading-relaxed text-gray-500 font-serif italic relative max-h-[88px] overflow-hidden mb-3 select-none">
                      <pre className="whitespace-pre-wrap font-serif font-medium">{item.previewText}</pre>
                      {/* Gradient fade overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#fcfbf9] to-transparent pointer-events-none" />
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleQuickRequest(item.templateKey)}
                      className="w-full py-2 bg-[#0f766e] hover:bg-[#0d645d] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                      style={{ minHeight: "36px" }}
                    >
                      <span>✍️ Start Writing Letter</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Template picker trigger */}
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full text-center text-xs text-[#0f766e] font-semibold underline underline-offset-4 pt-1"
            >
              Or browse all 120+ kinds of letters &rarr;
            </button>
          </div>
        </div>
      )}

      {/* RENDER PHASE 2: Generating State */}
      {isGenerating && (
        <div className="py-20 text-center space-y-4 flex flex-col items-center justify-center bg-white border border-[#e6e0d4] rounded-3xl p-6">
          <div className="w-14 h-14 rounded-full bg-[#0f766e]/10 flex items-center justify-center text-[#0f766e] animate-spin">
            <RefreshCw size={28} />
          </div>
          <h3 className="font-bold text-lg text-gray-800">Creating your document...</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
            हम्रो AI ले तपाईंको विवरण मिलाएर औपचारिक चिठ्ठी लेख्दैछ। कृपया केही सेकेन्ड पर्खनुहोस्।
          </p>
        </div>
      )}

      {/* RENDER PHASE 3: Generated Document Workspace */}
      {currentDoc && !isGenerating && (
        <div className="space-y-6">
          {/* Main workspace header */}
          <div className="flex justify-between items-center bg-[#fdfcf9] border border-[#e6e0d4] rounded-2xl p-3">
            <div className="text-xs font-semibold text-gray-600">Document Workspace</div>
            <button
              onClick={onResumeElicitation}
              className="text-[10px] bg-[#0f766e]/10 text-[#0f766e] font-bold px-3 py-1 rounded-xl hover:bg-[#0f766e]/20 transition-colors"
              style={{ minHeight: "32px" }}
            >
              Document Details
            </button>
          </div>

          {/* Letter manual editing textarea */}
          {isEditingManually ? (
            <div className="space-y-3 bg-white border border-[#e6e0d4] rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="font-bold">Manual Editor Mode</span>
                <button onClick={cancelManualEdit} className="underline hover:text-red-500">
                  Cancel
                </button>
              </div>
              <textarea
                value={manualDraft}
                onChange={(e) => setManualDraft(e.target.value)}
                className="w-full h-[320px] font-mono text-sm p-4 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                spellCheck={false}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveManualEdit}
                  className="flex-1 py-2.5 bg-[#0f766e] text-white rounded-xl text-xs font-bold transition-all shadow active:scale-[0.98]"
                  style={{ minHeight: "44px" }}
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelManualEdit}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
                  style={{ minHeight: "44px" }}
                >
                  Discard
                </button>
              </div>
            </div>
          ) : (
            /* Standard View Workspace */
            <div className="space-y-6">
              {/* The Printed Paper */}
              <LetterPaper
                currentDoc={currentDoc}
                letterParagraphs={letterParagraphs}
                onParagraphClick={onParagraphClick}
                onOpenReader={onOpenReader}
                onReadInNepali={onReadInNepali}
                onCopyText={onCopyText}
                onEnterEditMode={enterManualEdit}
                onDownloadText={onDownloadText}
                onDownloadPDF={onDownloadPDF}
                onShareWhatsApp={onShareWhatsApp}
                isReady={isReady}
                missingSlots={missingSlots}
                onResumeElicitation={onResumeElicitation}
                isSynthesizing={isSynthesizing}
              />

              {/* Nepali Translation Audio Panel */}
              <NarrationPanel
                nepaliNarration={nepaliNarration}
                narrationHistory={narrationHistory}
                currentNarrationIndex={currentNarrationIndex}
                onPlay={playCurrentNarrationVersion}
                onPrev={goToPreviousNarrationVersion}
                onNext={goToNextNarrationVersion}
                onDownload={downloadCurrentNarration}
              />

              {/* Document Refinement Controls */}
              <div id="refine-section" className="bg-[#fdfcf9] border border-[#e6e0d4] rounded-3xl p-5 shadow-sm space-y-3.5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {refineContext.paragraph ? "Refining Selected Section" : "Refining Entire Letter"}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startVoiceRefine}
                    disabled={isRefining || isListening}
                    className="flex-1 py-2.5 bg-white border border-[#e6e0d4] hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    style={{ minHeight: "44px" }}
                  >
                    <Mic size={15} className="text-[#0f766e]" />
                    <span>{isListening ? "Listening..." : "Refine by Voice"}</span>
                  </button>

                  <button
                    onClick={() => refineDocument()}
                    disabled={isRefining || !refineInstruction.trim()}
                    className="flex-1 py-2.5 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-50"
                    style={{ minHeight: "44px" }}
                  >
                    {isRefining ? "Refining..." : "Apply Edit"}
                  </button>
                </div>

                {/* Input box */}
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && refineInstruction.trim()) {
                        refineDocument();
                      }
                    }}
                    placeholder={
                      refineContext.paragraph
                        ? "Say or type how to change the selected paragraph..."
                        : "Example: make it more formal, change date to today..."
                    }
                    className="w-full bg-white border border-[#e6e0d4] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e] transition-all"
                    style={{ minHeight: "44px" }}
                  />
                  {refineContext.paragraph && (
                    <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
                      <span>Focused: "{refineContext.paragraph.substring(0, 30)}..."</span>
                      <button onClick={() => setRefineContext({})} className="underline hover:text-red-500 font-bold">
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SHOWCASE_ITEMS = [
  {
    title: "Residential Certificate Recommendation",
    neTitle: "बसोबास सिफारिस पत्र",
    priority: "Extremely High",
    stars: 5,
    useCases: ["Job", "Bank Loan", "Scheme", "Aadhaar", "Voter Card"],
    templateKey: "Residential Certificate",
    previewText: `To,
The Pradhan,
Darjeeling Gram Panchayat.

Subject: Request for Residential Certificate Recommendation

Respected Sir/Madam,
I, Rohan Pradhan, son of Mr. Karma Pradhan, permanent resident of Toongsong Busty, Darjeeling, have resided here for 15 years. I request a Residential Certificate to support my Aadhaar and job applications.`
  },
  {
    title: "Income Certificate Recommendation",
    neTitle: "आय प्रमाण पत्र सिफारिस",
    priority: "Extremely High",
    stars: 5,
    useCases: ["Scholarship", "Scheme", "Loan", "Ration Card"],
    templateKey: "Income Certificate",
    previewText: `To,
The Pradhan,
Darjeeling Gram Panchayat.

Subject: Application for Income Certificate Recommendation

Respected Sir/Madam,
I, Dawa Sherpa, resident of Ghoom, Darjeeling, declare that my family's total monthly income from agriculture is approximately Rs. 12,000. I require an Income Certificate for my daughter's post-matric scholarship.`
  },
  {
    title: "Caste Certificate Recommendation",
    neTitle: "जात प्रमाण पत्र सिफारिस",
    priority: "Very High",
    stars: 5,
    useCases: ["Job Reservation", "Scholarship", "Government Scheme"],
    templateKey: "Caste Certificate",
    previewText: `To,
The Pradhan,
Darjeeling Gram Panchayat.

Subject: Recommendation for Caste Certificate

Respected Sir/Madam,
I, Preeti Tamang, daughter of Mr. Bir Bahadur Tamang, resident of Takdah, belong to the Tamang community (Scheduled Tribe). I kindly request a recommendation letter for scholarship benefits.`
  },
  {
    title: "FIR / GD Entry Request",
    neTitle: "प्रहरी चौकीमा निवेदन (FIR/GD)",
    priority: "Very High",
    stars: 5,
    useCases: ["Theft", "Lost Documents", "Assault", "Harassment"],
    templateKey: "FIR Request",
    previewText: `To,
The Officer-in-Charge,
Darjeeling Sadar Police Station.

Subject: Request to register GD for lost phone and documents

Respected Sir,
I wish to report the loss of my Samsung Galaxy mobile phone and original Voter ID card near Darjeeling Mall Road on 10th June 2026. Please register a General Diary (GD) entry.`
  },
  {
    title: "Road / Drainage / Water Complaint",
    neTitle: "बाटो, नाली वा खानेपानी गुनासो पत्र",
    priority: "Very High",
    stars: 4,
    useCases: ["Road Damage", "Drainage Blockage", "Water Supply Issues"],
    templateKey: "BDO Complaint / Application",
    previewText: `To,
The Block Development Officer,
Darjeeling Block.

Subject: Complaint regarding damaged village road and water blockage

Respected Sir,
We, the residents of Mirik Ward 4, bring to your attention the severely broken local road and overflowing drainage pipe near the public well. We appeal for immediate repairs.`
  },
  {
    title: "Invoice / Bill",
    neTitle: "बिल वा इनभ्वाइस (होमस्टे / पसल)",
    priority: "High",
    stars: 4,
    useCases: ["Homestay Owners", "Shopkeepers", "Small Businesses"],
    templateKey: "Invoice / Bill",
    previewText: `INVOICE / BILL
Pineview Homestay
Takdah, Darjeeling

Billed To: Mr. Amit Roy, Kolkata
Services: 3 Nights Lodging + Organic Meals
Total Amount Due: Rs. 8,500
Thank you for staying with us!`
  },
  {
    title: "Land Mutation Application",
    neTitle: "जग्गा नामसारी निवेदन (Mutation)",
    priority: "High",
    stars: 4,
    useCases: ["Inheritance", "Property Issues", "Purchase of Land"],
    templateKey: "Land Mutation Request",
    previewText: `To,
The Block Development Officer / BL&LRO,
Darjeeling Block.

Subject: Application for Land Mutation / Namasari

Respected Sir,
I, Lalit Subba, request the mutation of Plot No. 245, Khatian No. 102, which is registered in the name of my late father. I have attached the legal heir certificate.`
  }
];
