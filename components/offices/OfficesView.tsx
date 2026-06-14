import React, { useState, useMemo } from "react";
import { Search, MapPin, Copy, PenTool, ChevronLeft, Sparkles, Building2 } from "lucide-react";
import officesDirectoryData from "@/Data/Parsed_data_of_all_Darjeeling_GP/Darjeeling_Offices/offices_directory.json";

interface OfficesViewProps {
  // GP-related
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
  // BDO data
  bdoData: any;
  // Office selection
  onSelectOffice?: (office: any, categoryId: string) => void;
  onWriteLetterForOffice?: (office: any, categoryId: string) => void;
}

interface OfficeCategory {
  id: string;
  label: string;
  label_ne: string;
  icon: string;
  description: string;
  offices: any[];
}

export default function OfficesView({
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
  bdoData,
  onSelectOffice,
  onWriteLetterForOffice,
}: OfficesViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedOfficeIdx, setExpandedOfficeIdx] = useState<number | null>(null);
  const [expandedGpId, setExpandedGpId] = useState<number | null>(null);
  const [officeSearchTerm, setOfficeSearchTerm] = useState("");

  const officesData = officesDirectoryData as any;

  // Build the full category list: GP + BDO + directory categories
  const allCategories = useMemo(() => {
    const categoryOverrides: Record<string, { label: string; description?: string; countLabel?: string }> = {
      sdo: {
        label: "Sub-Divisional Officer (SDO)",
        description: "Sub-division level administration, land records, revenue matters",
        countLabel: "4 Sub-divisions",
      },
      dm: {
        label: "District Magistrate (DM) & District Offices",
        description: "District-level administration, law & order, land reforms, certificates",
        countLabel: "District-level",
      },
      police: {
        label: "Police Stations",
        description: "FIR, GD entry, complaints, missing reports, theft reports",
        countLabel: "11+ main ones",
      },
      municipality: {
        label: "Municipality",
        description: "Urban civic services, birth/death certificates, trade licenses, property tax",
        countLabel: "Darjeeling + Siliguri + Kurseong",
      },
      banks: {
        label: "Banks",
        description: "KYC, account opening, loans, certificates, pension",
        countLabel: "Major banks",
      },
      hospitals: {
        label: "Hospitals / Health Offices",
        description: "Medical certificates, disability certificates, health complaints, reimbursement",
        countLabel: "Health offices",
      },
      schools: {
        label: "Schools & Colleges",
        description: "TC, bonafide, character certificates, leave applications, admissions",
        countLabel: "for TC, bonafide, etc.",
      },
      other: {
        label: "Additional Common Offices",
        description: "RTI, Treasury, Post Office, Electricity, Telecom, Railways",
        countLabel: "RTI, Treasury, etc.",
      },
    };

    const dirCategories = (officesData.categories || []).map((cat: any) => {
      const override = categoryOverrides[cat.id] || {};
      return {
        id: cat.id,
        label: override.label || cat.label,
        label_ne: cat.label_ne,
        icon: cat.icon,
        description: override.description || cat.description,
        offices: cat.offices || [],
        countLabel: override.countLabel,
      };
    });

    return [
      {
        id: "gp",
        label: "Gram Panchayat (GP)",
        label_ne: "ग्राम पञ्चायत",
        icon: "🏘️",
        description: "Village-level certificates, recommendations, complaints",
        count: filteredGPs.length || 92,
        countLabel: `${filteredGPs.length || 92} GPs`,
        offices: [],
      },
      {
        id: "bdo",
        label: "Block Development Officer (BDO)",
        label_ne: "खण्ड विकास अधिकारी",
        icon: "🏛️",
        description: "Block-level schemes, MGNREGA, housing, pensions",
        count: (bdoData?.blocks || []).length || 9,
        countLabel: `${(bdoData?.blocks || []).length || 9} Blocks`,
        offices: bdoData?.blocks || [],
      },
      ...dirCategories.map((c: any) => ({
        ...c,
        count: c.offices.length,
        countLabel: c.countLabel || `${c.offices.length} offices`,
      })),
    ];
  }, [officesData, filteredGPs, bdoData]);

  const selectedCategory = allCategories.find((c) => c.id === selectedCategoryId);

  // Filtered offices within a selected non-GP/BDO category
  const filteredCategoryOffices = useMemo(() => {
    if (!selectedCategory || selectedCategory.id === "gp" || selectedCategory.id === "bdo") return [];
    if (!officeSearchTerm.trim()) return selectedCategory.offices;
    const q = officeSearchTerm.toLowerCase().trim();
    return selectedCategory.offices.filter((o: any) =>
      o.name.toLowerCase().includes(q) ||
      (o.notes || "").toLowerCase().includes(q) ||
      (o.address || "").toLowerCase().includes(q)
    );
  }, [selectedCategory, officeSearchTerm]);

  // Filtered BDO blocks
  const filteredBDOBlocks = useMemo(() => {
    if (!selectedCategory || selectedCategory.id !== "bdo") return [];
    if (!officeSearchTerm.trim()) return bdoData?.blocks || [];
    const q = officeSearchTerm.toLowerCase().trim();
    return (bdoData?.blocks || []).filter((b: any) =>
      b.block_name.toLowerCase().includes(q) ||
      (b.bdo?.name || "").toLowerCase().includes(q) ||
      b.headquarters?.toLowerCase().includes(q)
    );
  }, [selectedCategory, officeSearchTerm, bdoData]);

  const copyOfficeSalutation = (office: any) => {
    const sal = office.salutation || office.address || office.name;
    navigator.clipboard.writeText(sal);
  };

  // ──── RENDER: Category Picker (Top Level) ────
  if (!selectedCategoryId) {
    return (
      <div className="pt-4 pb-8 max-w-md mx-auto">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Offices</h2>
          <p className="text-xs text-gray-500 mt-1">
            Choose the office you want to write to. We'll pre-fill the correct address.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setOfficeSearchTerm("");
                setExpandedOfficeIdx(null);
              }}
              className="border border-[#e6e0d4] rounded-3xl p-4 bg-white hover:bg-gray-50 text-left active:scale-[0.98] transition-all shadow-sm flex flex-col justify-between"
              style={{ minHeight: "110px" }}
            >
              <span className="text-3xl mb-2">{cat.icon}</span>
              <div>
                <div className="font-bold text-gray-800 text-xs leading-tight">{cat.label}</div>
                <div className="text-[10px] text-gray-500 nepali mt-0.5">{cat.label_ne}</div>
                {((cat as any).countLabel || "count" in cat) && (
                  <div className="text-[9px] text-[#0f766e] font-bold mt-1">
                    {(cat as any).countLabel || `${(cat as any).count} offices`}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ──── RENDER: GP Sub-View ────
  if (selectedCategoryId === "gp") {
    return (
      <div className="pt-4 pb-8 max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => setSelectedCategoryId(null)}
          className="flex items-center gap-1 text-xs text-[#0f766e] font-bold mb-3 hover:underline"
          style={{ minHeight: "36px" }}
        >
          <ChevronLeft size={16} /> Back to All Offices
        </button>

        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Gram Panchayats (97)</h2>
          <p className="text-xs text-gray-500 mt-1">
            Select your GP to pre-fill the correct official address.
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

        {/* Block Filter */}
        <div className="flex gap-2 mb-4">
          <select
            value={gpSelectedBlock}
            onChange={(e) => setGpSelectedBlock(e.target.value)}
            className="flex-1 bg-white border border-[#e6e0d4] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
            style={{ minHeight: "48px" }}
          >
            <option value="">All Blocks ({gpBlocks.length})</option>
            {gpBlocks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {(gpSearchTerm || gpSelectedBlock) && (
            <button
              onClick={() => { setGpSearchTerm(""); setGpSelectedBlock(""); }}
              className="px-4 py-2 border border-gray-300 rounded-2xl text-xs hover:bg-gray-100 transition-colors"
              style={{ minHeight: "48px" }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-[10px] text-gray-500 font-semibold mb-2 px-1">
          SHOWING {filteredGPs.length} OF 97 GRAM PANCHAYATS
        </div>

        {/* GP Cards */}
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
                    <div className="mt-1 text-[#0f766e]"><MapPin size={18} /></div>
                    <div>
                      <div className="font-bold text-gray-800 leading-tight">{gp.official_gp_name} GP</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {gp.place_name !== gp.official_gp_name ? gp.place_name + " • " : ""}
                        {gp.block} Block • {gp.local_body_code}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#fcfbf9] border border-dashed border-[#e6e0d4] rounded-xl p-2.5 my-2.5 text-xs text-gray-600 leading-relaxed font-mono">
                  <div className="text-[9px] text-[#0f766e] uppercase tracking-wider font-sans font-semibold mb-1">
                    Letter Recipient Header
                  </div>
                  The Pradhan,<br />
                  {gp.official_gp_name} Gram Panchayat,<br />
                  {gp.block} Block, Darjeeling District, West Bengal
                </div>

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

  // ──── RENDER: BDO Sub-View ────
  if (selectedCategoryId === "bdo") {
    return (
      <div className="pt-4 pb-8 max-w-md mx-auto">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className="flex items-center gap-1 text-xs text-[#0f766e] font-bold mb-3 hover:underline"
          style={{ minHeight: "36px" }}
        >
          <ChevronLeft size={16} /> Back to All Offices
        </button>

        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Block Development Officers (9)</h2>
          <p className="text-xs text-gray-500 mt-1">
            Select the BDO office for block-level applications and complaints.
          </p>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={officeSearchTerm}
            onChange={(e) => setOfficeSearchTerm(e.target.value)}
            placeholder="Search block name..."
            className="block w-full pl-10 pr-3 py-2.5 border border-[#e6e0d4] rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
            style={{ minHeight: "48px" }}
          />
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filteredBDOBlocks.map((block: any, idx: number) => (
            <div key={idx} className="border border-[#e6e0d4] rounded-3xl p-4 bg-white text-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-2 items-start mb-2">
                <div className="mt-1 text-[#0f766e]"><Building2 size={18} /></div>
                <div>
                  <div className="font-bold text-gray-800 leading-tight">{block.block_name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">HQ: {block.headquarters}</div>
                </div>
              </div>

              {block.bdo?.name && (
                <div className="text-xs text-gray-600 mt-1">
                  👤 <strong>BDO:</strong> {block.bdo.name}
                  {block.bdo.email && <span className="text-[#0f766e]"> ({block.bdo.email})</span>}
                </div>
              )}

              <div className="bg-[#fcfbf9] border border-dashed border-[#e6e0d4] rounded-xl p-2.5 my-2.5 text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-line">
                <div className="text-[9px] text-[#0f766e] uppercase tracking-wider font-sans font-semibold mb-1">
                  Letter Address
                </div>
                {block.standard_address_format}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(block.standard_address_format);
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
                  style={{ minHeight: "40px" }}
                >
                  <Copy size={12} /> Copy Address
                </button>
                <button
                  onClick={() => onWriteLetterForOffice?.(block, "bdo")}
                  className="flex-1 py-2 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm active:scale-[0.98]"
                  style={{ minHeight: "40px" }}
                >
                  <PenTool size={12} /> Write Letter
                </button>
              </div>
            </div>
          ))}

          {filteredBDOBlocks.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-500 bg-white border border-[#e6e0d4] rounded-3xl">
              📭 No matching blocks found.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──── RENDER: Generic Office Category Sub-View ────
  return (
    <div className="pt-4 pb-8 max-w-md mx-auto">
      <button
        onClick={() => setSelectedCategoryId(null)}
        className="flex items-center gap-1 text-xs text-[#0f766e] font-bold mb-3 hover:underline"
        style={{ minHeight: "36px" }}
      >
        <ChevronLeft size={16} /> Back to All Offices
      </button>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold tracking-tight text-gray-800">
          {selectedCategory?.icon} {selectedCategory?.label}
        </h2>
        <p className="text-xs text-gray-500 mt-1">{selectedCategory?.description}</p>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={officeSearchTerm}
          onChange={(e) => setOfficeSearchTerm(e.target.value)}
          placeholder="Search office name..."
          className="block w-full pl-10 pr-3 py-2.5 border border-[#e6e0d4] rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
          style={{ minHeight: "48px" }}
        />
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {filteredCategoryOffices.map((office: any, idx: number) => (
          <div key={idx} className="border border-[#e6e0d4] rounded-3xl p-4 bg-white text-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-2 items-start mb-2">
              <div className="mt-1 text-[#0f766e]"><Building2 size={18} /></div>
              <div>
                <div className="font-bold text-gray-800 leading-tight">{office.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{office.designation}</div>
              </div>
            </div>

            {office.notes && (
              <div className="text-[10px] text-gray-400 italic mb-2 px-1">{office.notes}</div>
            )}

            <div className="bg-[#fcfbf9] border border-dashed border-[#e6e0d4] rounded-xl p-2.5 my-2 text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-line">
              <div className="text-[9px] text-[#0f766e] uppercase tracking-wider font-sans font-semibold mb-1">
                Letter "To" Address
              </div>
              {office.salutation || office.address}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const text = office.salutation || office.address || office.name;
                  navigator.clipboard.writeText(text);
                }}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
                style={{ minHeight: "40px" }}
              >
                <Copy size={12} /> Copy Address
              </button>
              <button
                onClick={() => onWriteLetterForOffice?.(office, selectedCategoryId)}
                className="flex-1 py-2 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm active:scale-[0.98]"
                style={{ minHeight: "40px" }}
              >
                <PenTool size={12} /> Write Letter
              </button>
            </div>
          </div>
        ))}

        {filteredCategoryOffices.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-500 bg-white border border-[#e6e0d4] rounded-3xl">
            📭 No matching offices found.
          </div>
        )}
      </div>
    </div>
  );
}
