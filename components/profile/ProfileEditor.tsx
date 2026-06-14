import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, DEFAULT_PROFILE } from "@/lib/profile";

interface ProfileEditorProps {
  showProfileEditor: boolean;
  setShowProfileEditor: (show: boolean) => void;
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
  setProfile: (profile: UserProfile) => void;
}

export default function ProfileEditor({
  showProfileEditor,
  setShowProfileEditor,
  profile,
  updateProfile,
  setProfile,
}: ProfileEditorProps) {
  const fields = [
    { key: "fullName", label: "Your Full Name", label_ne: "तपाईंको पूरा नाम" },
    { key: "fatherName", label: "Father's / Husband's Name", label_ne: "बुबा वा श्रीमानको नाम" },
    { key: "address", label: "Full Address (Village, Ward, block)", label_ne: "घरको ठेगाना" },
    { key: "phone", label: "Phone Number", label_ne: "फोन नम्बर" },
    { key: "age", label: "Age (optional)", label_ne: "उमेर" },
    { key: "block", label: "Block (e.g. Takdah)", label_ne: "विकास खण्ड (ब्लक)" },
    { key: "district", label: "District (e.g. Darjeeling)", label_ne: "जिल्ला" },
    { key: "gramPanchayat", label: "Gram Panchayat (if any)", label_ne: "ग्राम पञ्चायत" },
    { key: "caste", label: "Caste / Tribe (for certificates)", label_ne: "जात/समुदाय" },
  ];

  return (
    <AnimatePresence>
      {showProfileEditor && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowProfileEditor(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#fcfbf7] border border-[#e6e0d4] rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-800">My Details (स्मरण-पत्र)</h3>
                <p className="text-[10px] text-gray-500">Your profile details for auto-filling letters</p>
              </div>
              <button
                onClick={() => setShowProfileEditor(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                style={{ minHeight: "44px", minWidth: "44px" }}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Input Form Fields */}
            <div className="space-y-4">
              {fields.map(({ key, label, label_ne }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-gray-700 font-semibold text-xs">{label}</label>
                    <span className="text-[9px] text-[#0f766e] font-normal nepali">{label_ne}</span>
                  </div>
                  <input
                    type="text"
                    value={(profile as any)[key] || ""}
                    onChange={(e) => updateProfile({ [key]: e.target.value })}
                    className="w-full bg-white border border-[#e6e0d4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition-all"
                    style={{ minHeight: "48px" }}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 text-[10px] text-gray-500 bg-[#f1eeeb] p-3 rounded-xl leading-relaxed">
              🔒 <strong>Device Local Data:</strong> These details are saved only on your phone/browser and never uploaded to any server. They are used to automatically fill the sender details in your documents.
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowProfileEditor(false)}
                className="flex-1 px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d645d] text-white rounded-2xl font-semibold transition-colors text-sm shadow-md"
                style={{ minHeight: "48px" }}
              >
                Done / सुरक्षित गर्नुहोस्
              </button>
              <button
                onClick={() => {
                  if (confirm("Reset profile details to placeholders?")) {
                    setProfile({ ...DEFAULT_PROFILE });
                    // Trigger storage write
                    updateProfile({ fullName: "" });
                  }
                }}
                className="px-4 py-2.5 border border-gray-300 hover:bg-red-50 text-red-600 rounded-2xl font-semibold transition-colors text-sm"
                style={{ minHeight: "48px" }}
              >
                Reset
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
