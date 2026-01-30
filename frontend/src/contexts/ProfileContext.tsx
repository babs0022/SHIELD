"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface Profile {
  displayName: string;
  pfpUrl: string;
  tier: string;
  subscriptionExpiresAt: string | null;
}

interface ProfileContextType {
  profile: Profile | null;
  userTier: string | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (newProfile: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('reown-siwe-token');
      const response = await fetch(`/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }

      const tierResponse = await fetch(`/api/user/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (tierResponse.ok) {
        const data = await tierResponse.json();
        setUserTier(data.tier);
      } else {
        setUserTier('free');
      }

    } catch (error) {
      setProfile(null);
      setUserTier('free');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (newProfile: Partial<Profile>) => {
    const toastId = toast.loading('Updating profile...');
    try {
      const token = localStorage.getItem('reown-siwe-token');
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile.');
      }

      await fetchProfile();
      toast.success('Profile updated successfully!', { id: toastId });
    } catch (error) {
      toast.error('Could not update profile.', { id: toastId });
    }
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, userTier, isLoading, fetchProfile, updateProfile }}>
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



