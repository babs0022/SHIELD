// src/components/OnboardingSurvey.tsx
"use client";

import React, { useState } from 'react';
import styles from './OnboardingSurvey.module.css';

interface OnboardingSurveyProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingSurvey({ onComplete, onSkip }: OnboardingSurveyProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = () => {
    // Here, you could save the user's response to your database if you wish
    // For now, we'll just call the onComplete callback
    onComplete();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Welcome to Shield!</h2>
      <p className={styles.subtitle}>To help us improve, please tell us what you plan to use Shield for:</p>
      
      <div className={styles.options}>
        <button
          className={`${styles.option} ${selectedOption === 'personal' ? styles.selected : ''}`}
          onClick={() => setSelectedOption('personal')}
        >
          Personal Use
        </button>
        <button
          className={`${styles.option} ${selectedOption === 'business' ? styles.selected : ''}`}
          onClick={() => setSelectedOption('business')}
        >
          Business & Work
        </button>
        <button
          className={`${styles.option} ${selectedOption === 'developer' ? styles.selected : ''}`}
          onClick={() => setSelectedOption('developer')}
        >
          Developer & API
        </button>
        <button
          className={`${styles.option} ${selectedOption === 'other' ? styles.selected : ''}`}
          onClick={() => setSelectedOption('other')}
        >
          Something Else
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.skipButton} onClick={onSkip}>
          Skip for Now
        </button>
        <button className={styles.submitButton} onClick={handleSubmit} disabled={!selectedOption}>
          Submit
        </button>
      </div>
    </div>
  );
}