import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  createRecognition,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  getFriendlyRecognitionError,
  VoiceLang,
} from "@/lib/voice";

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceInputLang, setVoiceInputLang] = useState<VoiceLang>("ne-NP");
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Detect voice support on client side to prevent hydration mismatches
  useEffect(() => {
    setIsVoiceSupported(isSpeechRecognitionSupported());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Browser speech recognition path
  async function startBrowserListening() {
    if (isVoiceSupported === false) {
      toast.error(
        "Voice input is not supported in this browser. Try the latest Chrome, or use Chrome on an Android phone for Nepali."
      );
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast.error(
        "Please allow microphone access. Click the lock or microphone icon next to the URL and choose 'Allow'."
      );
      return;
    }

    const rec = createRecognition(voiceInputLang);
    if (!rec) {
      toast.error("Could not start the voice recognizer on this browser.");
      return;
    }

    recognitionRef.current = rec;
    setTranscript("");
    setIsListening(true);

    rec.onresult = (event: any) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim = t;
        }
      }

      const combined = (final + interim).trim();
      setTranscript(combined);
    };

    rec.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      setIsListening(false);

      const friendly = getFriendlyRecognitionError(e.error || "unknown", voiceInputLang);
      if (e.error === "no-speech") {
        toast.info(friendly);
      } else {
        toast.error(friendly);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    try {
      rec.start();
    } catch (err) {
      setIsListening(false);
      toast.error("Failed to start the microphone. Please try again.");
    }
  }

  function stopBrowserListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }

  // Server-side STT recording path (higher accuracy for Nepali)
  async function startServerSTTRecording() {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast.error("Microphone permission is required.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);

        if (audioBlob.size < 1000) {
          toast.error("Recording too short. Please hold the button and speak clearly.");
          return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", voiceInputLang);

        setIsListening(true); // reuse isListening state to show transcribing spinner/indicator
        try {
          const res = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (data.transcript) {
            setTranscript(data.transcript);
            toast.success("Transcription received from your STT API");
          } else {
            const msg = data.error || "STT returned no transcript. Check app/api/stt/route.ts";
            toast.error(msg);
            if (data.raw) {
              console.error("Full raw response from Sarvam:", data.raw);
            }
          }
        } catch (err) {
          toast.error("Failed to reach STT service. Is your API wired in /api/stt ?");
        } finally {
          setIsListening(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript("");
      toast.info("Recording... Release or tap again to stop and transcribe.");
    } catch (err) {
      toast.error("Could not start recording.");
    }
  }

  function stopServerSTTRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  return {
    isListening,
    setIsListening,
    isRecording,
    transcript,
    setTranscript,
    voiceInputLang,
    setVoiceInputLang,
    isVoiceSupported,
    startBrowserListening,
    stopBrowserListening,
    startServerSTTRecording,
    stopServerSTTRecording,
  };
}
