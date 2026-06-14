import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const XAI_BASE = "https://api.x.ai/v1";
const OPENAI_BASE = "https://api.openai.com/v1";

function getProvider() {
  if (process.env.XAI_API_KEY) {
    console.log('[LLM Provider] Using XAI');
    return {
      name: "xai" as const,
      baseURL: XAI_BASE,
      apiKey: process.env.XAI_API_KEY,
      model: process.env.XAI_MODEL || "grok-3",
    };
  }
  if (process.env.GROQ_API_KEY) {
    console.log('[LLM Provider] Using Groq');
    return {
      name: "groq" as const,
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }
  if (process.env.NVIDIA_API_KEY) {
    console.log('[LLM Provider] Using NVIDIA (minimax)');
    return {
      name: "nvidia" as const,
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL || "minimaxai/minimax-m2.7", // user's minimax model; set in env if different exact ID from NVIDIA console
    };
  }
  if (process.env.GEMINI_API_KEY || process.env.Gemini_API) {
    console.log('[LLM Provider] Using Gemini');
    // Google Gemini — excellent multilingual + instruction following. Great for natural Nepali rephrasing.
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API;
    return {
      name: "gemini" as const,
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash", // Set GEMINI_MODEL to the *exact* Flash model ID from your Google AI Studio (aistudio.google.com) for your key (common: gemini-1.5-flash, gemini-1.5-flash-latest). This is what you mean by "3.5 Flash".
    };
  }
  if (process.env.OPENAI_API_KEY) {
    console.log('[LLM Provider] Using OpenAI');
    return {
      name: "openai" as const,
      baseURL: OPENAI_BASE,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }
  if (process.env.TOGETHER_API_KEY) {
    console.log('[LLM Provider] Using Together');
    return {
      name: "together" as const,
      baseURL: "https://api.together.xyz/v1",
      apiKey: process.env.TOGETHER_API_KEY,
      model: process.env.TOGETHER_MODEL || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    };
  }
  console.log('[LLM Provider] No key found, using mock');
  return null;
}

const REFINE_SYSTEM = `You are Gorkhay AI. You help produce high-quality formal documents and their natural spoken versions.

You receive:
1. The CURRENT full document text (usually in English).
2. A specific instruction.

Follow the instruction precisely.

Special case — when the instruction is to create a spoken Nepali version:
- Produce fluent, highly intelligible, well-constructed Nepali.
- Prioritize natural spoken flow and respectful formal tone over literal word-for-word translation.
- Preserve all facts, requests, names, dates, and the polite sentiment of the original.
- Use appropriate respectful Nepali (honorifics, polite phrasing).

General rules:
- Keep formal register and realistic placeholders when editing.
- If this is a reasoning model, do your thinking internally first.
- The VERY LAST THING you output must be ONLY the raw valid JSON object: { "content": "..." }
- NEVER add commentary, never wrap in code fences.`;

export async function POST(req: NextRequest) {
  try {
    const { currentContent, instruction, language = "en" } = await req.json();

    if (!currentContent || !instruction) {
      return NextResponse.json(
        { error: "Missing currentContent or instruction" },
        { status: 400 }
      );
    }

    const langNote =
      language === "ne"
        ? "The document should remain (or become) in formal Nepali."
        : "The document should remain (or become) in formal English.";

    const userMsg = `CURRENT DOCUMENT:
"""
${currentContent}
"""

USER INSTRUCTION (apply this change):
"""
${instruction}
"""

${langNote}

If you need to think, do it internally. The very last output must be ONLY the raw JSON { "content": "..." }. No other text before or after.`;

    const provider = getProvider();

    if (!provider) {
      // Smart mock refinement — appends the instruction as a polite note or simple edit
      const isNepali = language === "ne";
      let updated = currentContent.trim();

      if (/nepali|नेपाली|spoken nepali|read in nepali/i.test(instruction) && !isNepali) {
        // Better mock for natural spoken Nepali (avoiding bad literal translation)
        updated = `यो पत्र तपाईंको तर्फबाट तयार गरिएको औपचारिक निवेदन हो। कृपया ध्यानपूर्वक सुनिदिनुहोस्:\n\n` +
          updated.replace(/\n\n/g, "\n\n").replace(/\[Your Full Name\]/g, "तपाईंको नाम").slice(0, 1200) +
          `\n\nयो पत्रमा लेखिएका कुराहरू तपाईंले बुझ्नुभयो भनेर आशा गर्दछु।`;
      } else if (/english|अंग्रेजी/i.test(instruction) && isNepali) {
        updated = `[English version of the above letter]\n\n` + updated.replace(/\[.*?\]/g, "[English details]");
      } else {
        // Simple but useful edit simulation
        updated = updated.replace(
          /(Yours faithfully,|भवदीय,)/i,
          (m: string) => `${m}\n\n[Edited per request: ${instruction.slice(0, 80)}]`
        );
        if (!/Edited per request/i.test(updated)) {
          updated += `\n\n[Additional note from refinement: ${instruction}]`;
        }
      }

      return NextResponse.json({ content: updated.trim() });
    }

    let res: Response;

    if (provider.name === "gemini") {
      const geminiUrl = `${provider.baseURL}/models/${provider.model}:generateContent?key=${provider.apiKey}`;

      const geminiBody: any = {
        systemInstruction: {
          parts: [{ text: REFINE_SYSTEM }],
        },
        contents: [{
          parts: [{ text: userMsg }],
        }],
        generationConfig: {
          temperature: 0.25,
          topP: 0.95,
          maxOutputTokens: 2200,
          responseMimeType: "application/json",
        },
      };

      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });
    } else {
      let requestBody: any = {
        model: provider.model,
        messages: [
          { role: "system", content: REFINE_SYSTEM },
          { role: "user", content: userMsg },
        ],
        temperature: 0.25,
        top_p: 0.95,
        max_tokens: 2200,
      };

      // Special handling for NVIDIA Nemotron reasoning models
      if (provider.name === "nvidia" && provider.model.includes("nemotron")) {
        requestBody.max_tokens = 16384;
        requestBody.extra_body = {
          chat_template_kwargs: { enable_thinking: true },
          reasoning_budget: 16384,
        };
      }

      res = await fetch(`${provider.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!res.ok) {
      const err = await res.text();
      let userError = "Refine failed";
      if (res.status === 404) {
        userError = `LLM model not found (404 page not found) during refine. The model ID '${provider?.model || ''}' may be invalid for the ${provider?.name || 'LLM'} endpoint. Check the exact Model ID in the provider's documentation (e.g. build.nvidia.com or makersuite.google.com for Gemini).`;
      }
      return NextResponse.json({ error: userError, details: err }, { status: 502 });
    }

    const data = await res.json();

    let raw = "{}";

    if (provider.name === "gemini") {
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    } else {
      raw = data.choices?.[0]?.message?.content || "{}";

      if (provider.name === "nvidia" && provider.model.includes("nemotron")) {
        raw = data.choices?.[0]?.message?.content || raw;
      }
    }

    // Clean common artifacts from reasoning models or markdown
    raw = raw.trim();
    raw = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      raw = jsonMatch[0];
    }

    let parsed: { content?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { content: raw.replace(/```/g, "").trim() };
    }

    const content = (parsed.content || "").trim();
    if (!content) {
      return NextResponse.json({ error: "Model returned empty content" }, { status: 502 });
    }

    return NextResponse.json({ content });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
