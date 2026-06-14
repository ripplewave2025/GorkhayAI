import { useState, useCallback, useMemo } from "react";
import { ElicitationSchema, SlotDef } from "@/lib/documentRegistry";
import { UserProfile } from "@/lib/profile";
import { speak } from "@/lib/voice";

export type ElicitationSource = "voice" | "samples" | "templates" | "gp";

export interface ElicitationContext {
  source: ElicitationSource;
  extraSlotValues?: Record<string, string>; // Additional forced pre-fills (e.g. GP address)
}

export function useElicitation() {
  const [isEliciting, setIsEliciting] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<ElicitationSchema | null>(null);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [currentSlotIndex, setCurrentSlotIndex] = useState(-1);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [elicitationSource, setElicitationSource] = useState<ElicitationSource>("voice");

  const activeSlots = useMemo(() => {
    if (!currentSchema) return [];
    return currentSchema.requiredSlots;
  }, [currentSchema]);

  // Compute the indices of slots that the user actually needs to answer
  const unansweredSlotIndices = useMemo(() => {
    return activeSlots
      .map((slot, idx) => ({ slot, idx }))
      .filter(({ slot }) => !slots[slot.key])
      .map(({ idx }) => idx);
  }, [activeSlots, slots]);

  const totalUserSlots = unansweredSlotIndices.length;

  const currentSlot = useMemo<SlotDef | null>(() => {
    if (currentSlotIndex < 0 || currentSlotIndex >= activeSlots.length) return null;
    return activeSlots[currentSlotIndex];
  }, [currentSlotIndex, activeSlots]);

  // Helper to extract surname from fullName
  const getSurname = (fullName: string): string => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : "";
  };

  const startElicitation = useCallback((
    schema: ElicitationSchema,
    profile: UserProfile,
    context?: ElicitationContext
  ) => {
    const source = context?.source || "voice";
    setElicitationSource(source);
    setIsConfirmingAll(false);

    let schemaToUse = schema;
    if (source === "samples" || source === "templates" || source === "gp") {
      // Find the main purpose/reason slot in the schema, or create a default one
      const purposeSlot = schema.requiredSlots.find(
        (s) => s.key === "purpose" || s.key === "complaintDetails" || s.key === "incidentDetails" || s.key === "mutationReason"
      ) || schema.requiredSlots.find(
        (s) => !s.autoFillFrom && s.required
      ) || {
        key: "purpose",
        label: "Purpose",
        label_ne: "K ko lagi certificate/application lekhnuhudaicha? (तपाईं यो किन लेख्दै हुनुहुन्छ?)",
        type: "text",
        required: true,
      };

      // Keep only profile-based autofill slots and the purpose slot.
      const profileSlots = schema.requiredSlots.filter((s) => s.autoFillFrom);
      const filteredSlots = [...profileSlots];
      if (!filteredSlots.some((s) => s.key === purposeSlot.key)) {
        filteredSlots.push(purposeSlot);
      }

      schemaToUse = {
        ...schema,
        requiredSlots: filteredSlots,
      };
    }

    setCurrentSchema(schemaToUse);

    // Prefill slots from profile
    const initialSlots: Record<string, string> = {};
    schemaToUse.requiredSlots.forEach((slot) => {
      if (slot.autoFillFrom) {
        let val = (profile as any)[slot.autoFillFrom] || "";
        // Special case: if caste is requested and empty in profile, try to infer from surname
        if (slot.key === "caste" && !val && profile.fullName) {
          val = getSurname(profile.fullName);
        }
        if (val && !val.startsWith("[")) {
          initialSlots[slot.key] = val;
        }
      }
    });

    // For samples/templates/gp sources: force-fill ALL profile-linked slots
    // even if profile doesn't have autoFillFrom mapping, use profile fields directly
    if (source === "samples" || source === "templates" || source === "gp") {
      const profileMap: Record<string, string> = {
        fullName: profile.fullName || "",
        fatherName: profile.fatherName || "",
        address: profile.address || "",
        phone: profile.phone || "",
        age: profile.age || "",
        block: profile.block || "",
        district: profile.district || "",
        gramPanchayat: profile.gramPanchayat || "",
        caste: profile.caste || "",
        subCaste: profile.subCaste || "",
      };

      schemaToUse.requiredSlots.forEach((slot) => {
        // If slot key matches a profile field directly, auto-fill it
        if (!initialSlots[slot.key] && profileMap[slot.key] && !profileMap[slot.key].startsWith("[")) {
          initialSlots[slot.key] = profileMap[slot.key];
        }
      });
    }

    // Apply extra slot overrides (e.g. from selected GP data)
    if (context?.extraSlotValues) {
      Object.entries(context.extraSlotValues).forEach(([key, val]) => {
        if (val && !val.startsWith("[")) {
          initialSlots[key] = val;
        }
      });
    }

    setSlots(initialSlots);

    // Find first empty required slot index
    let firstEmptyIdx = schemaToUse.requiredSlots.findIndex((s) => !initialSlots[s.key]);
    if (firstEmptyIdx === -1) {
      // All slots prefilled! Go straight to confirmation
      setCurrentSlotIndex(-1);
      setIsConfirmingAll(true);
      setIsEliciting(true);
      speakConfirmAll(initialSlots, schemaToUse);
    } else {
      setCurrentSlotIndex(firstEmptyIdx);
      setIsEliciting(true);
      speakSlotQuestion(schemaToUse.requiredSlots[firstEmptyIdx]);
    }
  }, []);

  const speakSlotQuestion = (slot: SlotDef) => {
    let question = slot.label_ne;
    // Special customization for purpose questions as requested by the user
    if (slot.key === "purpose") {
      question = "K ko lagi certificate, application, memo lekhnuhudaicha? " + question;
    }
    speak(question, "ne");
  };

  const speakConfirmAll = (currentSlots: Record<string, string>, schema: ElicitationSchema) => {
    // Build a simple summary sentence in Nepali
    const name = currentSlots.fullName || "";
    const purpose = currentSlots.purpose || "यो कागजात";
    let summaryText = `तपाईंको विवरणहरू थपिएका छन्। के हामी यसलाई तयार गरौं?`;
    
    if (name) {
      summaryText = `${name} को लागि, ${purpose} को काममा, पत्र तयार गरौं? ठिक छ?`;
    }
    speak(summaryText, "ne");
  };

  const stopElicitation = useCallback(() => {
    setIsEliciting(false);
    setCurrentSchema(null);
    setSlots({});
    setCurrentSlotIndex(-1);
    setIsConfirmingAll(false);
    setElicitationSource("voice");
  }, []);

  const answerCurrentSlot = useCallback((value: string) => {
    if (!currentSchema || currentSlotIndex === -1) return;

    const slotKey = activeSlots[currentSlotIndex].key;
    const updatedSlots = { ...slots, [slotKey]: value };
    setSlots(updatedSlots);

    // Find next empty slot
    let nextIdx = -1;
    for (let i = currentSlotIndex + 1; i < activeSlots.length; i++) {
      if (!updatedSlots[activeSlots[i].key]) {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx === -1) {
      // No more empty slots, go to confirmation
      setCurrentSlotIndex(-1);
      setIsConfirmingAll(true);
      speakConfirmAll(updatedSlots, currentSchema);
    } else {
      setCurrentSlotIndex(nextIdx);
      speakSlotQuestion(activeSlots[nextIdx]);
    }
  }, [currentSchema, currentSlotIndex, activeSlots, slots]);

  const goToPreviousSlot = useCallback(() => {
    if (isConfirmingAll) {
      setIsConfirmingAll(false);
      // Find the last slot that was user-answered (not auto-filled at start)
      // For simplicity, go to the last slot
      setCurrentSlotIndex(activeSlots.length - 1);
      speakSlotQuestion(activeSlots[activeSlots.length - 1]);
      return;
    }

    if (currentSlotIndex > 0) {
      const prevIdx = currentSlotIndex - 1;
      setCurrentSlotIndex(prevIdx);
      speakSlotQuestion(activeSlots[prevIdx]);
    }
  }, [currentSlotIndex, activeSlots, isConfirmingAll]);

  const getEnrichedPromptText = useCallback((rawTranscript: string) => {
    if (!currentSchema) return rawTranscript;

    // Convert slot records into an explicit text block for prompt injection
    const slotDetails = Object.entries(slots)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    return `User input: ${rawTranscript}\n\nElicited Facts from Voice Interview:\n${slotDetails}`;
  }, [slots, currentSchema]);

  return {
    isEliciting,
    slots,
    setSlots,
    currentSlotIndex,
    currentSlot,
    isConfirmingAll,
    elicitationSource,
    totalUserSlots,
    unansweredSlotIndices,
    startElicitation,
    stopElicitation,
    answerCurrentSlot,
    goToPreviousSlot,
    getEnrichedPromptText,
    speakSlotQuestion: () => currentSlot && speakSlotQuestion(currentSlot),
    speakConfirmAll: () => currentSchema && speakConfirmAll(slots, currentSchema),
  };
}
