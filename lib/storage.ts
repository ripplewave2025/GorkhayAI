import { Document } from "./types";

const STORAGE_KEY = "gorkhay_documents_v1";

export function loadDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Document[];
    return [];
  } catch {
    return [];
  }
}

export function saveDocuments(docs: Document[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // storage full or private mode — ignore gracefully
  }
}

export function addOrUpdateDocument(doc: Document): Document[] {
  const docs = loadDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    docs[idx] = { ...doc, updatedAt: new Date().toISOString() };
  } else {
    docs.unshift(doc); // newest first
  }
  saveDocuments(docs);
  return docs;
}

export function deleteDocument(id: string): Document[] {
  const docs = loadDocuments().filter((d) => d.id !== id);
  saveDocuments(docs);
  return docs;
}

export function getDocument(id: string): Document | undefined {
  return loadDocuments().find((d) => d.id === id);
}
