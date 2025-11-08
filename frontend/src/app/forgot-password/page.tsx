"use client";

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import styles from './ForgotPassword.module.css';
import Pattern from '@/components/Pattern';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setMessage(null);
    setError("This feature is not implemented.");
  };

  return (
    <main className={styles.container}>
      <Pattern />
      <div className={styles.form}>
        <h1 className={styles.title}>Forgot Password</h1>
        
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              className={styles.input}
            />
          </div>
        </div>

        <button onClick={handleResetPassword} className={styles.button}>
          Send Reset Link
        </button>

        {message && <p className={styles.message}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.backToLogin}>
          <Link href="/login">Back to Sign In</Link>
        </div>
      </div>
    </main>
  );
}