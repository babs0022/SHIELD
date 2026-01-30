'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  
  useEffect(() => {
    document.title = "404 - Page Not Found | Shield";
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className={styles.icon}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      
      <h1 className={styles.title}>404</h1>
      
      <div className="max-w-lg space-y-4 mb-10">
        <h2 className={styles.subtitle}>Are you looking for something?</h2>
        <p className={styles.message}>
          It probably doesn't exist, or the dev ate it. <br/>
          <span className={styles.italicText}>He's a funny guy, we know.</span>
        </p>
      </div>
      
      <Link 
        href="/"
        className={styles.backButton}
      >
        <span className={styles.backButtonText}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={styles.backButtonIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Safety
        </span>
      </Link>
    </div>
  );
}