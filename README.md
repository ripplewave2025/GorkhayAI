# Gorkhay AI

Voice-first tool to help illiterate/semi-literate users create formal letters, applications, certificates, complaints, and official documents (English default + natural Nepali rephrasing for understanding).

**Current stack (as of this version):**
- **LLM (generation + rephrasing/translation)**: NVIDIA (minimaxai/minimax-m2.7 via OpenAI-compatible endpoint at integrate.api.nvidia.com)
- **STT (voice input)**: Sarvam AI (ne-IN / multilingual, via raw REST)
- **TTS (Nepali audio output)**: ElevenLabs (free credits, multilingual_v2 model, via REST; stores MP3 base64)
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind)
- **Fallbacks**: Browser speechSynthesis (for audio when no provider) + mock mode when no LLM keys
- **Storage**: localStorage (documents + narration history/versions)
- **Optional**:
  - Google Gemini (for LLM/rephrasing, via Gemini_API or GEMINI_API_KEY)
  - Google Cloud TTS (high-quality Nepali audio, requires GOOGLE_TTS_API_KEY)

## Purpose & Key Requirements (Implemented)
- Voice-first Nepali-prioritized input for creating official documents.
- Default output: clean formal **English** letter (structured: From/To/Date/Subject/Body/Closing/Signature).
- **Nepali rephrasing** (via LLM): Natural, highly intelligible, well-constructed, respectful style that preserves overall sentiments (not literal word-for-word).
- **Read in Nepali (understand)**: 
  - Full letter or **summarized version** (3-5 sentences) for quick verification.
  - Generates + stores audio (MP3 base64 via ElevenLabs).
  - Visible Nepali text box for checking correctness.
- **Versioning**: On refine, automatically creates new narration version (updated text + fresh audio). Switch/revert to previous versions. Download per-version MP3.
- Light memory (no heavy accounts; everything in-browser/localStorage).
- Document gallery with open/refine/share/download.
- Manual edit + voice refinement support.
- High-contrast, accessible UI with big controls for target users.

## Architecture / Flow (Current Version)
1. **Input**: Big mic → records → Sarvam STT (accurate Nepali/English) → live transcript.
2. **Generation**: Transcript + quick templates (full list of gov/police/bank/school/job/land/etc. docs) → LLM (NVIDIA minimax) produces structured English letter (with profile prefill from "My Details": name/father/address/phone/block/etc.).
3. **Nepali Understanding** ("Read in Nepali"):
   - LLM rephrases English → natural spoken Nepali (strong prompt for flow, respect, sentiments).
   - Optional: summary mode first (short English summary → Nepali narration).
   - ElevenLabs TTS → audio generated + stored as base64 MP3.
   - **Visible box** shows the rephrased Nepali text + version controls.
4. **Refine**: Voice or text instructions → LLM updates the *same* document in-place (multiple rounds supported).
   - Auto-creates new narration version (text + audio).
5. **Versioning & Playback**:
   - History of narration versions stored.
   - Prev/Next + Play (stored audio) + Download MP3 per version.
   - Revert if you don't like an update after refine.
6. **Gallery**: Save/open/refine/share (WhatsApp) / download (PDF/TXT) previous docs.
7. **Manual Edit**: Switches to editable textarea (converts back on save).
8. **Extras**: Line-by-line exact reader, copy, profile memory (My Details), template picker.

**Key Files**:
- `app/page.tsx`: Main UI, voice recording, readDocumentInNepali (rephrasing + TTS + versioning), refine, gallery.
- `app/api/generate/route.ts`: LLM call for initial letter (with profile prefill + structure).
- `app/api/refine/route.ts`: LLM for refinements + Nepali rephrasing (strong prompt).
- `app/api/stt/route.ts`: Sarvam STT proxy (records → transcript).
- `app/api/tts/route.ts`: Multi-provider TTS (ElevenLabs priority for Nepali, Google/Sarvam/browser fallback).
- `lib/`: types, storage (localStorage docs + history), voice (browser STT/TTS helpers), export (PDF/TXT/WhatsApp).
- `lib/documentRegistry.ts`: Categorized templates + smart detection (BDO/DM etc. using profile).
- `.env.local` (not committed): Keys (see below).

