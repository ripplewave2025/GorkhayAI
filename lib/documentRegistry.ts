export type DocCategory =
  | "Government & Panchayat"
  | "Police & Legal"
  | "Bank & Finance"
  | "Personal & Family"
  | "Business & Shop"
  | "Community & Social"
  | "Other";

export interface SlotDef {
  key: string;                       // e.g. "monthlyIncome"
  label: string;                     // English label
  label_ne: string;                  // Nepali question / label
  type: "text" | "number" | "select" | "date";
  required: boolean;
  autoFillFrom?: string;             // Profile key like 'fullName', 'fatherName', 'address', etc.
  options?: string[];                // Choice list
  askIf?: string;                    // Conditional logic placeholder
}

export interface ElicitationSchema {
  purposeOptions: string[];
  requiredSlots: SlotDef[];
  bodySkeleton?: string;
  fewShotExamples?: string[];
  validationRules?: string[];
}

export interface DocumentTypeDef {
  key: string;                    // internal key, e.g. "caste-certificate"
  label: string;                  // display name
  category: DocCategory;
  subTypes?: string[];            // e.g. ["New", "Rectification", "Duplicate"]
  criticalFields?: string[];      // what we should ask the user for if missing
  // Keywords used for smart detection from spoken text (case-insensitive)
  keywords: string[];
  defaultSubject?: string;
  description?: string;
  elicitationSchema?: ElicitationSchema;
}

