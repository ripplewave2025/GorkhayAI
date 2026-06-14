import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // fast responses

const XAI_BASE = "https://api.x.ai/v1";
const OPENAI_BASE = "https://api.openai.com/v1";

function getProvider() {
  // Priority order for real LLM (you can use any OpenAI-compatible provider)
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
    // Groq — very fast + generous free tier. Great for testing.
    return {
      name: "groq" as const,
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }
  if (process.env.NVIDIA_API_KEY) {
    console.log('[LLM Provider] Using NVIDIA (minimax)');
    // NVIDIA NIM / build.nvidia.com — free tier with many good models, OpenAI compatible.
    // Use whatever you set in NVIDIA_MODEL (e.g. minimaxai/minimax-m2.7 or nvidia/...)
    return {
      name: "nvidia" as const,
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL || "minimaxai/minimax-m2.7", // user's minimax model; set in env if different exact ID from NVIDIA console
    };
  }
  if (process.env.GEMINI_API_KEY || process.env.Gemini_API) {
    console.log('[LLM Provider] Using Gemini');
    // Google Gemini — excellent multilingual, instruction following, and structured output.
    // Great for Nepali rephrasing and formal letter generation.
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API;
    return {
      name: "gemini" as const,
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash", // Set GEMINI_MODEL to the *exact* Flash model ID from your Google AI Studio for your key (common: gemini-1.5-flash or gemini-1.5-flash-latest). This is the "3.5 Flash" you want.
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
  console.log('[LLM Provider] No provider key found, using mock');
  return null; // mock mode
}

const SYSTEM_PROMPT = `You are Gorkhay AI. You create perfect, professional formal letters and applications for people who cannot easily write them themselves.

You are given a rich prompt that already contains:
- The user's exact request
- Today's date
- The correct "To" office (smart-resolved)
- The document type
- The sender's details for the signature block

MANDATORY OUTPUT STRUCTURE (use this exact order and style — sender details go ONLY at the bottom):

To,
[Smart-resolved office/authority, e.g. The Block Development Officer]
[Office Address, Block, District, State]

Date: [Today's date exactly as provided]

Subject: [Clear professional subject]

Respected Sir/Madam,

[Short introduction: who the person is and what they are requesting]

[Body paragraphs with facts/details from the request]

I therefore request you to kindly [specific action] at the earliest.

Thank you.

Yours faithfully,

[Full Name]
S/o or D/o [Father's / Husband's Name]
[Full Address]
Phone: [Phone]

CRITICAL RULES:
- The letter MUST start immediately with "To," followed by the recipient.
- NEVER, under any circumstances, put "From:" or the sender's details at the top of the letter. This is an absolute failure.
- The sender's name, parentage, address, and phone number MUST appear ONLY in the signature block at the very bottom after "Yours faithfully,".
- Use the exact personal details provided in the prompt. Never invent names/addresses.
- Write the entire letter in clean formal English by default.
- Only produce Nepali (Devanagari) if the language parameter is "ne".
- If this is a reasoning model, do your thinking internally first.
- The VERY LAST THING you output must be ONLY the raw valid JSON (no text before or after it):
{ "title": "short title", "content": "the full letter with proper newlines" }
- No extra text, no explanations, no markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, language = "en", templateType } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const langInstruction =
      language === "ne"
        ? "Write the entire letter in formal Nepali using proper Devanagari script."
        : "Write the letter in clear formal English (default).";

    const templateInstruction = templateType
      ? `This is specifically for: ${templateType}. Make sure tone, content, and requested elements match this document type.`
      : "";

    const userMessage = `User request (spoken or typed): """${prompt}"""

${langInstruction}
${templateInstruction}

Return ONLY the JSON object as specified. No extra text before or after.`;

    const provider = getProvider();

    if (!provider) {
      // MOCK MODE — excellent for demos and development without keys
      const isNepali = language === "ne";
      const mockTitle = isNepali
        ? (templateType ? templateType : "निवेदन पत्र")
        : (templateType ? templateType : "Formal Application Letter");

      const authority = (templateType || "Concerned Authority")
        .replace(/request|application|letter/gi, "")
        .trim() || "Concerned Authority";

      const mockContentEn = `To,
The ${authority}
[Office Name]
Dist. Darjeeling, West Bengal

Date: [Today's Date]

Subject: ${templateType || "Request / Application"}

Respected Sir/Madam,

I, [Your Full Name], son/daughter of [Father's Name], resident of [Village / Ward No., Block, District], am writing this letter to request your kind attention and necessary action regarding the above subject.

[Explain the situation clearly in 2-4 short paragraphs. Include dates, names, what exactly is needed, and why it matters. Be polite and factual.]

I shall be highly obliged if you could kindly process this request at the earliest and issue the required document / take necessary action.

Thank you.

Yours faithfully,

[Your Full Name]
S/o [Father's Name]
[Your Address]
Phone: [Phone Number]`;

      const mockContentNe = `श्रीमान् / श्रीमती,
${templateType || "सम्बन्धित कार्यालय"}
[कार्यालयको नाम]
जिल्ला दार्जीलिंग, पश्चिम बंगाल

मिति: [आजको मिति]

विषय: ${templateType || "निवेदन / अनुरोध"}

महोदय,

म [तपाईंको पूरा नाम], [बुबाको नाम] को छोरा/छोरी, [गाउँ/वडा नं., खण्ड, जिल्ला] बस्ने, माथि उल्लेखित विषयमा आवश्यक कारबाही र ध्यानाकर्षणको लागि यो निवेदन लेख्दै छु।

[यहाँ २-४ छोटो अनुच्छेदमा स्पष्ट रूपमा स्थिति बताउनुहोस्। मिति, नाम, के चाहिन्छ र किन महत्त्वपूर्ण छ भन्ने कुरा समावेश गर्नुहोस्। नम्र र तथ्यपरक भाषा प्रयोग गर्नुहोस्।]

कृपया यो अनुरोध चाँडोभन्दा चाँडो प्रक्रिया गर्नुहोस् र आवश्यक कागजात जारी गर्नुहोस् वा आवश्यक कारबाही गर्नुहोस् भन्ने अनुरोध गर्दछु।

धन्यवाद।

भवदीय,

[तपाईंको पूरा नाम]
[बुबाको नाम] को छोरा/छोरी
[ठेगाना]
फोन: [फोन नम्बर]`;

      const content = isNepali ? mockContentNe : mockContentEn;

      return NextResponse.json({
        title: mockTitle,
        content,
      });
    }

    // Real LLM call
    let res: Response;

    if (provider.name === "gemini") {
      // Gemini non-OpenAI format
      const geminiUrl = `${provider.baseURL}/models/${provider.model}:generateContent?key=${provider.apiKey}`;

      const geminiBody: any = {
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [{
          parts: [{ text: userMessage }],
        }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
        },
      };

      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });
    } else {
      // OpenAI-compatible path (NVIDIA, Groq, OpenAI, etc.)
      let requestBody: any = {
        model: provider.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        top_p: 0.95,
        max_tokens: 1800,
      };

      // Special handling only for NVIDIA Nemotron reasoning models
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
      const errText = await res.text();
      console.error("LLM error", res.status, errText);
      let userError = "LLM request failed";
      if (res.status === 404) {
        userError = `LLM model not found (404 page not found). The model ID '${provider?.model || ''}' may be invalid for the ${provider?.name || 'LLM'} endpoint. Check the exact Model ID in the provider docs (e.g. build.nvidia.com for NVIDIA or makersuite.google.com for Gemini).`;
      }
      return NextResponse.json(
        { error: userError, details: errText, provider: provider?.name, model: provider?.model },
        { status: 502 }
      );
    }

    const data = await res.json();

    let raw = "";

    if (provider.name === "gemini") {
      // Gemini response shape
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // OpenAI-compatible
      raw = data.choices?.[0]?.message?.content || "";

      // For Nemotron reasoning models, the final answer is usually in .content
      if (provider.name === "nvidia" && provider.model.includes("nemotron")) {
        raw = data.choices?.[0]?.message?.content || raw;
      }
    }

    // Clean common artifacts from reasoning models or markdown
    raw = raw.trim();
    raw = raw.replace(/```json|```/g, "").trim();
    // If the model included reasoning before the JSON, try to extract the last JSON object
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      raw = jsonMatch[0];
    }

    let parsed: { title?: string; content?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: try to extract content if model ignored json format
      parsed = {
        title: templateType || "Letter",
        content: raw.replace(/```json|```/g, "").trim(),
      };
    }

    const finalContent = (parsed.content || "").trim();
    const finalTitle =
      (parsed.title || templateType || "Formal Letter").slice(0, 70).trim() ||
      "Formal Letter";

    if (!finalContent) {
      return NextResponse.json({ error: "Empty content from model" }, { status: 502 });
    }

    return NextResponse.json({
      title: finalTitle,
      content: finalContent,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
