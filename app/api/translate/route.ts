import { NextRequest, NextResponse } from "next/server";

/**
 * Gorkhay AI — Translation using Sarvam
 *
 * Used for high-quality natural Nepali rephrasing/translation for the "Read in Nepali" feature.
 * This bypasses the main LLM for the spoken version so we get better, more intelligible Nepali.
 *
 * Uses the same key as TTS (SARVAM_NEPALI_TTS_API_KEY or SARVAM_API_KEY).
 */

export async function POST(req: NextRequest) {
  try {
    const { text, source = "en-IN", target = "ne-IN" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey =
      process.env.SARVAM_NEPALI_TTS_API_KEY ||
      process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        translated_text: null,
        error: "No Sarvam key found for translation.",
      });
    }

    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        source_language_code: source,
        target_language_code: target,
        // model is optional; Sarvam will use a good default for ne-IN
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Sarvam translate error:", res.status, errText);
      return NextResponse.json({
        translated_text: null,
        error: "Sarvam translation failed",
        details: errText,
      }, { status: 502 });
    }

    const result = await res.json();

    // Common response shapes from Sarvam translation
    const translated =
      result?.translated_text ||
      result?.output ||
      result?.translatedText ||
      result?.text ||
      null;

    if (!translated) {
      return NextResponse.json({
        translated_text: null,
        error: "No translated text in Sarvam response",
        raw: result,
      });
    }

    return NextResponse.json({ translated_text: translated });
  } catch (e: any) {
    console.error("Translate proxy error", e);
    return NextResponse.json({ error: "Translation failed", details: e.message }, { status: 500 });
  }
}
