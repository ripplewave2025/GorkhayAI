import React, { useState } from "react";
import { Search, MapPin, Copy, PenTool, Sparkles } from "lucide-react";

interface GramPanchayatViewProps {
  gpSearchTerm: string;
  setGpSearchTerm: (val: string) => void;
  gpSelectedBlock: string;
  setGpSelectedBlock: (val: string) => void;
  gpBlocks: string[];
  filteredGPs: any[];
  selectGP: (gp: any) => void;
  copyGPSalutation: (gp: any) => void;
  onWriteLetterForGP: (gp: any, templateLabel: string) => void;
  onVoiceWriteForGP: (gp: any) => void;
}

export default function GramPanchayatView({
  gpSearchTerm,
  setGpSearchTerm,
  gpSelectedBlock,
  setGpSelectedBlock,
  gpBlocks,
  filteredGPs,
  selectGP,
  copyGPSalutation,
  onWriteLetterForGP,
  onVoiceWriteForGP,
}: GramPanchayatViewProps) {
  const [expandedGpId, setExpandedGpId] = useState<number | null>(null);
  return (
    <div className="pt-4 pb-8 max-w-md mx-auto">
      {/* Header section */}
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-800">Gram Panchayats (92)</h2>
        <p className="text-xs text-gray-500 mt-1">
          Select your GP to pre-fill the correct official address and contacts in your letters.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={gpSearchTerm}
          onChange={(e) => setGpSearchTerm(e.target.value)}
          placeholder="Search GP name, place or block..."
          className="block w-full pl-10 pr-3 py-2.5 border border-[#e6e0d4] rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
          style={{ minHeight: "48px" }}
        />
      </div>

      {/* Filter and Clear Buttons */}
      <div className="flex gap-2 mb-4">
        <select
          value={gpSelectedBlock}
          onChange={(e) => setGpSelectedBlock(e.target.value)}
          className="flex-1 bg-white border border-[#e6e0d4] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
          style={{ minHeight: "48px" }}
        >
          <option value="">All Blocks ({gpBlocks.length})</option>
          {gpBlocks.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {(gpSearchTerm || gpSelectedBlock) && (
          <button
            onClick={() => {
              setGpSearchTerm("");
              setGpSelectedBlock("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-2xl text-xs hover:bg-gray-100 transition-colors"
            style={{ minHeight: "48px" }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="text-[10px] text-gray-500 font-semibold mb-2 px-1">
        SHOWING {filteredGPs.length} OF 92 GRAM PANCHAYATS
      </div>

      {/* GP Cards list */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {filteredGPs.map((gp: any) => {
          const hasPradhan = gp.pradhan?.name && !gp.pradhan.name.toLowerCase().includes("tbd");
          const hasEA = gp.executive_assistant?.name && !gp.executive_assistant.name.toLowerCase().includes("tbd");
          
          return (
            <div
              key={gp.sl_no}
              className="border border-[#e6e0d4] rounded-3xl p-4 bg-white text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <div className="mt-1 text-[#0f766e]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 leading-tight">{gp.official_gp_name} GP</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {gp.place_name !== gp.official_gp_name ? gp.place_name + " • " : ""}
                      {gp.block} Block • {gp.local_body_code}
                    </div>
                  </div>
                </div>
              </div>

              {/* Salutation Display Box */}
              <div className="bg-[#fcfbf9] border border-dashed border-[#e6e0d4] rounded-xl p-2.5 my-2.5 text-xs text-gray-600 leading-relaxed font-mono">
                <div className="text-[9px] text-[#0f766e] uppercase tracking-wider font-sans font-semibold mb-1">
                  Letter Recipient Header
                </div>
                The Pradhan,
                <br />
                {gp.official_gp_name} Gram Panchayat,
                <br />
                {gp.block} Block, Darjeeling District, West Bengal
              </div>

              {/* Officials Contact */}
              {(hasPradhan || hasEA) && (
                <div className="mt-2 py-1.5 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  {hasPradhan && (
                    <div>
                      👤 <strong>Pradhan:</strong> {gp.pradhan.name}
                      {gp.pradhan.phone && !gp.pradhan.phone.toLowerCase().includes("tbd") && (
                        <span className="text-[#0f766e] font-semibold"> ({gp.pradhan.phone})</span>
                      )}
                    </div>
                  )}
                  {hasEA && (
                    <div>
                      👤 <strong>Secretary / EA:</strong> {gp.executive_assistant.name}
                      {gp.executive_assistant.phone && !gp.executive_assistant.phone.toLowerCase().includes("tbd") && (
                        <span className="text-[#0f766e] font-semibold"> ({gp.executive_assistant.phone})</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Card Actions with big touch targets */}
              <div className="mt-3 space-y-2 pt-2 border-t border-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedGpId(expandedGpId === gp.sl_no ? null : gp.sl_no)}
                    className={`flex-1 py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                      expandedGpId === gp.sl_no
                        ? "bg-[#0f766e]/10 border-[#0f766e] text-[#0f766e]"
                        : "border-gray-300 hover:bg-gray-50 text-gray-700 bg-white"
                    }`}
                    style={{ minHeight: "44px" }}
                  >
                    <span>What is it for?</span>
                    <span className="text-[10px]">{expandedGpId === gp.sl_no ? "▲" : "▼"}</span>
                  </button>
                  <button
                    onClick={() => selectGP(gp)}
                    className="flex-1 py-2.5 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                    style={{ minHeight: "44px" }}
                  >
                    <PenTool size={13} />
                    <span>Select & Write</span>
                  </button>
                </div>

                {expandedGpId === gp.sl_no && (
                  <div className="bg-[#fdfcf9] border border-[#e6e0d4] rounded-2xl p-2.5 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold px-1 uppercase tracking-wider">
                      <span>Select Letter Type:</span>
                      <button 
                        onClick={() => copyGPSalutation(gp)} 
                        className="text-[#0f766e] hover:underline flex items-center gap-0.5"
                      >
                        <Copy size={10} /> Copy Address Only
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { label: "Caste Certificate", display: "📜 Caste Certificate (जात सिफारिस)" },
                        { label: "Income Certificate", display: "📜 Income Certificate (आय सिफारिस)" },
                        { label: "Residential Certificate", display: "📜 Residential Certificate (बसोबास सिफारिस)" },
                        { label: "Land Mutation Request", display: "📜 Land Mutation (जग्गा नामसारी)" },
                        { label: "BDO Complaint / Application", display: "📜 BDO/GP Complaint (गुनासो पत्र)" }
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => onWriteLetterForGP(gp, opt.label)}
                          className="w-full text-left py-2 px-3 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-xl text-xs text-gray-700 font-medium transition-all flex items-center justify-between"
                          style={{ minHeight: "36px" }}
                        >
                          <span>{opt.display}</span>
                          <span className="text-[9px] text-gray-400 font-sans">Guided</span>
                        </button>
                      ))}
                      <button
                        onClick={() => onVoiceWriteForGP(gp)}
                        className="w-full text-left py-2.5 px-3 bg-[#0f766e]/5 hover:bg-[#0f766e]/10 border border-[#0f766e]/15 rounded-xl text-xs text-[#0f766e] font-semibold flex items-center justify-between transition-colors mt-1"
                        style={{ minHeight: "38px" }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🎤</span> Other (Speak what you need)
                        </span>
                        <span className="text-[9px] bg-[#0f766e] text-white px-2 py-0.5 rounded-md font-sans">Voice Mode</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredGPs.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-500 bg-white border border-[#e6e0d4] rounded-3xl">
            📭 No matching Gram Panchayats found.
          </div>
        )}
      </div>
    </div>
  );
}
