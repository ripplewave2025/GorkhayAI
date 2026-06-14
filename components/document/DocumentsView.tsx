import React from "react";
import { Search, FolderOpen, Calendar, Trash2, FileEdit } from "lucide-react";
import { Document, formatDate } from "@/lib/types";

interface DocumentsViewProps {
  filteredGallery: Document[];
  gallerySearch: string;
  setGallerySearch: (val: string) => void;
  loadDocumentIntoCompose: (doc: Document) => void;
  deleteFromGallery: (id: string) => void;
  onNewDocument: () => void;
}

export default function DocumentsView({
  filteredGallery,
  gallerySearch,
  setGallerySearch,
  loadDocumentIntoCompose,
  deleteFromGallery,
  onNewDocument,
}: DocumentsViewProps) {
  return (
    <div className="pt-4 pb-8 max-w-md mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">My Letters (मेरो पत्रहरू)</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your locally saved letters on this phone</p>
        </div>
        <button
          onClick={onNewDocument}
          className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645d] text-white text-xs font-semibold rounded-2xl flex items-center gap-1 transition-colors shadow-sm"
          style={{ minHeight: "40px" }}
        >
          <span>Write New</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={gallerySearch}
          onChange={(e) => setGallerySearch(e.target.value)}
          placeholder="Search your saved letters..."
          className="block w-full pl-10 pr-3 py-2.5 border border-[#e6e0d4] rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
          style={{ minHeight: "48px" }}
        />
        {gallerySearch && (
          <button
            onClick={() => setGallerySearch("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Saved Documents Grid */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {filteredGallery.map((doc) => (
          <div
            key={doc.id}
            className="border border-[#e6e0d4] rounded-3xl p-4 bg-white shadow-sm flex flex-col justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-semibold rounded-full">
                  {doc.templateType || "Application"}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(doc.createdAt)}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-1">{doc.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-2 font-normal leading-relaxed">
                {doc.content.replace(/^(From:|To:|Date:).*/gm, "").trim()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-50 mt-1">
              <button
                onClick={() => loadDocumentIntoCompose(doc)}
                className="flex-1 py-2 bg-[#0f766e]/10 hover:bg-[#0f766e]/20 text-[#0f766e] rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                style={{ minHeight: "40px" }}
              >
                <FileEdit size={13} />
                <span>Open & Edit</span>
              </button>
              <button
                onClick={() => deleteFromGallery(doc.id)}
                className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition-colors flex items-center justify-center"
                style={{ minHeight: "40px", minWidth: "40px" }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {filteredGallery.length === 0 && (
          <div className="text-center py-16 text-gray-500 bg-white border border-[#e6e0d4] rounded-3xl flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <FolderOpen size={24} className="text-gray-400" />
            </div>
            <p className="font-bold text-gray-700 text-sm">No letters saved yet</p>
            <p className="text-xs text-gray-400 text-center mt-1 mb-4">
              Write a letter on the Home tab and save it to view it here.
            </p>
            <button
              onClick={onNewDocument}
              className="px-5 py-2.5 bg-[#0f766e] text-white text-xs font-semibold rounded-2xl shadow-sm hover:bg-[#0d645d] transition-colors"
              style={{ minHeight: "44px" }}
            >
              Start Writing Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
