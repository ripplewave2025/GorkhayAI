"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";

// Hooks
import { useProfile } from "@/hooks/useProfile";
import { useGPData } from "@/hooks/useGPData";
import { useVoice } from "@/hooks/useVoice";
import { useDocument } from "@/hooks/useDocument";
import { useNarration } from "@/hooks/useNarration";
import { useReader } from "@/hooks/useReader";
import { useElicitation } from "@/hooks/useElicitation";

// Components
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import WriteView from "@/components/document/WriteView";
import DocumentsView from "@/components/document/DocumentsView";
import GramPanchayatView from "@/components/gp/GramPanchayatView";
import OfficesView from "@/components/offices/OfficesView";
import SamplesView from "@/components/document/SamplesView";
import ProfileEditor from "@/components/profile/ProfileEditor";
import LineByLineReader from "@/components/document/LineByLineReader";
import TemplatePickerModal from "@/components/document/TemplatePickerModal";
import ElicitationFlow from "@/components/document/ElicitationFlow";

// Libs
import { Document, DocLanguage } from "@/lib/types";
import { VoiceLang, stopSpeaking, requestMicrophonePermission, createRecognition, getFriendlyRecognitionError } from "@/lib/voice";
import { downloadPDF, downloadText, shareToWhatsApp, copyToClipboard } from "@/lib/export";
import { getTodayDate, isProfileComplete } from "@/lib/profile";
import { detectDocumentType, resolveToField, DOCUMENT_REGISTRY } from "@/lib/documentRegistry";
import { checkCompleteness } from "@/lib/completeness";

