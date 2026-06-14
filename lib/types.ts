export type DocLanguage = 'en' | 'ne';

export interface Document {
  id: string;
  title: string;
  content: string;
  language: DocLanguage;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  templateType?: string; // e.g. "Residential certificate"
}

export interface ApplicationCategory {
  name: string;
  items: string[];
}

export const APPLICATION_CATEGORIES: ApplicationCategory[] = [
  {
    name: "Government & Panchayat",
    items: [
      "Residential certificate",
      "Income certificate",
      "Caste certificate",
      "Domicile certificate",
      "Character certificate",
      "NOC",
      "Land mutation request",
      "RTI application",
      "BDO complaint",
      "DM complaint",
      "Ration card application",
      "Voter ID correction",
      "Aadhar correction letter",
      "Water connection request",
      "Electricity connection request",
      "Road repair complaint",
      "Drainage complaint",
      "Forest department NOC",
      "Fire NOC",
      "Building permission request",
    ],
  },
  {
    name: "Police & Legal",
    items: [
      "FIR request",
      "GD entry request",
      "Bail application",
      "Affidavit",
      "Sworn statement",
      "Legal notice",
      "Rent agreement",
      "Property dispute complaint",
      "Harassment complaint",
      "Domestic violence complaint",
      "Missing person report",
      "Theft complaint",
      "Noise complaint",
    ],
  },
  {
    name: "Bank & Finance",
    items: [
      "Account opening request",
      "Cheque book request",
      "Loan application",
      "Loan NOC",
      "Loan closure letter",
      "Bank account transfer",
      "KYC update letter",
      "Fixed deposit request",
      "Insurance claim letter",
      "Pension request",
      "EPF withdrawal letter",
    ],
  },
  {
    name: "School & College",
    items: [
      "Leave application (student)",
      "Leave application (teacher)",
      "TC (transfer certificate) request",
      "Bonafide certificate request",
      "Scholarship application",
      "Fee waiver request",
      "Admission request letter",
      "Examination form covering letter",
      "Re-evaluation request",
      "Character certificate from school",
      "Sports NOC",
      "Hostel application",
    ],
  },
  {
    name: "Job & Employment",
    items: [
      "Job application",
      "Cover letter",
      "Experience certificate request",
      "Relieving letter request",
      "Salary certificate request",
      "Increment request",
      "Promotion request",
      "Transfer request",
      "Resignation letter",
      "Complaint against employer",
      "Reference letter request",
      "Internship application",
      "Apprenticeship application",
    ],
  },
  {
    name: "Health",
    items: [
      "Medical leave application",
      "Disability certificate application",
      "Hospital complaint",
      "Blood bank request",
      "Ambulance request letter",
      "Medical reimbursement claim",
      "Health scheme enrollment",
    ],
  },
  {
    name: "Land & Property",
    items: [
      "Mutation application",
      "Partition deed request",
      "NOC from landlord",
      "Eviction notice",
      "Rent receipt request",
      "Property tax objection",
      "Boundary dispute complaint",
      "Inheritance claim letter",
      "Will (simple)",
    ],
  },
  {
    name: "Business & Shop",
    items: [
      "Invoice / bill",
      "Quotation letter",
      "Purchase order",
      "Delivery challan",
      "Business proposal",
      "Partnership agreement (simple)",
      "Shop license application",
      "Trade license renewal",
      "GST registration request",
      "Supplier complaint",
      "Customer refund request",
    ],
  },
  {
    name: "Community & Social",
    items: [
      "Meeting notice",
      "Meeting agenda",
      "Minutes of meeting",
      "Event permission letter",
      "Sports event application",
      "Cultural program permission",
      "Donation request letter",
      "Sponsorship request",
      "Condolence letter",
      "Congratulations letter",
      "Invitation letter (official)",
    ],
  },
  {
    name: "Personal & Family",
    items: [
      "Marriage registration application",
      "Birth registration",
      "Death registration",
      "Name change affidavit",
      "Guardianship letter",
      "Consent letter (for minor's travel, surgery, exam)",
      "Succession certificate application",
      "Ration card name addition",
      "Pension transfer after death of spouse",
    ],
  },
  {
    name: "Media & Complaints",
    items: [
      "Letter to newspaper editor",
      "Complaint to consumer forum",
      "Complaint to electricity board",
      "Complaint to telecom company",
      "Complaint to railway",
      "Complaint to post office",
      "Complaint to municipality",
    ],
  },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    // Stable, locale-independent formatting (prevents hydration mismatch)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return iso;
  }
}

export function deriveTitleFromContent(content: string, max = 60): string {
  const first = content.trim().split(/\n+/)[0] || "Untitled letter";
  const cleaned = first.replace(/^[^a-zA-Z\u0900-\u097F]+/, "").trim();
  if (!cleaned) return "Untitled letter";
  return cleaned.length > max ? cleaned.slice(0, max - 1) + "…" : cleaned;
}

/** Narration version stored for "Read in Nepali" / summary.
 *  Each time the user reads (or refines after a prior read), we create a new version
 *  with the (re)phrased Nepali text + the ElevenLabs (or fallback) audio as base64 MP3.
 *  This powers the version picker, Prev/Next, Play stored audio, and Download MP3.
 */
export interface NarrationVersion {
  id: number;
  text: string;
  audioBase64: string | null;
  timestamp: string; // ISO
}
