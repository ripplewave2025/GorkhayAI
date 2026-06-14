import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Document, DocLanguage, generateId, deriveTitleFromContent } from "@/lib/types";
import { loadDocuments, addOrUpdateDocument, deleteDocument as deleteFromStorage } from "@/lib/storage";

interface UseDocumentOptions {
  outputLang: DocLanguage;
  setOutputLang: (lang: DocLanguage) => void;
  onDocumentReset: () => void;
  onDocumentLoad?: (doc: Document) => void;
  onDocumentChange?: (doc: Document) => void;
  onRefineSuccess?: () => void;
}

export function useDocument({
  outputLang,
  setOutputLang,
  onDocumentReset,
  onDocumentLoad,
  onDocumentChange,
  onRefineSuccess,
}: UseDocumentOptions) {
  // Current working document
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Gallery
  const [gallery, setGallery] = useState<Document[]>([]);
  const [gallerySearch, setGallerySearch] = useState("");

  // Manual editing
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [manualDraft, setManualDraft] = useState("");

  // Load gallery on mount
  useEffect(() => {
    setGallery(loadDocuments());
  }, []);

  const filteredGallery = useMemo(() => {
    if (!gallerySearch.trim()) return gallery;
    const q = gallerySearch.toLowerCase();
    return gallery.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
    );
  }, [gallery, gallerySearch]);

  const letterParagraphs = useMemo(() => {
    if (!currentDoc?.content) return [];
    return currentDoc.content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [currentDoc]);

  // Generation
  const generateDocument = useCallback(async (prompt: string, lang: DocLanguage, templateType?: string) => {
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          language: lang,
          templateType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.content) {
        const base = data.error || "Failed to generate";
        const details = data.details ? ` - ${data.details}` : "";
        throw new Error(base + details);
      }

      const now = new Date().toISOString();
      const newDoc: Document = {
        id: generateId(),
        title: data.title || deriveTitleFromContent(data.content),
        content: data.content,
        language: lang,
        createdAt: now,
        updatedAt: now,
        templateType,
      };

      setCurrentDoc(newDoc);
      setOutputLang(lang);
      setIsEditingManually(false);

      toast.success(lang === "ne" ? "पत्र तयार भयो!" : "Letter ready!");
      if (onDocumentChange) onDocumentChange(newDoc);
    } catch (err: any) {
      console.error(err);
      const msg = "Could not create the document. " + (err.message || "");
      toast.error(msg.length > 120 ? msg.substring(0, 117) + "..." : msg);
      toast.info("Check the terminal running `npm run dev` for 'LLM error' logs with exact details from NVIDIA.");
    } finally {
      setIsGenerating(false);
    }
  }, [setOutputLang, onDocumentChange]);

  // Refinement
  const refineDocument = useCallback(async (instruction: string) => {
    if (!currentDoc) return;

    if (!instruction.trim()) {
      toast.error("Please say or type what you want to change.");
      return;
    }

    setIsRefining(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentContent: currentDoc.content,
          instruction,
          language: currentDoc.language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.content) throw new Error(data.error || "Refine failed");

      const updated: Document = {
        ...currentDoc,
        content: data.content,
        updatedAt: new Date().toISOString(),
        title: deriveTitleFromContent(data.content),
      };

      setCurrentDoc(updated);
      toast.success("Document refined");
      if (onDocumentChange) onDocumentChange(updated);
      if (onRefineSuccess) onRefineSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error("Refinement failed. " + (err.message || ""));
    } finally {
      setIsRefining(false);
    }
  }, [currentDoc, onDocumentChange, onRefineSuccess]);

  // Manual Editing Actions
  const enterManualEdit = useCallback(() => {
    if (!currentDoc) return;
    setManualDraft(currentDoc.content);
    setIsEditingManually(true);
  }, [currentDoc]);

  const cancelManualEdit = useCallback(() => {
    setIsEditingManually(false);
    setManualDraft("");
  }, []);

  const saveManualEdit = useCallback(() => {
    if (!currentDoc) return;
    const newContent = manualDraft.trim();
    if (!newContent) {
      toast.error("Document cannot be empty.");
      return;
    }
    const updated: Document = {
      ...currentDoc,
      content: newContent,
      updatedAt: new Date().toISOString(),
      title: deriveTitleFromContent(newContent),
    };
    setCurrentDoc(updated);
    setIsEditingManually(false);
    setManualDraft("");
    toast.success("Changes saved");
    if (onDocumentChange) onDocumentChange(updated);
  }, [currentDoc, manualDraft, onDocumentChange]);

  // Document Gallery Actions
  const saveCurrentToGallery = useCallback(() => {
    if (!currentDoc) return;
    const saved = addOrUpdateDocument(currentDoc);
    setGallery(saved);
    toast.success("Saved to My Documents");
  }, [currentDoc]);

  const loadDocumentIntoCompose = useCallback((doc: Document) => {
    setCurrentDoc({ ...doc });
    setOutputLang(doc.language);
    setIsEditingManually(false);
    setManualDraft("");
    toast.info("Document opened for editing");
    if (onDocumentLoad) onDocumentLoad(doc);
  }, [setOutputLang, onDocumentLoad]);

  const deleteFromGallery = useCallback((id: string) => {
    if (!confirm("Delete this document permanently?")) return;
    const remaining = deleteFromStorage(id);
    setGallery(remaining);
    if (currentDoc?.id === id) {
      setCurrentDoc(null);
    }
    toast.success("Document deleted");
  }, [currentDoc]);

  const newDocument = useCallback(() => {
    setCurrentDoc(null);
    setIsEditingManually(false);
    setManualDraft("");
    onDocumentReset();
  }, [onDocumentReset]);

  return {
    currentDoc,
    setCurrentDoc,
    isGenerating,
    isRefining,
    gallery,
    setGallery,
    gallerySearch,
    setGallerySearch,
    filteredGallery,
    letterParagraphs,
    isEditingManually,
    manualDraft,
    setManualDraft,
    generateDocument,
    refineDocument,
    enterManualEdit,
    cancelManualEdit,
    saveManualEdit,
    saveCurrentToGallery,
    loadDocumentIntoCompose,
    deleteFromGallery,
    newDocument,
  };
}