export const DOCUMENT_REGISTRY: DocumentTypeDef[] = [
  {
    key: "residential-certificate",
    label: "Residential Certificate",
    category: "Government & Panchayat",
    subTypes: ["New", "Rectification", "Duplicate"],
    criticalFields: [],
    keywords: ["residential", "residence", "बसोबास", "निवास", "घर", "certificate"],
    defaultSubject: "Request for Residential Certificate",
    elicitationSchema: {
      purposeOptions: [
        "Job Application (जागिर आवेदन)",
        "School/College Admission (भर्ना)",
        "Bank Loan/KYC (बैंक ऋण)",
        "Government Scheme (सरकारी योजना)",
        "Aadhaar Card (आधार कार्ड)",
        "Voter Card (भोटर कार्ड)",
        "Other (अन्य)"
      ],
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
          key: "durationOfStay",
          label: "Duration of Stay (Years)",
          label_ne: "तपाईं यो ठाउँमा कति वर्षदेखि बस्दै हुनुहुन्छ?",
          type: "number",
          required: true
        },
        {
          key: "purpose",
          label: "Purpose",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (के को लागि सिफारिस पत्र चाहिन्छ?)",
          type: "select",
          required: true,
          options: [
            "Job Application",
            "School/College Admission",
            "Bank Loan/KYC",
            "Government Scheme",
            "Aadhaar Card",
            "Voter Card",
            "Other"
          ]
        }
      ],
      validationRules: [
        "Ensure address contains block and district names."
      ]
    }
  },
  {
    key: "caste-certificate",
    label: "Caste Certificate",
    category: "Government & Panchayat",
    subTypes: ["New", "Rectification", "Duplicate"],
    criticalFields: ["caste", "subCaste"],
    keywords: ["caste", "जात", "जाति", "अनुसूचित", "certificate"],
    defaultSubject: "Application for Caste Certificate",
    elicitationSchema: {
      purposeOptions: [
        "Job Reservation (आरक्षण)",
        "Scholarship (छात्रवृत्ति)",
        "Government Scheme (योजना)",
        "School/College Admission (भर्ना)",
        "Other (अन्य)"
      ],
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
          key: "caste",
          label: "Caste / Tribe",
          label_ne: "तपाईंको जात/समुदाय के हो?",
          type: "text",
          required: true,
          autoFillFrom: "caste" // Can pull surname/caste from profile
        },
        {
          key: "subCaste",
          label: "Sub-Caste",
          label_ne: "तपाईंको उप-जात के हो? (यदि लागू भएमा)",
          type: "text",
          required: false,
          autoFillFrom: "subCaste"
        },
        {
          key: "purpose",
          label: "Purpose",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (के को लागि जात प्रमाणपत्र चाहिन्छ?)",
          type: "select",
          required: true,
          options: [
            "Job Reservation",
            "Scholarship",
            "Government Scheme",
            "School/College Admission",
            "Other"
          ]
        }
      ]
    }
  },
  {
    key: "income-certificate",
    label: "Income Certificate",
    category: "Government & Panchayat",
    subTypes: ["New", "Rectification"],
    criticalFields: [],
    keywords: ["income", "आय", "आम्दानी", "certificate"],
    defaultSubject: "Request for Income Certificate",
    elicitationSchema: {
      purposeOptions: [
        "Scholarship (छात्रवृत्ति)",
        "Government Scheme (योजना)",
        "Bank Loan (ऋण)",
        "Ration Card (राशन कार्ड)",
        "Other (अन्य)"
      ],
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
          key: "monthlyIncome",
          label: "Approx Monthly Income (Rs)",
          label_ne: "तपाईंको मासिक आम्दानी लगभग कति हो?",
          type: "number",
          required: true
        },
        {
          key: "occupation",
          label: "Occupation / Source of Income",
          label_ne: "तपाईंको मुख्य पेशा वा आम्दानीको स्रोत के हो?",
          type: "text",
          required: true
        },
        {
          key: "familySize",
          label: "Family Size (Number of Dependents)",
          label_ne: "तपाईंको परिवारमा कति जना सदस्य हुनुहुन्छ?",
          type: "number",
          required: true
        },
        {
          key: "purpose",
          label: "Purpose",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (के को लागि आय प्रमाणपत्र चाहिन्छ?)",
          type: "select",
          required: true,
          options: [
            "Scholarship",
            "Government Scheme",
            "Bank Loan",
            "Ration Card",
            "Other"
          ]
        }
      ]
    }
  },
  {
    key: "land-mutation",
    label: "Land Mutation Request",
    category: "Government & Panchayat",
    subTypes: ["New", "Rectification"],
    criticalFields: ["landDetails"],
    keywords: ["mutation", "म्युटेसन", "नामसारी", "land", "जग्गा"],
    defaultSubject: "Application for Land Mutation / Namasari",
    elicitationSchema: {
      purposeOptions: [
        "Inheritance from Ancestor (पैतृक नामसारी)",
        "Purchase of Land (जग्गा खरिद)",
        "Gift Deed (उपहार/दानपत्र)",
        "Other (अन्य)"
      ],
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
          key: "plotNumber",
          label: "Plot / Dag Number",
          label_ne: "जग्गाको प्लट वा दाग नम्बर के हो?",
          type: "text",
          required: true
        },
        {
          key: "khatianNumber",
          label: "Khatian Number",
          label_ne: "खतियान नम्बर के हो?",
          type: "text",
          required: true
        },
        {
          key: "previousOwner",
          label: "Previous Owner Name",
          label_ne: "जग्गाको पहिलेको मालिक को हुनुहुन्थ्यो?",
          type: "text",
          required: true
        },
        {
          key: "mutationReason",
          label: "Reason for Mutation",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (नामसारी गर्नुको कारण के हो?)",
          type: "select",
          required: true,
          options: [
            "Inheritance",
            "Purchase of Land",
            "Gift Deed",
            "Other"
          ]
        }
      ]
    }
  },
  {
    key: "bdo-complaint",
    label: "BDO Complaint / Application",
    category: "Government & Panchayat",
    subTypes: [],
    criticalFields: ["complaintDetails"],
    keywords: ["bdo", "block development", "बिडिओ", "complaint", "गुनासो", "application"],
    defaultSubject: "Application / Complaint to the Block Development Officer",
    elicitationSchema: {
      purposeOptions: [
        "Water Supply Issues (पानीको समस्या)",
        "Road & Drainage Damage (बाटो र नाली क्षति)",
        "Government Scheme Delay (योजना ढिलाइ)",
        "Street Light Repair (सडक बत्ती मर्मत)",
        "Social Pension Issues (पेन्सन समस्या)",
        "Other Complaint (अन्य गुनासो)"
      ],
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
          key: "address",
          label: "Full Address",
          label_ne: "तपाईंको ठेगाना के हो?",
          type: "text",
          required: true,
          autoFillFrom: "address"
        },
        {
          key: "complaintDetails",
          label: "Details of Complaint / Issue",
          label_ne: "तपाईंको समस्या के हो? छोटोमा बताउनुहोस्।",
          type: "text",
          required: true
        },
        {
          key: "purpose",
          label: "Issue Type",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (कस्तो प्रकारको समस्या हो?)",
          type: "select",
          required: true,
          options: [
            "Water Supply Issues",
            "Road & Drainage Damage",
            "Government Scheme Delay",
            "Street Light Repair",
            "Social Pension Issues",
            "Other Complaint"
          ]
        }
      ]
    }
  },
  {
    key: "fir-request",
    label: "FIR Request",
    category: "Police & Legal",
    subTypes: [],
    criticalFields: ["incidentDetails"],
    keywords: ["fir", "एफआईआर", "police", "complaint", "theft", "incident"],
    defaultSubject: "Request to Register FIR",
    elicitationSchema: {
      purposeOptions: [
        "Theft / Robbery (चोरी)",
        "Lost Important Documents (कागजात हराएको)",
        "Physical Harassment / Assault (उत्पीडन/कुटपिट)",
        "Land & Property Dispute (जग्गा विवाद)",
        "Threats / Domestic Harassment (धम्की/घरेलु हिंसा)",
        "Other Incident (अन्य)"
      ],
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
          label: "Father's Name",
          label_ne: "बुबाको नाम के हो?",
          type: "text",
          required: true,
          autoFillFrom: "fatherName"
        },
        {
          key: "address",
          label: "Address",
          label_ne: "ठेगाना के हो?",
          type: "text",
          required: true,
          autoFillFrom: "address"
        },
        {
          key: "incidentDate",
          label: "Incident Date",
          label_ne: "घटना कहिले भएको हो? (गते वा दिन)",
          type: "text",
          required: true
        },
        {
          key: "incidentDetails",
          label: "Description of Incident",
          label_ne: "के भएको हो? विस्तृत विवरण दिनुहोस्।",
          type: "text",
          required: true
        },
        {
          key: "purpose",
          label: "Incident Category",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (के को बारेमा निवेदन हो?)",
          type: "select",
          required: true,
          options: [
            "Theft / Robbery",
            "Lost Important Documents",
            "Physical Harassment / Assault",
            "Land & Property Dispute",
            "Threats / Domestic Harassment",
            "Other Incident"
          ]
        }
      ]
    }
  },
  {
    key: "invoice",
    label: "Invoice / Bill",
    category: "Business & Shop",
    subTypes: [],
    criticalFields: ["items"],
    keywords: ["invoice", "bill", "बिल", "इनभ्वाइस"],
    defaultSubject: "Invoice / Bill",
    elicitationSchema: {
      purposeOptions: [
        "Homestay Service Rent (होमस्टे किराया)",
        "Shop Sale Bill (पसलको सामान बिक्री)",
        "Service Delivery Charge (सेवा शुल्क)",
        "Other Invoice (अन्य)"
      ],
      requiredSlots: [
        {
          key: "clientName",
          label: "Customer / Client Name",
          label_ne: "ग्राहकको नाम के हो?",
          type: "text",
          required: true
        },
        {
          key: "items",
          label: "Items Sold / Services Provided",
          label_ne: "तपाईंले के सामान वा सेवा बेच्नुभयो? र प्रति दर कति हो?",
          type: "text",
          required: true
        },
        {
          key: "amount",
          label: "Total Amount (Rs)",
          label_ne: "जम्मा बिल रकम कति हो?",
          type: "number",
          required: true
        },
        {
          key: "purpose",
          label: "Bill Type",
          label_ne: "K ko lagi certificate/application lekhnuhudaicha? (कस्तो प्रकारको बिल हो?)",
          type: "select",
          required: true,
          options: [
            "Homestay Service Rent",
            "Shop Sale Bill",
            "Service Delivery Charge",
            "Other Invoice"
          ]
        }
      ]
    }
  },
  {
    key: "dm-complaint",
    label: "DM Complaint / Application",
    category: "Government & Panchayat",
    subTypes: [],
    criticalFields: ["complaintDetails"],
    keywords: ["dm", "district magistrate", "district collector", "डीएम", "complaint", "गुनासो"],
    defaultSubject: "Application / Complaint to the District Magistrate",
  },
  {
    key: "gd-entry",
    label: "GD Entry Request",
    category: "Police & Legal",
    subTypes: [],
    criticalFields: ["incidentDetails"],
    keywords: ["gd", "general diary", "जीडी", "police"],
    defaultSubject: "Request for GD Entry",
  },
  {
    key: "affidavit",
    label: "Affidavit",
    category: "Police & Legal",
    subTypes: ["General", "Name", "Address", "Other"],
    criticalFields: [],
    keywords: ["affidavit", "शपथ", "affidavit"],
    defaultSubject: "Affidavit",
  },
  {
    key: "noc",
    label: "NOC (No Objection Certificate)",
    category: "Government & Panchayat",
    subTypes: ["Land", "Building", "Other"],
    criticalFields: [],
    keywords: ["noc", "no objection", "एनओसी"],
    defaultSubject: "Request for No Objection Certificate (NOC)",
  },
  {
    key: "consent-letter",
    label: "Consent Letter (for minor)",
    category: "Personal & Family",
    subTypes: ["Travel", "Medical", "Exam", "Other"],
    criticalFields: ["purpose", "minorName"],
    keywords: ["consent", "सहमति", "minor", "child", "बच्चा", "travel", "surgery"],
    defaultSubject: "Consent Letter",
  },
];