**Data Model** (light, client-only):
- Document: id, title, content (English), language, timestamps, templateType.
- Narration version: text (Nepali), audioBase64 (MP3), id/timestamp.
- Profile (My Details): name, father, address, phone, block, district, etc. (persisted, used for prefill/smart "To").

## Setup & Running
```bash
npm install
# Create .env.local (see .env.example)
npm run dev
```
Open http://localhost:3000 (or network IP).

**Required Keys** (add to `.env.local`; restart after changes):
- `NVIDIA_API_KEY` + `NVIDIA_MODEL=minimaxai/minimax-m2.7` (primary LLM; get from build.nvidia.com)
- `SARVAM_API_KEY` (STT / voice input; get from sarvam.ai)
- `ELEVENLABS_API_KEY` (TTS for Nepali audio; get from elevenlabs.io — you have free credits)
- `ELEVENLABS_NEPALI_VOICE_ID` (optional; voice from your ElevenLabs dashboard — test Nepali in their VoiceLab; default Rachel example)

Optional:
- `SARVAM_NEPALI_TTS_API_KEY` (if separate from STT)
- `GEMINI_API_KEY` / `Gemini_API` + `GEMINI_MODEL=gemini-1.5-flash` (switch/test; comment NVIDIA to prioritize)
- `GOOGLE_TTS_API_KEY` (better Nepali audio fallback; free tier available)

See `.env.example` for full commented list and notes.

**First Use Tips**:
- Fill **My Details** (name/father/address/phone/block/district) — used for prefill + smart "To" (BDO → your block, etc.).
- Speak naturally (Nepali prioritized via Sarvam).
- Use templates for common docs (full categorized list).
- After letter: use "Read in Nepali (understand)" or "Read summary in Nepali" → view text box + play/download audio.
- Refine → new version auto-created; use version buttons to revert.
- Save to gallery for later.

## Current Limitations & Notes (as of this version)
- No persistent backend (everything localStorage — export often).
- Nepali TTS quality depends on ElevenLabs voice choice + credits (browser fallback is mediocre for ne-NP on desktop).
- LLM rephrasing quality depends on active model (NVIDIA minimax is primary; Gemini excellent alternative for Nepali).
- Long documents: may hit provider limits (test with summaries first).
- ElevenLabs/Sarvam/NVIDIA free tiers have rate/credit limits — monitor usage.
- Browser permissions for mic required (explicit getUserMedia used).
- No rich editor (plain textarea for manual edit); exports are basic TXT/PDF.

## Architecture Diagrams (Text)
**High-level**:
Voice Input (Sarvam STT) → Transcript + Profile → LLM (NVIDIA minimax) → Structured English Letter
→ "Read in Nepali": LLM rephrase (natural Nepali) → ElevenLabs TTS → Stored versioned audio + visible text box
Refine (voice/text) → LLM update → New version (text + audio) + revert support
Gallery (save/open/refine/download)

**"Read in Nepali" Flow**:
1. LLM (current provider) + strong prompt → Nepali text (full or summary).
2. TTS (ElevenLabs for Nepali) → audioBase64.
3. Store as new version in history.
4. Display text box + play/download controls.
5. On refine: re-run → append new version.

## Logs & Debugging
- Browser console (F12): "Nepali text for TTS...", "TTS response keys...", provider logs.
- Terminal (npm run dev): `[LLM Provider] Using ...`, Sarvam/ElevenLabs errors.
- Toasts for user-facing states (translating, synthesizing, version created, errors).
- Add `console.log` in routes for raw provider responses during debugging.

