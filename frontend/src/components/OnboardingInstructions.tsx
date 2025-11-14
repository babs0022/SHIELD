'use client';

import React from 'react';
import styles from './OnboardingInstructions.module.css';

interface OnboardingInstructionsProps {
  onDismiss: () => void;
}

export default function OnboardingInstructions({ onDismiss }: OnboardingInstructionsProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>👋 Welcome to Shield!</h2>
        <p className={styles.message}>
          Create secure, shareable links for your files and messages with end-to-end encryption.
        </p>
        <div className={styles.steps}>
          <p><strong>How it works:</strong></p>
          <ol>
            <li><span>1.</span> Upload a file or paste text.</li>
            <li><span>2.</span> Set the recipient's wallet address.</li>
            <li><span>3.</span> Create your secure link and share it!</li>
          </ol>
        </div>
        <button onClick={onDismiss} className={styles.button}>
          Get Started
        </button>
      </div>
    </div>
  );
}