// Smart keyword detection
export function detectDocumentType(transcript: string): {
  def: DocumentTypeDef | null;
  subType?: string;
  raw: string;
} {
  const lower = transcript.toLowerCase();

  for (const def of DOCUMENT_REGISTRY) {
    for (const kw of def.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        // Try to detect sub-type
        let subType: string | undefined;
        if (def.subTypes?.length) {
          if (/(नयाँ|new|fresh)/i.test(transcript)) subType = "New";
          else if (/(सच्याउनु|rectif|correction|update|पुरानो)/i.test(transcript)) subType = "Rectification";
          else if (/(duplicate|नक्कल|copy)/i.test(transcript)) subType = "Duplicate";
        }
        return { def, subType, raw: transcript };
      }
    }
  }
  return { def: null, raw: transcript };
}

// Simple smart "To" resolver using profile location and selected BDO/GP data
export function resolveToField(
  officeMention: string,
  profile: import("./profile").UserProfile,
  selectedGP?: any,
  bdoData?: any,
  selectedOffice?: any
): string {
  if (selectedOffice) {
    return selectedOffice.salutation || selectedOffice.standard_address_format || selectedOffice.address || selectedOffice.name;
  }
  const mention = officeMention.toLowerCase();

  // 1. Write to BDO
  if (mention.includes("bdo") || mention.includes("block development")) {
    const blockName = selectedGP ? selectedGP.block : (profile.block || "");
    if (blockName && bdoData && bdoData.blocks) {
      const nameLower = blockName.toLowerCase().replace(/–/g, "-").trim();
      const matched = bdoData.blocks.find((b: any) => {
        const bName = b.block_name.toLowerCase().replace(/–/g, "-").trim();
        return bName.includes(nameLower) || nameLower.includes(bName);
      });
      if (matched && matched.standard_address_format) {
        let addr = matched.standard_address_format;
        if (matched.bdo?.name) {
          addr = `The Block Development Officer\n(Attn: Shri Manoj Kumar Pahari / BDO)\n` + addr.substring(addr.indexOf('\n') + 1);
        }
        return matched.standard_address_format;
      }
    }
    const block = blockName || "your Block";
    const dist = profile.district ? `, ${profile.district}` : "";
    return `The Block Development Officer\n${block} Block\nDist. Darjeeling, West Bengal`;
  }

  // 2. Write to District Magistrate
  if (mention.includes("dm") || mention.includes("district magistrate") || mention.includes("collector")) {
    const dist = profile.district || "Darjeeling";
    return `The District Magistrate\n${dist} District, West Bengal`;
  }

  // 3. Write to GP Panchayat / Pradhan
  if (mention.includes("panchayat") || mention.includes("gram") || mention.includes("pradhan")) {
    if (selectedGP) {
      let sal = `The Pradhan,\n${selectedGP.official_gp_name} Gram Panchayat,\n${selectedGP.block} Block, Dist. Darjeeling, West Bengal`;
      if (selectedGP.pradhan?.name && !selectedGP.pradhan.name.toLowerCase().includes('tbd')) {
        sal = `The Pradhan\n(Attn: ${selectedGP.pradhan.name})\n${selectedGP.official_gp_name} Gram Panchayat\n${selectedGP.block} Block, Dist. Darjeeling, West Bengal`;
      }
      return sal;
    }
    const gp = profile.gramPanchayat || "Gram Panchayat";
    const block = profile.block ? `, ${profile.block} Block` : "";
    return `The Pradhan / Secretary\n${gp}${block}\nDist. Darjeeling, West Bengal`;
  }

  // 4. Write to Police Station
  if (mention.includes("police") || mention.includes("police station") || mention.includes("thana") || mention.includes("fir") || mention.includes("gd")) {
    return `The Officer In-Charge\n[Local Police Station]\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 5. Write to SDO
  if (mention.includes("sdo") || mention.includes("sub-divisional") || mention.includes("sub divisional")) {
    return `The Sub-Divisional Officer\n[Sub-Division Name]\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 6. Write to Municipality
  if (mention.includes("municipality") || mention.includes("municipal") || mention.includes("chairman") || mention.includes("नगरपालिका")) {
    return `The Chairman\n[Municipality Name] Municipality\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 7. Write to Bank
  if (mention.includes("bank") || mention.includes("sbi") || mention.includes("pnb") || mention.includes("loan") || mention.includes("kyc")) {
    return `The Branch Manager\n[Bank Name]\n[Branch Name], Dist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 8. Write to Hospital / Health Office
  if (mention.includes("hospital") || mention.includes("health") || mention.includes("cmoh") || mention.includes("medical") || mention.includes("doctor")) {
    return `The Superintendent / Chief Medical Officer\n[Hospital Name]\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 9. Write to School / College
  if (mention.includes("school") || mention.includes("college") || mention.includes("principal") || mention.includes("headmaster") || mention.includes("tc") || mention.includes("bonafide")) {
    return `The Principal / Headmaster\n[School / College Name]\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 10. Write to Electricity Board
  if (mention.includes("electricity") || mention.includes("wbsedcl") || mention.includes("power") || mention.includes("बिजली")) {
    return `The Assistant Engineer\nWBSEDCL, ${profile.district || "Darjeeling"} Division\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 11. Write to Telecom
  if (mention.includes("telecom") || mention.includes("bsnl") || mention.includes("phone") || mention.includes("broadband")) {
    return `The Sub-Divisional Engineer\nBSNL, ${profile.district || "Darjeeling"}\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 12. Write to Railway
  if (mention.includes("railway") || mention.includes("train") || mention.includes("njp") || mention.includes("station")) {
    return `The Station Master\nNew Jalpaiguri (NJP) Railway Station\nSiliguri, Dist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 13. Write to Post Office
  if (mention.includes("post office") || mention.includes("postmaster")) {
    return `The Postmaster\nHead Post Office\n${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 14. Write to Consumer Forum
  if (mention.includes("consumer") || mention.includes("forum") || mention.includes("complaint")) {
    return `The President\nDistrict Consumer Disputes Redressal Commission\n${profile.district || "Darjeeling"}, West Bengal`;
  }

  // 15. RTI
  if (mention.includes("rti") || mention.includes("right to information") || mention.includes("information officer")) {
    return `The Public Information Officer\n[Concerned Department]\nDist. ${profile.district || "Darjeeling"}, West Bengal`;
  }

  // Fallback
  return `[Concerned Authority / Office Name]\n${profile.district || profile.block || "Your Area"}`;
}
