import { useState, useEffect } from "react";
import { UserProfile, loadProfile, saveProfile, DEFAULT_PROFILE } from "@/lib/profile";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Load profile on mount
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  function updateProfile(partial: Partial<UserProfile>) {
    const updated = { ...profile, ...partial };
    setProfile(updated);
    saveProfile(updated);
  }

  return {
    profile,
    setProfile,
    showProfileEditor,
    setShowProfileEditor,
    updateProfile,
  };
}