This is the current working version (voice → LLM → structured docs → Nepali rephrase + versioned ElevenLabs audio + gallery).

Run `npm run dev` and test the full flow (mic → letter → Read in Nepali/summary → refine → switch versions → download).

If you add more keys (Gemini/Google) or change models, update `.env.local` + restart. Let me know what else to document or improve!

## Development Log & Changelog (Living History)

**Current Version:** v0.2 (as of 2026-06-11)  
**Primary Stack (locked per user):**  
- LLM: NVIDIA (minimaxai/minimax-m2.7 via OpenAI-compatible /v1)  
- STT: Sarvam AI (raw REST for voice input, ne-IN support)  
- TTS: ElevenLabs (free credits, multilingual_v2, REST for Nepali audio)  
- Optional fallbacks: Gemini (text/rephrasing only), Google Cloud TTS (audio), browser speechSynthesis  

**Why this stack?**  
- NVIDIA minimax for strong structured output + rephrasing.  
- Sarvam excellent for Indic STT (Nepali prioritized).  
- ElevenLabs for high-quality natural TTS voices (user has free credits; Sarvam Bulbul v3 does **not** support Nepali TTS per their docs).  
- Goal: Natural, respectful, intelligible Nepali narration (rephrased, not literal) + versioning for safety on refine.

### Dated Log of Changes & Decisions (append new entries here when evolving)

- **2026-06-11 (Initial Build & Core Flow)**: Bootstrapped Next.js 16 + TypeScript + Tailwind. Implemented big-mic voice recording (MediaRecorder + explicit permission). Wired Sarvam STT proxy (`/api/stt`). Added full categorized document templates + smart detection (BDO/DM resolution from profile). LLM integration for structured English letters (From/To/Date/Subject/Body/Closing/Signature) with profile prefill ("My Details"). Basic gallery (localStorage), manual edit, refine (voice/text via `/api/refine`), exports (TXT/PDF/WhatsApp). "Read in Nepali" initial stub (LLM translate + browser fallback). Visible Nepali text box added later for intelligibility. [.env.example created with all keys.]

- **2026-06-11 (TTS & Nepali Audio Evolution)**: Sarvam TTS tried first (no ne-IN support → always browser fallback, often silent/robotic on desktop). Switched to Google Cloud TTS support in `/api/tts` (WaveNet for quality, free tier). User avoided due to billing prompt. **Final: ElevenLabs wired as primary for Nepali** (multilingual_v2 + configurable voice via `ELEVENLABS_NEPALI_VOICE_ID`; uses free credits). Added audioBase64 storage, play, and download. Browser fallback retained with Nepali-specific rate/pitch tweaks in `lib/voice.ts`. [TTS route now tries ElevenLabs → Google → Sarvam → browser. Prioritizes Nepali correctly.]

- **2026-06-11 (Read in Nepali, Rephrasing & Summaries)**: Evolved from literal translate to strong LLM prompt for "natural spoken Nepali narration" (fluent rephrasing, respectful/formal style, preserves sentiments/facts, not word-for-word). Added **summary mode** ("Read summary in Nepali" button: LLM summarizes in English first, then natural Nepali of summary — ideal for quick correctness checks). Nepali text always visible in dedicated box (for review). [Prompt tuned for "highly intelligible + highly constructed + respectful". Falls back gracefully on errors.]

- **2026-06-11 (Versioning for Narration Audio/Text)**: Full versioning system added (`narrationHistory` + `currentNarrationIndex`). Each "Read" (full or summary) creates version with text + stored audioBase64 (MP3). **On refine: automatically generates + appends new version** (updated text + fresh ElevenLabs audio). UI controls: Prev/Next, version indicator, Play (stored audio), Download MP3 per version. Revert by switching versions (instant, no re-call). "Light version" = base64 MP3 stored per version. [Extracted helpers: `addNarrationVersion`, `playCurrent...`, `goToPrevious...`, `downloadCurrent...`. Survives in state; easy to extend to localStorage.]

