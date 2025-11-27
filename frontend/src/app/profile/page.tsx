"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useProfile } from '@/contexts/ProfileContext';
import styles from './Profile.module.css';
import Pattern from '@/components/Pattern';
import ProfileInfo from '@/components/ProfileInfo';
import MyLinks from '@/components/MyLinks';
import StatsCard from '@/components/StatsCard';
import SecuritySettings from '@/components/SecuritySettings';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { address, status } = useAccount();
  const { isLoading: isProfileLoading } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    // The authentication check is complete only when wagmi is no longer connecting AND the profile is no longer loading.
    if (status !== 'connecting' && status !== 'reconnecting' && !isProfileLoading) {
      setAuthCheckComplete(true);
    }
  }, [status, isProfileLoading]);

  useEffect(() => {
    // Only redirect if the authentication check is complete AND the user is definitively disconnected.
    if (authCheckComplete && status === 'disconnected') {
      router.push('/');
    }
  }, [authCheckComplete, status, router]);

  const finishOnboarding = () => {
    setShowOnboarding(false);
    router.push('/?tour=true');
  };

  const handleSurveyComplete = async () => {
    if (address) {
      toast.success('Thank you for your feedback!');
      finishOnboarding();
    }
  };

  const handleSurveySkip = async () => {
    if (address) {
      finishOnboarding();
    }
  };

  // Display a loading message until the authentication check is complete.
  if (!authCheckComplete) {
    return (
      <main className={styles.container}>
        <p>Loading profile...</p>
      </main>
    );
  }

  if (showOnboarding) {
    return <OnboardingSurvey onComplete={handleSurveyComplete} onSkip={handleSurveySkip} />;
  }

  return (
    <main className={styles.container}>
      <Pattern />
      <div className={styles.content}>
        <h1 className={styles.title}>My Profile</h1>
        <StatsCard />
        <ProfileInfo user={{ uid: address || '' }} />
        <MyLinks />
        <SecuritySettings />
      </div>
    </main>
  );
}
