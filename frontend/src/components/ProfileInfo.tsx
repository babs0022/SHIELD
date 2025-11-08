"use client";

import React from 'react';
import styles from './ProfileSection.module.css';
import parentStyles from '../app/profile/Profile.module.css';

interface ProfileInfoProps {
  user: { uid: string };
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  return (
    <section className={parentStyles.section} id="profile">
      <h2 className={parentStyles.sectionTitle}>Profile Information</h2>
      <form className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="walletAddress">Wallet Address</label>
          <input
            id="walletAddress"
            type="text"
            value={user.uid || ''}
            disabled
            className={styles.input}
          />
        </div>
      </form>
    </section>
  );
}
