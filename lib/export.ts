import jsPDF from "jspdf";
import { Document } from "./types";

export function downloadText(doc: Document) {
  const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(doc.title)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPDF(doc: Document) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const lines = doc.content.split("\n");
  let y = 25;

  // Title-ish header
  pdf.setFontSize(14);
  pdf.text(doc.title, margin, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(doc.language === "ne" ? "नेपालीमा लेखिएको" : "Written in English", margin, y);
  y += 8;
  pdf.setTextColor(0);

  pdf.setFontSize(11);

  for (const rawLine of lines) {
    const text = rawLine.trim();
    if (!text) {
      y += 4; // paragraph break
      continue;
    }

    const wrapped = pdf.splitTextToSize(text, maxWidth);
    for (const w of wrapped) {
      if (y > 270) {
        pdf.addPage();
        y = 25;
      }
      pdf.text(w, margin, y);
      y += 6.5;
    }
    y += 2; // extra space after original line
  }

  const filename = sanitizeFilename(doc.title);
  pdf.save(`${filename}.pdf`);
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function shareToWhatsApp(doc: Document) {
  const text = `${doc.title}\n\n${doc.content}\n\n— Created with Gorkhay AI`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}
