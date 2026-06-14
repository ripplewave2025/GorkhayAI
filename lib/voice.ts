// Voice utilities — Web Speech API wrappers
// Note: Nepali (ne-NP) support varies heavily by browser/OS.
// Android Chrome generally works best for Nepali STT.

export type VoiceLang = "ne-NP" | "en-US" | "en-IN";

export function getSupportedRecognitionLangs(): VoiceLang[] {
  return ["ne-NP", "en-IN", "en-US"];
}

export function createRecognition(lang: VoiceLang = "ne-NP") {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = lang;
  return rec;
}

export function speak(text: string, lang: "en" | "ne" = "en", onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === "ne" ? "ne-NP" : "en-US";
  utter.rate = lang === "ne" ? 0.88 : 0.95;   // slightly slower for better intelligibility in Nepali
  utter.pitch = lang === "ne" ? 1.02 : 1.0;   // gentle, respectful tone
  utter.volume = 0.95;

  if (onEnd) {
    utter.onend = onEnd;
  }

  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

/**
 * Explicitly request microphone permission.
 * This forces the browser permission prompt even before recognition starts.
 * Returns true if granted, false otherwise.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the tracks immediately — we only wanted the permission
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch (err) {
    console.warn("Mic permission error:", err);
    return false;
  }
}

export type RecognitionError =
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "language-not-supported"
  | "service-not-allowed"
  | "aborted"
  | "unknown";

export function getFriendlyRecognitionError(error: string, lang: VoiceLang): string {
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "Microphone access was blocked. Click the lock icon in the address bar and allow microphone, then try again.";
    case "no-speech":
      return "I didn't hear any speech. Please speak clearly and a bit louder, then tap the mic again.";
    case "audio-capture":
      return "No microphone was found or it is being used by another app. Please check your mic.";
    case "network":
      return "Voice recognition needs internet. Please check your connection.";
    case "language-not-supported":
      return `The language "${lang}" is not fully supported on this browser/device. Try switching Voice Input to English (IN) or use Chrome on an Android phone for Nepali.`;
    case "service-not-allowed":
      return "Voice service is not allowed. This can happen in private/incognito mode or with strict browser settings.";
    case "aborted":
      return "Listening was stopped.";
    default:
      return "Voice recognition had a problem. Please try again or switch to English input.";
  }
}
