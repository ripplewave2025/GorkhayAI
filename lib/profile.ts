export interface UserProfile {
  fullName: string;
  fatherName: string;
  address: string;          // Full address line(s)
  phone: string;
  age?: string;
  // Location for smart "To" resolution
  block?: string;           // e.g. "Takdah"
  district?: string;        // e.g. "Darjeeling"
  gramPanchayat?: string;
  // Optional extra context
  caste?: string;
  subCaste?: string;
}

const STORAGE_KEY = "gorkhay_user_profile_v1";

export const DEFAULT_PROFILE: UserProfile = {
  fullName: "[Your Full Name]",
  fatherName: "[Father's / Husband's Name]",
  address: "[Village / Ward, Municipality / Block, District]",
  phone: "[Phone Number]",
  age: "",
  block: "Takdah",
  district: "Darjeeling",
  gramPanchayat: "",
  caste: "",
  subCaste: "",
};

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

export function getTodayDate(): string {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }); // e.g. "11 June 2026"
}

/**
 * Checks if critical profile fields have real values (not placeholders).
 * Returns true only if fullName, fatherName, address, and phone are set.
 */
export function isProfileComplete(profile: UserProfile): boolean {
  const requiredFields: (keyof UserProfile)[] = ["fullName", "fatherName", "address", "phone"];
  return requiredFields.every((key) => {
    const val = profile[key];
    return val && typeof val === "string" && val.trim().length > 0 && !val.startsWith("[");
  });
}

