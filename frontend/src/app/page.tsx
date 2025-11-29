'use client';

import React from 'react';
import styles from './page.module.css';
import Pattern from '@/components/Pattern';
import SecureLinkForm from '@/components/SecureLinkForm';
import OnboardingInstructions from '@/components/OnboardingInstructions';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { useProfile } from '@/contexts/ProfileContext';

export default function HomePage() {
  const { setShowOnboarding } = useProfile();
  const searchParams = useSearchParams();
  const showTour = searchParams.get('tour') === 'true';

  const finishOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.formContainer}>
          <SecureLinkForm />
        </div>
        {showTour && <OnboardingInstructions onDismiss={finishOnboarding} />}
      </div>
    </main>
  );
}