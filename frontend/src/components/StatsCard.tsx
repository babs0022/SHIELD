// src/components/StatsCard.tsx
"use client";

import React, { useEffect, useState } from 'react';
import styles from './StatsCard.module.css';

interface UserStats {
  totalLinksCreated: number;
  builderScore: number;
}

export default function StatsCard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('reown-siwe-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats.');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.card}>
        <p>Loading stats...</p>
      </div>
    );
  }
  
  if (!stats) {
    return null; // Don't render anything if stats aren't available
  }

  return (
    <div className={styles.card}>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.totalLinksCreated}</span>
        <span className={styles.statLabel}>Links Created</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.builderScore}</span>
        <span className={styles.statLabel}>Builder Score</span>
      </div>
    </div>
  );
}
