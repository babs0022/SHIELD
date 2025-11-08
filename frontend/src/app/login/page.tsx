"use client";

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Since Firebase auth is removed, the primary auth is wallet-based (SIWE).
    // This page might not be necessary, or it should integrate with wagmi/siwe.
    // For now, we'll just redirect to the home page where wallet connection should be handled.
    router.push('/');
  }, [router]);

  return (
    <main className={styles.container}>
      <p>Redirecting...</p>
    </main>
  );
}
