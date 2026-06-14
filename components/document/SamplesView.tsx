import React, { useState, useMemo } from "react";
import { Search, ChevronRight, FileText, Sparkles } from "lucide-react";
import { APPLICATION_CATEGORIES } from "@/lib/types";
import { DOCUMENT_REGISTRY } from "@/lib/documentRegistry";

interface SamplesViewProps {
  onSelectSample: (item: string) => void;
}

export default function SamplesView({ onSelectSample }: SamplesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const hasElicitationSchema = (itemName: string): boolean => {
    const matchedRegistry = DOCUMENT_REGISTRY.find(
      (reg) => reg.label.toLowerCase() === itemName.toLowerCase() || reg.key === itemName.toLowerCase().replace(/\s+/g, "-")
    );
    return !!(matchedRegistry && matchedRegistry.elicitationSchema);
  };

  // Category Icon Mapper
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Government & Panchayat":
        return "🏛️";
      case "Police & Legal":
        return "👮";
      case "Bank & Finance":
        return "💳";
      case "School & College":
        return "🎓";
      case "Job & Employment":
        return "💼";
      case "Health":
        return "🏥";
      case "Land & Property":
        return "🗺️";
      case "Business & Shop":
        return "🛒";
      case "Community & Social":
        return "👥";
      case "Personal & Family":
        return "👨‍👩‍👧‍👦";
      case "Media & Complaints":
        return "📢";
      default:
        return "📄";
    }
  };

  // Build a flat index of all items for Netflix-like search prediction
  const allTemplates = useMemo(() => {
    const list: Array<{ name: string; category: string; keywords: string[]; neName: string }> = [];
    
    APPLICATION_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        // Look up translation and keywords from documentRegistry
        const matchedRegistry = DOCUMENT_REGISTRY.find(
          (reg) => reg.label.toLowerCase() === item.toLowerCase() || reg.key === item.toLowerCase().replace(/\s+/g, "-")
        );

        let keywords: string[] = [];
        let neName = "";

        if (matchedRegistry) {
          keywords = matchedRegistry.keywords || [];
          // Derive some basic nepali tags or read from keywords
          const nepaliKws = matchedRegistry.keywords.filter((kw) => /[\u0900-\u097F]/.test(kw));
          neName = nepaliKws[0] || "";
        }

        list.push({
          name: item,
          category: cat.name,
          keywords,
          neName,
        });
      });
    });

    return list;
  }, []);

  // Filter items dynamically based on search query (checks name, category, keywords, nepali translation)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const q = searchTerm.toLowerCase().trim();
    return allTemplates
      .filter((temp) => {
        const matchesName = temp.name.toLowerCase().includes(q);
        const matchesCategory = temp.category.toLowerCase().includes(q);
        const matchesNepali = temp.neName.includes(q);
        const matchesKeywords = temp.keywords.some((kw) => kw.toLowerCase().includes(q));

        return matchesName || matchesCategory || matchesNepali || matchesKeywords;
      })
      .slice(0, 10); // Predict top 10 items
  }, [searchTerm, allTemplates]);

  return (
    <div className="pt-4 pb-8 max-w-md mx-auto">
      {/* Search Header */}
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-800">Sample Letters</h2>
        <p className="text-xs text-gray-500 mt-1">
          Search and choose from 120+ kinds of letters or applications.
        </p>
      </div>

      {/* Netflix/Amazon-style Predictive Search Input */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type what you need (e.g. Caste, FIR, NOC...)"
          className="block w-full pl-10 pr-3 py-3 border border-[#e6e0d4] rounded-2xl bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
          style={{ minHeight: "52px" }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Results / Predictions */}
      {searchTerm.trim() && (
        <div className="mb-6 space-y-2 bg-[#fcfbf9] border border-[#e6e0d4] rounded-3xl p-4 shadow-sm">
          <div className="text-[10px] text-[#0f766e] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles size={12} />
            <span>Search Predictions</span>
          </div>

          <div className="space-y-1">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSample(item.name)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-left transition-all"
                style={{ minHeight: "52px" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{getCategoryIcon(item.category)}</span>
                  <div className="truncate">
                    <div className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {hasElicitationSchema(item.name) && (
                        <span className="bg-[#0f766e]/10 text-[#0f766e] text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap">
                          <Sparkles size={8} /> Guided
                        </span>
                      )}
                    </div>
                    {item.neName && (
                      <div className="text-xs text-gray-400 -mt-0.5 nepali">{item.neName}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="hidden sm:inline bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">
                    {item.category}
                  </span>
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}

            {searchResults.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500">
                🔍 No letter matched. Try typing something else.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categorized Full List when not searching */}
      {!searchTerm.trim() && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            Browse by Category
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {APPLICATION_CATEGORIES.map((cat, idx) => (
              <details
                key={idx}
                className="group border border-[#e6e0d4] rounded-2xl bg-white overflow-hidden [&_summary::-webkit-details-marker]:hidden"
              >
                <summary
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  style={{ minHeight: "56px" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{getCategoryIcon(cat.name)}</span>
                    <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full group-open:bg-[#0f766e] group-open:text-white transition-colors">
                    {cat.items.length} items
                  </span>
                </summary>

                <div className="border-t border-gray-100 bg-[#faf9f6] p-2 space-y-1">
                  {cat.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => onSelectSample(item)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white text-left transition-all"
                      style={{ minHeight: "48px" }}
                    >
                      <span className="text-gray-700 text-sm font-medium flex items-center gap-1.5">
                        <span>{item}</span>
                        {hasElicitationSchema(item) && (
                          <span className="bg-[#0f766e]/10 text-[#0f766e] text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap">
                            <Sparkles size={8} /> Guided
                          </span>
                        )}
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
