import { NextRequest, NextResponse } from "next/server";

/**
 * Gorkhay AI — Text-to-Speech
 *
 * Priority for Nepali:
 *   1. Gemini TTS (supports Nepali and can reuse the existing Gemini key)
 *   2. Google Cloud Text-to-Speech, if a Cloud TTS key is configured
 *   3. Browser fallback (poor on most desktops)
 *
 * Sarvam Bulbul is still useful for its supported Indian languages, but it
 * does not currently cover Nepali TTS.
 *
 * Required for good Nepali audio:
 *   GEMINI_API_KEY=... or Gemini_API=...
 */

const GEMINI_TTS_VOICES = new Set([
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
]);

type GeminiInlineData = {
  data?: string;
  mimeType?: string;
  mime_type?: string;
};

type GeminiPart = {
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
};

type GeminiTtsResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.Gemini_API ||
    process.env.GOOGLE_AI_API_KEY
  );
}

function getGeminiVoice(speaker?: string) {
  if (speaker && GEMINI_TTS_VOICES.has(speaker)) return speaker;
  if (process.env.GEMINI_TTS_VOICE && GEMINI_TTS_VOICES.has(process.env.GEMINI_TTS_VOICE)) {
    return process.env.GEMINI_TTS_VOICE;
  }
  return "Kore";
}

function pcmBase64ToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
) {
  const pcm = Buffer.from(pcmBase64, "base64");
  const header = Buffer.alloc(44);
  const dataLength = pcm.length;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcm]).toString("base64");
}

function getGeminiInlineAudio(data: GeminiTtsResponse) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inlineData = part?.inlineData || part?.inline_data;
    if (inlineData?.data) {
      return {
        data: inlineData.data as string,
        mimeType: (inlineData.mimeType || inlineData.mime_type || "") as string,
      };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { text, language = "ne-NP", speaker } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const isNepali = language === "ne-NP" || language === "ne-IN" || language === "ne";
    const providerErrors: string[] = [];

    // === ElevenLabs (user has free credits) - excellent for natural Nepali ===
    if (isNepali && process.env.ELEVENLABS_API_KEY) {
      const voiceId = speaker || process.env.ELEVENLABS_NEPALI_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel - popular multilingual voice. Change to your preferred voice from ElevenLabs dashboard (test in their VoiceLab or playground for best Nepali results)
      const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (elevenRes.ok) {
        const arrayBuffer = await elevenRes.arrayBuffer();
        const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
        return NextResponse.json({
          audioBase64,
          mimeType: "audio/mpeg",
          provider: "elevenlabs",
        });
      } else {
        const errText = await elevenRes.text();
        console.error("ElevenLabs TTS error:", elevenRes.status, errText);
        providerErrors.push(`ElevenLabs TTS failed (${elevenRes.status}).`);
      }
    }

    // === Best path with the keys already used by this app: Gemini TTS ===
    const geminiKey = getGeminiApiKey();
    if (isNepali && geminiKey) {
      const model = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
      const voiceName = getGeminiVoice(speaker);
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName,
                  },
                },
              },
            },
            model,
          }),
        }
      );

      if (geminiRes.ok) {
        const result = await geminiRes.json();
        const audio = getGeminiInlineAudio(result);
        if (audio?.data) {
          const rawMime = audio.mimeType.toLowerCase();
          const isRawPcm =
            !rawMime ||
            rawMime.includes("pcm") ||
            rawMime.includes("l16") ||
            rawMime.includes("linear16");

          return NextResponse.json({
            audioBase64: isRawPcm ? pcmBase64ToWavBase64(audio.data) : audio.data,
            mimeType: isRawPcm ? "audio/wav" : audio.mimeType,
            provider: "gemini",
          });
        }

        providerErrors.push("Gemini TTS returned no audio data.");
      } else {
        const errText = await geminiRes.text();
        console.error("Gemini TTS error:", geminiRes.status, errText);
        providerErrors.push(`Gemini TTS failed (${geminiRes.status}).`);
      }
    }

    // === Optional Google Cloud TTS path ===
    const googleKey =
      process.env.GOOGLE_TTS_API_KEY ||
      process.env.GOOGLE_CLOUD_TTS_API_KEY;

    if (isNepali && googleKey) {
      const googleRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: "ne-NP",
              ...(process.env.GOOGLE_TTS_VOICE
                ? { name: process.env.GOOGLE_TTS_VOICE }
                : {}),
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 0.92,
              pitch: -1,
            },
          }),
        }
      );

      if (!googleRes.ok) {
        const errText = await googleRes.text();
        console.error("Google TTS error:", googleRes.status, errText);
        providerErrors.push(`Google Cloud TTS failed (${googleRes.status}).`);
      } else {
        const data = await googleRes.json();
        if (data.audioContent) {
          return NextResponse.json({
            audioBase64: data.audioContent,
            mimeType: "audio/mpeg",
            provider: "google-cloud",
          });
        }

        providerErrors.push("Google Cloud TTS returned no audio data.");
      }
    }

    // === Fallback for Sarvam-supported languages ===
    const sarvamKey =
      process.env.SARVAM_NEPALI_TTS_API_KEY ||
      process.env.SARVAM_API_KEY;

    if (!isNepali && sarvamKey) {
      const targetLang = language === "en-US" ? "en-IN" : language;

      const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          target_language_code: targetLang,
          model: "bulbul:v3",
          speaker: speaker || "shubh",
          output_audio_codec: "mp3",
        }),
      });

      if (sarvamRes.ok) {
        const result = await sarvamRes.json();
        const audioBase64 = result?.audios?.[0] || result?.audio;
        if (audioBase64) {
          return NextResponse.json({
            audioBase64,
            mimeType: "audio/mpeg",
            provider: "sarvam",
          });
        }
        providerErrors.push("Sarvam TTS returned no audio data.");
      } else {
        const errText = await sarvamRes.text();
        console.error("Sarvam TTS error:", sarvamRes.status, errText);
        providerErrors.push(`Sarvam TTS failed (${sarvamRes.status}).`);
      }
    }

    // === Last resort: tell the frontend to use browser (and warn) ===
    return NextResponse.json({
      audioUrl: null,
      error: "No high-quality TTS provider available for this language.",
      useBrowserFallback: true,
      providerErrors,
      note: isNepali
        ? "For natural Nepali audio, add GEMINI_API_KEY or Gemini_API."
        : "Add a TTS key for better voices.",
    });
  } catch (e: unknown) {
    console.error("TTS proxy error", e);
    const details = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "TTS failed", details }, { status: 500 });
  }
}
