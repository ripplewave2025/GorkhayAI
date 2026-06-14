import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Document, NarrationVersion } from "@/lib/types";
import { speak, stopSpeaking } from "@/lib/voice";

interface UseNarrationOptions {
  voiceInputLang: string;
}

export function useNarration({ voiceInputLang }: UseNarrationOptions) {
  const [nepaliNarration, setNepaliNarration] = useState("");
  const [narrationHistory, setNarrationHistory] = useState<NarrationVersion[]>([]);
  const [currentNarrationIndex, setCurrentNarrationIndex] = useState(-1);
  const [lastNarrationWasSummary, setLastNarrationWasSummary] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const resetNarration = useCallback(() => {
    setNepaliNarration("");
    setNarrationHistory([]);
    setCurrentNarrationIndex(-1);
    setLastNarrationWasSummary(false);
    stopSpeaking();
  }, []);

  const addNarrationVersion = useCallback((text: string, audioBase64: string | null) => {
    const version: NarrationVersion = {
      id: Date.now(),
      text,
      audioBase64,
      timestamp: new Date().toISOString(),
    };
    setNarrationHistory((prev) => {
      const newHistory = [...prev, version];
      setCurrentNarrationIndex(newHistory.length - 1);
      return newHistory;
    });
    setNepaliNarration(text);
  }, []);

  const readDocumentInNepali = useCallback(async (doc: Document, useSummary = false) => {
    if (!doc) return;

    stopSpeaking();
    setLastNarrationWasSummary(useSummary);
    setIsSynthesizing(true);

    let baseContent = doc.content;
    if (useSummary) {
      toast.info("Creating English summary for Nepali reading...");
      try {
        const sumRes = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentContent: doc.content,
            instruction: "Provide a concise summary of this letter in 3-5 clear sentences in English. Keep the main request, key facts, names, dates, and the polite tone.",
            language: "en",
          }),
        });
        const sumData = await sumRes.json();
        if (sumRes.ok && sumData.content) {
          baseContent = sumData.content.trim();
        }
      } catch (err) {
        console.error("Summary creation failed:", err);
      }
    }

    try {
      toast.info("Generating natural Nepali rephrasing...");
      const transRes = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentContent: baseContent,
          instruction:
            "You are creating a natural spoken Nepali narration of this formal English letter.\n\n" +
            "The goal is for the original letter writer (who may not read English) to clearly understand the full meaning, tone, and sentiments when listening.\n\n" +
            "Rules for excellent Nepali output:\n" +
            "- Do NOT translate literally or word-for-word. Rephrase into fluent, natural, well-constructed spoken Nepali.\n" +
            "- Preserve ALL key facts, names, dates, requests, and the overall polite, respectful, sincere sentiment of the original.\n" +
            "- Use proper formal and respectful Nepali (appropriate honorifics such as महोदय, कृपया, अनुरोध छ, etc.).\n" +
            "- Make it highly intelligible and pleasant to listen to — like a courteous, educated person reading an official letter aloud.\n" +
            "- Keep the same paragraph structure for easy following.\n\n" +
            "Output ONLY the clean, natural Nepali text in Devanagari. No English, no explanations, no extra text at all.",
          language: "ne",
        }),
      });

      const transData = await transRes.json();
      const nepaliText = transData.content?.trim();
      if (!transRes.ok || !nepaliText) {
        throw new Error(transData.error || "Nepali rephrasing failed");
      }

      setNepaliNarration(nepaliText);
      toast.info("Synthesizing natural Nepali voice...");

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: nepaliText,
          language: "ne-NP",
          speaker: "21m00Tcm4TlvDq8ikWAM", // ElevenLabs voice ID
        }),
      });

      const ttsData = await ttsRes.json();

      if (ttsData.audioBase64) {
        try {
          const mimeType = ttsData.mimeType || "audio/mpeg";
          const audio = new Audio();
          audio.src = `data:${mimeType};base64,${ttsData.audioBase64}`;
          await audio.play();
          toast.success(`Playing natural Nepali voice${ttsData.provider ? ` (${ttsData.provider})` : ""}`);
          addNarrationVersion(nepaliText, ttsData.audioBase64);
          return;
        } catch (playErr: any) {
          console.error("Audio play error:", playErr);
          toast.error("Could not play audio: " + playErr.message);
        }
      }

      if (ttsData.audioUrl) {
        try {
          const audio = new Audio(ttsData.audioUrl);
          await audio.play();
          toast.success("Playing natural Nepali voice");
          addNarrationVersion(nepaliText, null);
          return;
        } catch (playErr: any) {
          console.error("Audio play error:", playErr);
        }
      }

      if (ttsData.useBrowserFallback || !ttsData.audioBase64) {
        toast.warning("No high-quality Nepali TTS available — falling back to browser voice.");

        const paragraphs = nepaliText
          .split(/\n+/)
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);

        if (paragraphs.length === 0) {
          toast.error("No Nepali text to speak.");
          return;
        }

        addNarrationVersion(nepaliText, null);

        let i = 0;
        const speakNext = () => {
          if (i < paragraphs.length) {
            speak(paragraphs[i], "ne", () => {
              i++;
              setTimeout(speakNext, 700);
            });
          } else {
            toast.info("Finished (browser voice)");
          }
        };
        speakNext();
      }
    } catch (err: any) {
      console.error("Read in Nepali error:", err);
      toast.error("Failed to generate/speak Nepali version: " + (err.message || "unknown"));
    } finally {
      setIsSynthesizing(false);
    }
  }, [addNarrationVersion]);

  const playCurrentNarrationVersion = useCallback(() => {
    if (currentNarrationIndex < 0 || currentNarrationIndex >= narrationHistory.length) return;
    const v = narrationHistory[currentNarrationIndex];
    setNepaliNarration(v.text);
    stopSpeaking();

    if (v.audioBase64) {
      const audio = new Audio(`data:audio/mpeg;base64,${v.audioBase64}`);
      audio.play().catch(() => {});
    } else {
      const paras = v.text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
      let i = 0;
      const next = () => {
        if (i < paras.length) speak(paras[i], "ne", () => { i++; setTimeout(next, 700); });
      };
      next();
    }
  }, [currentNarrationIndex, narrationHistory]);

  const goToPreviousNarrationVersion = useCallback(() => {
    if (currentNarrationIndex > 0) {
      const newIdx = currentNarrationIndex - 1;
      const v = narrationHistory[newIdx];
      setCurrentNarrationIndex(newIdx);
      setNepaliNarration(v.text);
      stopSpeaking();
      if (v.audioBase64) {
        const audio = new Audio(`data:audio/mpeg;base64,${v.audioBase64}`);
        audio.play().catch(() => {});
      }
    }
  }, [currentNarrationIndex, narrationHistory]);

  const goToNextNarrationVersion = useCallback(() => {
    if (currentNarrationIndex < narrationHistory.length - 1) {
      const newIdx = currentNarrationIndex + 1;
      const v = narrationHistory[newIdx];
      setCurrentNarrationIndex(newIdx);
      setNepaliNarration(v.text);
      stopSpeaking();
      if (v.audioBase64) {
        const audio = new Audio(`data:audio/mpeg;base64,${v.audioBase64}`);
        audio.play().catch(() => {});
      }
    }
  }, [currentNarrationIndex, narrationHistory]);

  const downloadCurrentNarration = useCallback(() => {
    if (currentNarrationIndex < 0 || currentNarrationIndex >= narrationHistory.length) return;
    const v = narrationHistory[currentNarrationIndex];
    if (!v || !v.audioBase64) {
      toast.error("No audio for this version to download.");
      return;
    }
    const link = document.createElement("a");
    link.href = `data:audio/mpeg;base64,${v.audioBase64}`;
    link.download = `letter-narration-v${currentNarrationIndex + 1}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentNarrationIndex, narrationHistory]);

  return {
    nepaliNarration,
    setNepaliNarration,
    narrationHistory,
    setNarrationHistory,
    currentNarrationIndex,
    setCurrentNarrationIndex,
    lastNarrationWasSummary,
    isSynthesizing,
    resetNarration,
    readDocumentInNepali,
    playCurrentNarrationVersion,
    goToPreviousNarrationVersion,
    goToNextNarrationVersion,
    downloadCurrentNarration,
  };
}
