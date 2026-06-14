import { ElicitationSchema } from "@/lib/documentRegistry";

interface CompletenessResult {
  isReady: boolean;
  missingSlots: string[];
  hasPlaceholders: boolean;
  placeholders: string[];
}

export function checkCompleteness(content: string, schema?: ElicitationSchema | null): CompletenessResult {
  const result: CompletenessResult = {
    isReady: true,
    missingSlots: [],
    hasPlaceholders: false,
    placeholders: [],
  };

  if (!content) {
    result.isReady = false;
    return result;
  }

  // 1. Scan for brackets or underline placeholders
  const placeholderRegex = /\[[a-zA-Z0-9\s'/\-_]+\]|__+|TBD|<[a-zA-Z0-9\s'/\-_]+>/g;
  const matches = content.match(placeholderRegex);
  
  if (matches && matches.length > 0) {
    result.hasPlaceholders = true;
    result.isReady = false;
    // De-duplicate placeholders
    result.placeholders = Array.from(new Set(matches));
  }

  // 2. Cross reference with schema slots
  if (schema && schema.requiredSlots) {
    schema.requiredSlots.forEach((slot) => {
      // Check if the slot label/key name appears in placeholder list
      // Or check if the generated text looks incomplete for this slot
      const isMissingInText = result.placeholders.some(
        (p) =>
          p.toLowerCase().includes(slot.key.toLowerCase()) ||
          p.toLowerCase().includes(slot.label.toLowerCase())
      );

      if (isMissingInText && slot.required) {
        result.missingSlots.push(slot.label);
      }
    });

    // If there are general placeholders but no specific slots mapped, map them
    if (result.hasPlaceholders && result.missingSlots.length === 0) {
      // Try to deduce from placeholders
      result.placeholders.forEach((p) => {
        const cleaned = p.replace(/[\[\]<>_]/g, "").trim();
        if (cleaned) {
          result.missingSlots.push(cleaned);
        }
      });
    }
  }

  return result;
}
