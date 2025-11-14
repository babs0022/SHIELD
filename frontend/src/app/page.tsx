'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import SecureLinkForm from "@/components/SecureLinkForm";
import Pattern from "@/components/Pattern";
import OnboardingInstructions from '@/components/OnboardingInstructions';

const ONBOARDING_COMPLETED_KEY = 'shield-onboarding-completed';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDismiss = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setShowOnboarding(false);
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {showOnboarding && <OnboardingInstructions onDismiss={handleOnboardingDismiss} />}
      <main className="p-4">
        <Pattern />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <SecureLinkForm />
        </div>
      </main>
    </>
  );
}
