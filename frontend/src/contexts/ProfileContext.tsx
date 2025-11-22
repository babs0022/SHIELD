"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface Profile {
  displayName: string;
  pfpUrl: string;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  fetchProfile: (address: string) => Promise<void>;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchProfile = useCallback(async (address: string) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/profile?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, fetchProfile, showOnboarding, setShowOnboarding }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
