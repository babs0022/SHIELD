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
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { address, status } = useAccount();
  const { isLoading: isProfileLoading } = useProfile();
  const router = useRouter();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    if (status !== 'connecting' && status !== 'reconnecting' && !isProfileLoading) {
      setAuthCheckComplete(true);
    }
  }, [status, isProfileLoading]);

  useEffect(() => {
    if (authCheckComplete && status === 'disconnected') {
      router.push('/');
    }
  }, [authCheckComplete, status, router]);

  if (!authCheckComplete || status === 'disconnected') {
    return (
      <main className={styles.container}>
        <p>Loading profile...</p>
      </main>
    );
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
