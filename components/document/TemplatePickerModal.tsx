import React from "react";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { APPLICATION_CATEGORIES } from "@/lib/types";

interface TemplatePickerModalProps {
  showTemplates: boolean;
  onClose: () => void;
  onSelectTemplate: (item: string) => void;
}

export default function TemplatePickerModal({
  showTemplates,
  onClose,
  onSelectTemplate,
}: TemplatePickerModalProps) {
  return (
    <AnimatePresence>
      {showTemplates && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[85vh] border border-[#e6e0d4]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-800">Choose Letter Type</h3>
                <p className="text-[10px] text-gray-500">Pick a template to start writing instantly</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                style={{ minHeight: "44px", minWidth: "44px" }}
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* List of categories */}
            <div className="space-y-4">
              {APPLICATION_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[#0f766e] uppercase tracking-wider px-1">
                    {cat.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={() => onSelectTemplate(item)}
                        className="px-3.5 py-2.5 bg-gray-50 hover:bg-[#0f766e]/10 hover:text-[#0f766e] text-gray-700 text-xs rounded-xl border border-gray-200 transition-colors text-left font-medium active:scale-95"
                        style={{ minHeight: "44px" }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-6 pt-3 text-[10px] text-center text-gray-400">
              Tap any template. We will create the letter and you can refine it with your voice.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