export default function GorkhayAI() {
  const [currentView, setCurrentView] = useState<"write" | "documents" | "samples" | "offices">("write");
  const [outputLang, setOutputLang] = useState<DocLanguage>("en");
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Selected generic office (e.g. BDO, SDO, Police, Bank, Hospital)
  const [selectedOffice, setSelectedOffice] = useState<any>(null);
  
  // Track template type during slot elicitation
  const [pendingTemplateType, setPendingTemplateType] = useState<string | null>(null);

  // 1. Profile Hook
  const profile = useProfile();

  // 2. GP Data Hook
  const gp = useGPData(setCurrentView as any);

  // 3. Voice Hook
  const voice = useVoice();

  // 4. Narration Hook
  const narration = useNarration({ voiceInputLang: voice.voiceInputLang });

  // 5. Reader Hook
  const reader = useReader();

  // 6. Elicitation Hook
  const elicitation = useElicitation();

  // 7. Document Hook
  const doc = useDocument({
    outputLang,
    setOutputLang,
    onDocumentReset: () => {
      narration.resetNarration();
      voice.setTranscript("");
      gp.setSelectedGP(null);
      setSelectedOffice(null);
      setPendingTemplateType(null);
    },
    onDocumentLoad: (loadedDoc) => {
      narration.resetNarration();
      voice.setTranscript("");
      gp.setSelectedGP(null);
      setSelectedOffice(null);
      setPendingTemplateType(loadedDoc.templateType || null);
    },
    onDocumentChange: (newDoc) => {
      // Auto-narrate if it is in Nepali
      if (newDoc.language === "ne") {
        narration.setNepaliNarration(newDoc.content);
      }
    },
    onRefineSuccess: () => {
      if (doc.currentDoc && narration.narrationHistory.length > 0) {
        narration.readDocumentInNepali(doc.currentDoc, narration.lastNarrationWasSummary);
      }
    },
  });

  // Derived: Completeness Check for current document
  const completeness = useMemo(() => {
    if (!doc.currentDoc) {
      return { isReady: true, missingSlots: [], hasPlaceholders: false, placeholders: [] };
    }
    const matchedRegistry = DOCUMENT_REGISTRY.find(
      (reg) =>
        reg.label.toLowerCase() === (doc.currentDoc?.templateType || "").toLowerCase() ||
        reg.key === (doc.currentDoc?.templateType || "").toLowerCase().replace(/\s+/g, "-")
    );
    return checkCompleteness(doc.currentDoc.content, matchedRegistry?.elicitationSchema);
  }, [doc.currentDoc]);

  // Profile gate: ensures profile is filled before guided flows
  const checkProfileGate = (source: string): boolean => {
    if (!isProfileComplete(profile.profile)) {
      toast.error(
        "Please fill your profile first (name, address, phone). Tap the profile icon.",
        { duration: 5000 }
      );
      profile.setShowProfileEditor(true);
      return false;
    }
    return true;
  };

  // Helper to get elicitation schema for a template (or dynamic generic schema)
  const getElicitationSchemaForTemplate = (templateLabel: string, matchedRegistry?: any) => {
    if (matchedRegistry?.elicitationSchema) {
      return matchedRegistry.elicitationSchema;
    }
    return {
      purposeOptions: [],
      requiredSlots: [
        {
          key: "fullName",
          label: "Full Name",
          label_ne: "तपाईंको पूरा नाम के हो?",
          type: "text",
          required: true,
          autoFillFrom: "fullName"
        },
        {
          key: "fatherName",
          label: "Father's / Husband's Name",
          label_ne: "तपाईंको बुबा वा श्रीमानको नाम के हो?",
          type: "text",
          required: true,
          autoFillFrom: "fatherName"
        },
        {
          key: "address",
          label: "Full Address",
          label_ne: "तपाईंको ठेगाना के हो?",
          type: "text",
          required: true,
          autoFillFrom: "address"
        },
        {
          key: "phone",
          label: "Phone Number",
          label_ne: "तपाईंको फोन नम्बर के हो?",
          type: "text",
          required: true,
          autoFillFrom: "phone"
        },
        {
          key: "purpose",
          label: "Purpose",
          label_ne: `K ko lagi ${templateLabel} lekhnuhudaicha? (तपाईं यो किन लेख्दै हुनुहुन्छ?)`,
          type: "text",
          required: true
        }
      ]
    };
  };

  // Handle Voice Transcript submission
  const handleUseTranscript = async () => {
    const text = voice.transcript.trim();
    if (!text) {
      toast.error("Please speak something first.");
      return;
    }

    voice.setTranscript("");

    const detection = detectDocumentType(text);

    if (detection.def) {
      if (!checkProfileGate("voice")) return;
      const schema = getElicitationSchemaForTemplate(detection.def.label, detection.def);
      elicitation.startElicitation(schema, profile.profile, { source: "voice" });
      setPendingTemplateType(detection.def.label);
    } else {
      const autoNepali = /(nepali|नेपाली|in nepali|नेपालीमा)/i.test(text);
      const langToUse = autoNepali ? "ne" : outputLang;
      const toField = resolveToField(text, profile.profile, gp.selectedGP, gp.bdoData, selectedOffice);

      const enrichedPrompt = buildEnrichedPrompt(
        text,
        "Formal Application",
        profile.profile,
        getTodayDate(),
        toField,
        gp.selectedGP,
        selectedOffice
      );

      await doc.generateDocument(enrichedPrompt, langToUse, "Formal Application");
    }
  };

  // Handle choosing template manually
  const handleSelectTemplate = (item: string) => {
    setShowTemplates(false);
    
    const matchedRegistry = DOCUMENT_REGISTRY.find(
      (reg) => reg.label.toLowerCase() === item.toLowerCase() || reg.key === item.toLowerCase().replace(/\s+/g, "-")
    );

    if (!checkProfileGate("samples")) return;
    setSelectedOffice(null);
    const schema = getElicitationSchemaForTemplate(item, matchedRegistry);
    elicitation.startElicitation(schema, profile.profile, { source: "samples" });
    setPendingTemplateType(matchedRegistry?.label || item);
    
    setCurrentView("write");
  };

  // Handle quick request or example showcase block tap
  const handleQuickRequest = (templateLabel: string) => {
    const matchedRegistry = DOCUMENT_REGISTRY.find(
      (reg) =>
        reg.label.toLowerCase() === templateLabel.toLowerCase() ||
        reg.key === templateLabel.toLowerCase().replace(/\s+/g, "-") ||
        reg.keywords.some((kw) => templateLabel.toLowerCase().includes(kw))
    );

    const label = matchedRegistry?.label || templateLabel;
    if (!checkProfileGate("templates")) return;
    setSelectedOffice(null);
    const schema = getElicitationSchemaForTemplate(label, matchedRegistry);
    elicitation.startElicitation(schema, profile.profile, { source: "templates" });
    setPendingTemplateType(label);
    
    setCurrentView("write");
  };

  // Handle direct template selection from a GP card
  const handleWriteLetterForGP = (gpItem: any, templateLabel: string) => {
    gp.selectGP(gpItem);
    setSelectedOffice(null);
    
    const matchedRegistry = DOCUMENT_REGISTRY.find(
      (reg) =>
        reg.label.toLowerCase() === templateLabel.toLowerCase() ||
        reg.key === templateLabel.toLowerCase().replace(/\s+/g, "-") ||
        reg.keywords.some((kw) => templateLabel.toLowerCase().includes(kw))
    );

    const label = matchedRegistry?.label || templateLabel;
    if (!checkProfileGate("gp")) return;
    const schema = getElicitationSchemaForTemplate(label, matchedRegistry);
    elicitation.startElicitation(schema, profile.profile, {
      source: "gp",
      extraSlotValues: {
        address: gpItem.block ? `${profile.profile.address}` : profile.profile.address,
      },
    });
    setPendingTemplateType(label);
    
    setCurrentView("write");
  };

  // Handle writing a letter for a selected office (non-GP/BDO)
  const handleWriteLetterForOffice = (office: any, categoryId: string) => {
    setSelectedOffice(office);
    gp.setSelectedGP(null);
    
    if (!checkProfileGate("gp")) return;
    const officeName = office.name || office.block_name || "Concerned Office";
    const schema = getElicitationSchemaForTemplate(`Letter to ${officeName}`);
    elicitation.startElicitation(schema, profile.profile, { source: "gp" });
    setPendingTemplateType(`Letter to ${officeName}`);
    
    setCurrentView("write");
  };

  // Handle other/voice mode selection from a GP card
  const handleVoiceWriteForGP = (gpItem: any) => {
    gp.selectGP(gpItem);
    setSelectedOffice(null);
    
    if (!checkProfileGate("gp")) return;
    const schema = getElicitationSchemaForTemplate("Gram Panchayat Letter");
    elicitation.startElicitation(schema, profile.profile, { source: "gp" });
    setPendingTemplateType("Letter to Gram Panchayat");
    
    setCurrentView("write");
  };

  // Confirm Elicitation Flow and trigger document generation
  const handleConfirmElicitation = async () => {
    const promptText = elicitation.getEnrichedPromptText(
      voice.transcript || `Request for ${pendingTemplateType}`
    );

    const autoNepali = /(nepali|नेपाली|in nepali|नेपालीमा)/i.test(promptText);
    const langToUse = autoNepali ? "ne" : outputLang;
    const toField = resolveToField(promptText, profile.profile, gp.selectedGP, gp.bdoData, selectedOffice);

    const enrichedPrompt = buildEnrichedPrompt(
      promptText,
      pendingTemplateType || "Formal Application",
      profile.profile,
      getTodayDate(),
      toField,
      gp.selectedGP,
      selectedOffice
    );

    await doc.generateDocument(enrichedPrompt, langToUse, pendingTemplateType || undefined);
    elicitation.stopElicitation();
  };

  // Refinement states & handlers
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refineContext, setRefineContext] = useState<any>({});

  const handleRefineDocument = async (customInstruction?: string) => {
    const instruction =
      customInstruction ||
      (refineContext.paragraph
        ? `Focus on this part and apply the change: "${refineContext.paragraph}". ${refineInstruction}`
        : refineInstruction.trim());

    if (!instruction.trim()) {
      toast.error("Please say or type what you want to change.");
      return;
    }

    await doc.refineDocument(instruction);
    setRefineInstruction("");
    setRefineContext({});
  };

  const startVoiceRefine = async () => {
    if (!doc.currentDoc) return;

    if (voice.isVoiceSupported === false) {
      toast.error("Voice not supported here.");
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast.error("Please allow the microphone to give refinement instructions.");
      return;
    }

    const rec = createRecognition(voice.voiceInputLang);
    if (!rec) return;

    voice.setIsListening(true);
    setRefineInstruction("");
    let finalText = "";

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        }
      }
    };

    rec.onend = () => {
      voice.setIsListening(false);
      const instr = finalText.trim();
      if (instr) {
        setRefineInstruction(instr);
        setTimeout(() => handleRefineDocument(instr), 60);
      } else {
        toast.info("No instruction heard. Try again.");
      }
    };

    rec.onerror = (e: any) => {
      voice.setIsListening(false);
      const friendly = getFriendlyRecognitionError(e.error || "unknown", voice.voiceInputLang);
      toast.error(friendly);
    };

    try {
      rec.start();
    } catch {
      voice.setIsListening(false);
    }
  };

  // Resume elicitation when details are missing (e.g. click "Fill Details")
  const handleResumeElicitation = () => {
    const matchedRegistry = DOCUMENT_REGISTRY.find(
      (reg) =>
        reg.label.toLowerCase() === (doc.currentDoc?.templateType || "").toLowerCase() ||
        reg.key === (doc.currentDoc?.templateType || "").toLowerCase().replace(/\s+/g, "-")
    );
    if (matchedRegistry && matchedRegistry.elicitationSchema) {
      elicitation.startElicitation(matchedRegistry.elicitationSchema, profile.profile, { source: "templates" });
      setPendingTemplateType(doc.currentDoc?.templateType || null);
    } else {
      toast.info("No structured slots mapped for this document type. Please use manual edit or refinement.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f5f0] text-[#111] pb-20">
      {/* Header bar */}
      <Header
        currentDoc={doc.currentDoc}
        currentView={currentView}
        onNewDocument={doc.newDocument}
        onOpenProfile={() => profile.setShowProfileEditor(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-16">
        {currentView === "write" && (
          <WriteView
            currentDoc={doc.currentDoc}
            isGenerating={doc.isGenerating}
            isRefining={doc.isRefining}
            outputLang={outputLang}
            setOutputLang={setOutputLang}
            voiceInputLang={voice.voiceInputLang}
            setVoiceInputLang={voice.setVoiceInputLang}
            transcript={voice.transcript}
            setTranscript={voice.setTranscript}
            isListening={voice.isListening}
            isRecording={voice.isRecording}
            startListening={voice.startBrowserListening}
            stopListening={voice.stopBrowserListening}
            startServerSTT={voice.startServerSTTRecording}
            stopServerSTT={voice.stopServerSTTRecording}
            useTranscriptForGeneration={handleUseTranscript}
            selectedGP={gp.selectedGP}
            setSelectedGP={gp.setSelectedGP}
            selectedOffice={selectedOffice}
            setSelectedOffice={setSelectedOffice}
            setShowTemplates={setShowTemplates}
            onQuickRequest={handleQuickRequest}
            
            // Document actions
            letterParagraphs={doc.letterParagraphs}
            onParagraphClick={(para) => {
              doc.setManualDraft(para);
              doc.enterManualEdit();
            }}
            onOpenReader={() => reader.openReader(doc.currentDoc)}
            onReadInNepali={(summary) => doc.currentDoc && narration.readDocumentInNepali(doc.currentDoc, summary)}
            onCopyText={() => {
              if (doc.currentDoc) {
                copyToClipboard(doc.currentDoc.content);
                toast.success("Copied to clipboard");
              }
            }}
            
            // Manual edit
            isEditingManually={doc.isEditingManually}
            manualDraft={doc.manualDraft}
            setManualDraft={doc.setManualDraft}
            enterManualEdit={doc.enterManualEdit}
            cancelManualEdit={doc.cancelManualEdit}
            saveManualEdit={doc.saveManualEdit}
            
            // Refinement
            refineInstruction={refineInstruction}
            setRefineInstruction={setRefineInstruction}
            refineContext={refineContext}
            setRefineContext={setRefineContext}
            refineDocument={handleRefineDocument}
            startVoiceRefine={startVoiceRefine}
            
            // Exports
            onDownloadText={() => doc.currentDoc && downloadText(doc.currentDoc)}
            onDownloadPDF={() => doc.currentDoc && downloadPDF(doc.currentDoc)}
            onShareWhatsApp={() => doc.currentDoc && shareToWhatsApp(doc.currentDoc)}
            
            // Completeness check
            isReady={completeness.isReady}
            missingSlots={completeness.missingSlots}
            onResumeElicitation={handleResumeElicitation}
            
            // Narration info
            nepaliNarration={narration.nepaliNarration}
            narrationHistory={narration.narrationHistory}
            currentNarrationIndex={narration.currentNarrationIndex}
            playCurrentNarrationVersion={narration.playCurrentNarrationVersion}
            goToPreviousNarrationVersion={narration.goToPreviousNarrationVersion}
            goToNextNarrationVersion={narration.goToNextNarrationVersion}
            downloadCurrentNarration={narration.downloadCurrentNarration}
            isSynthesizing={narration.isSynthesizing}
          />
        )}

        {currentView === "documents" && (
          <DocumentsView
            filteredGallery={doc.filteredGallery}
            gallerySearch={doc.gallerySearch}
            setGallerySearch={doc.setGallerySearch}
            loadDocumentIntoCompose={doc.loadDocumentIntoCompose}
            deleteFromGallery={doc.deleteFromGallery}
            onNewDocument={doc.newDocument}
          />
        )}

        {currentView === "samples" && (
          <SamplesView onSelectSample={handleSelectTemplate} />
        )}

        {currentView === "offices" && (
          <OfficesView
            gpSearchTerm={gp.gpSearchTerm}
            setGpSearchTerm={gp.setGpSearchTerm}
            gpSelectedBlock={gp.gpSelectedBlock}
            setGpSelectedBlock={gp.setGpSelectedBlock}
            gpBlocks={gp.gpBlocks}
            filteredGPs={gp.filteredGPs}
            selectGP={gp.selectGP}
            copyGPSalutation={gp.copyGPSalutation}
            onWriteLetterForGP={handleWriteLetterForGP}
            onVoiceWriteForGP={handleVoiceWriteForGP}
            bdoData={gp.bdoData}
            onWriteLetterForOffice={handleWriteLetterForOffice}
          />
        )}
      </main>

      {/* Persistent Modals & Overlays */}
      <ProfileEditor
        showProfileEditor={profile.showProfileEditor}
        setShowProfileEditor={profile.setShowProfileEditor}
        profile={profile.profile}
        updateProfile={profile.updateProfile}
        setProfile={profile.setProfile}
      />

      <LineByLineReader
        isReaderOpen={reader.isReaderOpen}
        onClose={reader.closeReader}
        readerLines={reader.readerLines}
        currentLineIndex={reader.currentLineIndex}
        onPlayLine={(idx) => reader.playLine(idx, false, doc.currentDoc?.language)}
        onPlayAll={() => reader.playAllLines(doc.currentDoc?.language)}
        onStop={reader.stopReaderPlayback}
      />

      <TemplatePickerModal
        showTemplates={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ElicitationFlow
        isEliciting={elicitation.isEliciting}
        slots={elicitation.slots}
        currentSlotIndex={elicitation.currentSlotIndex}
        currentSlot={elicitation.currentSlot}
        isConfirmingAll={elicitation.isConfirmingAll}
        onAnswer={elicitation.answerCurrentSlot}
        onGoBack={elicitation.goToPreviousSlot}
        onSpeakQuestion={elicitation.speakSlotQuestion}
        onSpeakConfirmAll={elicitation.speakConfirmAll}
        onConfirmAll={handleConfirmElicitation}
        onCancel={elicitation.stopElicitation}
        activeSlotCount={elicitation.unansweredSlotIndices.length + Object.keys(elicitation.slots).length}
        totalUserSlots={elicitation.totalUserSlots}
        isListening={voice.isListening}
        isRecording={voice.isRecording}
        transcript={voice.transcript}
        startListening={voice.startBrowserListening}
        stopListening={voice.stopBrowserListening}
        startServerSTT={voice.startServerSTTRecording}
        stopServerSTT={voice.stopServerSTTRecording}
        voiceInputLang={voice.voiceInputLang}
        setVoiceInputLang={voice.setVoiceInputLang}
      />

      {/* Sticky Bottom navigation menu */}
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

// Build smart enriched prompt
function buildEnrichedPrompt(
  rawTranscript: string,
  typeLabel: string,
  prof: any,
  today: string,
  toField: string,
  selectedGP: any,
  selectedOffice: any
): string {
  return `The user wants to write a letter about: "${rawTranscript}"

DOCUMENT TYPE: ${typeLabel}

TODAY'S DATE: ${today}

SMART RECIPIENT "TO" FIELD (The letter MUST start with this, do not write 'From:' at the top):
${toField}
${selectedGP ? `
SELECTED GRAM PANCHAYAT (use this exact formal "To" salutation and details in the letter - do not invent):
The Pradhan,
${selectedGP.official_gp_name} Gram Panchayat
${selectedGP.block} Block, Darjeeling District, West Bengal
${selectedGP.pradhan?.name && !selectedGP.pradhan.name.toLowerCase().includes('tbd') ? `Attn: Pradhan ${selectedGP.pradhan.name}` : ''}
${selectedGP.pradhan?.phone && !selectedGP.pradhan.phone.toLowerCase().includes('tbd') ? `Phone: ${selectedGP.pradhan.phone}` : ''}
${selectedGP.executive_assistant?.name && !selectedGP.executive_assistant.name.toLowerCase().includes('tbd') ? `EA: ${selectedGP.executive_assistant.name}` : ''}
` : ''}
${selectedOffice ? `
SELECTED OFFICE (use this exact formal "To" salutation and address details in the letter - do not invent):
${selectedOffice.salutation || selectedOffice.standard_address_format || selectedOffice.address || selectedOffice.name}
` : ''}

CRITICAL STRUCTURE RULE:
The generated letter MUST start with "To,". DO NOT include "From:" or the sender's name/address at the top. The sender's details must be placed EXCLUSIVELY in the signature block at the very bottom.

Exact letter format to output:
To,
[Recipient address block from above]

Date: ${today}

Subject: (clear, professional subject)

Respected Sir/Madam,

[Body paragraphs: intro, facts, and appeal]

Yours faithfully,

[Sender's signature block details exactly as provided below]

SENDER'S SIGNATURE BLOCK DETAILS (Place ONLY at the very bottom under "Yours faithfully,"):
${prof.fullName}
S/o ${prof.fatherName}
${prof.address}
Phone: ${prof.phone}

Keep the letter in clean formal English.
Do not add any explanation or extra text. Output the full letter.`;
}
