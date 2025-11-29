// src/components/OnboardingModal.tsx
"use client";

import React, { useState, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import styles from './OnboardingModal.module.css';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function OnboardingModal() {
  const { showOnboarding, setShowOnboarding, updateProfile } = useProfile();
  const [step, setStep] = useState(1);

  // Step 1: Name and PFP
  const [displayName, setDisplayName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Survey
  const [primaryUse, setPrimaryUse] = useState<string | null>(null);
  const [howHeard, setHowHeard] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const toastId = toast.loading('Saving profile...');
      try {
        let pfpUrl = '';
        if (selectedFile) {
          const response = await fetch('/api/avatar/upload', {
            method: 'POST',
            headers: { 'content-type': selectedFile.type },
            body: selectedFile,
          });
          if (!response.ok) throw new Error('Failed to upload image.');
          const newBlob = await response.json();
          pfpUrl = newBlob.url;
        }
        await updateProfile({ displayName, pfpUrl });
        toast.success('Profile saved!', { id: toastId });
        setStep(2);
      } catch (error) {
        console.error(error);
        toast.error('Failed to save profile.', { id: toastId });
      }
    }
  };

  const finishOnboarding = async () => {
    if (primaryUse && howHeard) {
      const toastId = toast.loading('Submitting...');
      try {
        const token = localStorage.getItem('reown-siwe-token');
        await fetch('/api/user/submit-survey', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ primaryUse, howHeard }),
        });
        toast.success('Thank you for your feedback!', { id: toastId });
      } catch (error) {
        console.error('Failed to save survey:', error);
        toast.error('Could not save feedback.', { id: toastId });
      }
    }
    
    // Mark onboarding as complete regardless of survey submission
    try {
      const token = localStorage.getItem('reown-siwe-token');
      await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error);
    }
    setShowOnboarding(false);
  };

  if (!showOnboarding) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {step === 1 && (
          <div>
            <h2 className={styles.title}>Welcome to Shield!</h2>
            <p className={styles.subtitle}>Let's get your profile set up.</p>
            <div className={styles.avatarUploader}>
              <Image
                src={previewUrl || '/default-avatar.png'}
                alt="Profile Preview"
                width={80}
                height={80}
                className={styles.avatar}
              />
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/png, image/jpeg" />
              <button onClick={() => fileInputRef.current?.click()} className={styles.uploadButton}>
                Upload Picture
              </button>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="displayName">What should we call you?</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className={styles.input}
              />
            </div>
            <div className={styles.actions}>
              <button className={styles.submitButton} onClick={nextStep} disabled={!displayName}>
                Next
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className={styles.title}>Tell us about yourself</h2>
            <p className={styles.subtitle}>Your feedback will help us improve.</p>
            
            <div className={styles.inputGroup}>
              <label>What do you plan to use Shield for?</label>
              <div className={styles.options}>
                <button className={`${styles.option} ${primaryUse === 'personal' ? styles.selected : ''}`} onClick={() => setPrimaryUse('personal')}>Personal Use</button>
                <button className={`${styles.option} ${primaryUse === 'business' ? styles.selected : ''}`} onClick={() => setPrimaryUse('business')}>Business & Work</button>
                <button className={`${styles.option} ${primaryUse === 'developer' ? styles.selected : ''}`} onClick={() => setPrimaryUse('developer')}>Developer & API</button>
                <button className={`${styles.option} ${primaryUse === 'other' ? styles.selected : ''}`} onClick={() => setPrimaryUse('other')}>Something Else</button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="howHeard">How did you hear about us?</label>
              <div className={styles.selectWrapper}>
                <select id="howHeard" className={styles.select} value={howHeard || ''} onChange={(e) => setHowHeard(e.target.value)}>
                  <option value="" disabled>Select an option</option>
                  <option value="x-twitter">X (Twitter)</option>
                  <option value="friend">From a friend</option>
                  <option value="search-engine">Search Engine</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.skipButton} onClick={finishOnboarding}>Skip</button>
              <button className={styles.submitButton} onClick={finishOnboarding} disabled={!primaryUse || !howHeard}>Finish</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