- **2026-06-11 (Provider Management & Multi-LLM Support)**: `getProvider()` in generate/refine routes supports XAI, Groq, NVIDIA (minimax default), Gemini, OpenAI, Together (OpenAI-compatible where possible). **NVIDIA minimax prioritized first** (per user). Gemini support added (v1 endpoint, systemInstruction, responseMimeType for JSON, robust parsing). Logs `[LLM Provider] Using ...` to terminal. Error messages made generic (no more hardcoded "Nemotron"). `.env` var support for `Gemini_API` (user's naming). [Order: NVIDIA → Gemini (for easy switching). Console logs + 404 messages now show actual provider/model tried.]

- **2026-06-11 (Gemini Testing & Switching)**: User tested Gemini (Gemini_API key) for rephrasing. Switched back to NVIDIA minimax as primary. Gemini kept as easy alternative (comment NVIDIA keys to activate; set `GEMINI_MODEL=gemini-1.5-flash`). Note: Gemini excellent for natural Nepali but user prefers current NVIDIA stack for consistency with minimax. [Provider logs help confirm which is active.]

- **2026-06-11 (TTS Provider Evolution & Debugging)**: Sarvam TTS dropped for Nepali (confirmed no support). ElevenLabs wired (free credits, REST + base64). Gemini TTS (same key) tried but user avoided due to potential billing/limits. Google Cloud TTS support remains (free tier, but user prefers no extra keys). Added providerErrors array, better fallbacks, console logs in tts route. Frontend now has granular toasts + explicit browser fallback with Nepali text speak. [If ElevenLabs key present → used for Nepali audio. Stored in versions for replay.]

- **2026-06-11 (UI/UX & Accessibility)**: High-contrast paper-style UI, big mic, versioned Nepali box (with Play/Download/Prev/Next), profile memory, templates modal, manual edit, gallery actions. Added "Play again", version switching, download per version. Nepali box always visible post-read for checking. [Auto-clears on New. Summary button for quick verify.]

- **2026-06-11 (Documentation & Maintenance)**: Overhauled README.md with full stack, architecture, flow diagrams, setup, usage, limitations, and this living **Development Log**. `.env.example` kept up-to-date with user's exact stack + comments. Added provider logs, better error messages, and console guidance for debugging. [Future: Always append dated entries here when changing providers, prompts, or flows. Use for "if it goes haywire" navigation.]

- **2026-06-11 (Bug Fixes & Stability)**: Fixed provider priority (NVIDIA/minimax now first). Model defaults updated to user's minimax. Error messages generic + actionable. Translation/rephrasing prompt strengthened for "natural + respectful + sentiments". Nepali text box + versioning prevent silent failures. [HMR/Fast Refresh spam noted as normal during dev edits.]

**Next Steps (if evolving further)**:  
- If switching to Gemini full-time: Comment NVIDIA, set Gemini key + model.  
- For better Nepali audio (non-browser): Add GOOGLE_TTS_API_KEY (free tier) — route already supports it as fallback.  
- Extend versioning to persist in localStorage or export with docs.  
- Add voice selection UI for ElevenLabs.  
- Test long docs (chunk if needed).

**How to Maintain This Log**:  
When you (or future AI sessions) make changes (new provider, prompt tweak, bug fix, feature like more summary options), append a new bullet here with today's date + clear description + why. This creates an easy reverse-chronological navigation if things break. Also update the "Current Stack" and "Notes" sections. Commit with the README for history.

Run `npm run dev` to test. The app should now reliably use:  
- NVIDIA minimax for LLM/rephrasing  
- Sarvam STT  
- ElevenLabs TTS (with your free credits)  
- Full versioning + summary + visible text for Nepali reading  

If anything still feels off after restart, share the exact new logs and we'll iterate. This log + README should make future navigation much easier!
