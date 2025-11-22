'use client';

import React from 'react';
import styles from './page.module.css';
import Pattern from '@/components/Pattern';
import SecureLinkForm from '@/components/SecureLinkForm';
import OnboardingInstructions from '@/components/OnboardingInstructions';
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const searchParams = useSearchParams();
  const showTour = searchParams.get('tour') === 'true';

  return (
    <main className={styles.container}>
      <Pattern />
      <div className={styles.content}>
        <div className={styles.formContainer}>
          <SecureLinkForm />
        </div>
        {showTour && <OnboardingInstructions onDismiss={() => {}} />}
      </div>
    </main>
  );
}
