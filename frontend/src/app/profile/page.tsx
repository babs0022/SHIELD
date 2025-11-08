"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import styles from './Profile.module.css';
import Pattern from '@/components/Pattern';
import ProfileInfo from '@/components/ProfileInfo';
import MyLinks from '@/components/MyLinks';
import SecuritySettings from '@/components/SecuritySettings';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/'); // Redirect to home if not connected
    }
  }, [isConnected, router]);

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

  if (!isConnected) {
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
        
        <ProfileInfo user={{ uid: address || '' }} />
        <MyLinks />
        <SecuritySettings />

      </div>
    </main>
  );
}
