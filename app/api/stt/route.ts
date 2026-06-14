import { NextRequest, NextResponse } from "next/server";

/**
 * Gorkhay AI — Speech-to-Text Proxy
 *
 * Configured for Sarvam AI (your current provider with 100 credits).
 * Sarvam is excellent for this app: native support for ne-IN (Nepali), hi-IN, code-mixing, etc.
 *
 * How to use:
 * 1. Get your API key from Sarvam dashboard (https://www.sarvam.ai or console).
 * 2. Add to .env.local:
 *    SARVAM_API_KEY=your_key_here
 * 3. (Optional) SARVAM_STT_MODEL=saaras:v3   or saarika:v2.5
 *
 * The frontend now records audio (webm) and sends it here via multipart/form-data.
 * This replaces unreliable browser Web Speech for accurate Nepali.
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | Blob | null;
    const lang = (formData.get("language") as string) || "ne-IN"; // Sarvam uses ne-IN

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // Support both standard name and the one the user mentioned ("Gorkhay_AI_nepali")
    const sarvamKey = process.env.SARVAM_API_KEY || process.env.Gorkhay_AI_nepali;

    if (!sarvamKey) {
      // No key yet — return helpful message
      return NextResponse.json({
        transcript: "",
        error: "SARVAM_API_KEY not set in .env.local. Get your key from Sarvam dashboard and add it.",
        note: "Once added, real transcription from your Sarvam credits will work here.",
      }, { status: 400 });
    }

    // Normalize language for Sarvam (they use ne-IN, not ne-NP)
    let sarvamLang = lang;
    if (sarvamLang === "ne-NP") sarvamLang = "ne-IN";
    if (sarvamLang === "en-US") sarvamLang = "en-IN";

    const model = process.env.SARVAM_STT_MODEL || "saaras:v3";

    // Sarvam STT integration
    // Docs: POST https://api.sarvam.ai/speech-to-text
    // Auth header: "api-subscription-key"
    // Form fields: "file", "language_code", "model" (recommended)
    const upstreamForm = new FormData();
    upstreamForm.append("file", audioFile, "audio.webm");
    upstreamForm.append("language_code", sarvamLang);
    upstreamForm.append("model", model);

    // Send both common auth styles to be safe
    const sttRes = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": sarvamKey,
        "Authorization": `Bearer ${sarvamKey}`,
      },
      body: upstreamForm,
    });

    const sttData = await sttRes.json().catch(() => ({}));

    console.log("Sarvam STT raw response:", sttData);  // <-- Check your terminal for this when you test

    if (!sttRes.ok) {
      console.error("Sarvam STT HTTP error:", sttRes.status, sttData);
      return NextResponse.json({
        transcript: "",
        error: `Sarvam STT failed with status ${sttRes.status}`,
        details: sttData,
        raw: sttData,
      }, { status: 502 });
    }

    // Flexible transcript extraction — Sarvam responses vary slightly by model/version
    const transcript =
      sttData.transcript ||
      sttData.text ||
      sttData.output?.transcript ||
      (Array.isArray(sttData.results) && sttData.results[0]?.transcript) ||
      (sttData.data && sttData.data.transcript) ||
      "";

    if (!transcript) {
      return NextResponse.json({
        transcript: "",
        error: "No transcript returned from Sarvam (check raw response in terminal)",
        raw: sttData,
        language_code: sarvamLang,
        model_used: model,
      });
    }

    return NextResponse.json({
      transcript: transcript.trim(),
      language: sttData.language_code || sarvamLang,
    });
  } catch (e: any) {
    console.error("STT proxy error", e);
    return NextResponse.json({ error: "STT processing failed", details: e.message }, { status: 500 });
  }
}
