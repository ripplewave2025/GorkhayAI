import { useState, useRef, useEffect, useCallback } from "react";
import { Document } from "@/lib/types";
import { speak, stopSpeaking } from "@/lib/voice";

export function useReader() {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerLines, setReaderLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const readerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (readerTimeoutRef.current) {
        clearTimeout(readerTimeoutRef.current);
      }
    };
  }, []);

  const stopReaderPlayback = useCallback(() => {
    stopSpeaking();
    setCurrentLineIndex(-1);
    if (readerTimeoutRef.current) {
      clearTimeout(readerTimeoutRef.current);
    }
  }, []);

  const closeReader = useCallback(() => {
    setIsReaderOpen(false);
    setCurrentLineIndex(-1);
    stopSpeaking();
    if (readerTimeoutRef.current) {
      clearTimeout(readerTimeoutRef.current);
    }
  }, []);

  const openReader = useCallback((doc: Document | null) => {
    if (!doc) return;
    const lines = doc.content
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    setReaderLines(lines);
    setCurrentLineIndex(-1);
    setIsReaderOpen(true);
    stopSpeaking();
  }, []);

  const playLine = useCallback((index: number, autoContinue = false, docLang: "en" | "ne" = "en") => {
    if (index < 0 || index >= readerLines.length) return;

    stopSpeaking();
    setCurrentLineIndex(index);

    const text = readerLines[index];

    speak(text, docLang, () => {
      if (autoContinue && index + 1 < readerLines.length) {
        readerTimeoutRef.current = setTimeout(() => {
          playLine(index + 1, true, docLang);
        }, 420);
      } else {
        if (!autoContinue) setCurrentLineIndex(-1);
      }
    });
  }, [readerLines]);

  const playAllLines = useCallback((docLang: "en" | "ne" = "en") => {
    if (readerLines.length === 0) return;
    playLine(0, true, docLang);
  }, [readerLines, playLine]);

  return {
    isReaderOpen,
    setIsReaderOpen,
    readerLines,
    currentLineIndex,
    openReader,
    closeReader,
    playLine,
    playAllLines,
    stopReaderPlayback,
  };
}
