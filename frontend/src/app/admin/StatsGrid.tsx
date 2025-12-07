'use client';

import React from 'react';
import styles from './AdminPage.module.css';

interface AdminStatus {
  totalUsers: number;
  totalLinksCreated: number;
  totalLinksOpened: number;
  activeUsers: {
    '24h': number;
    '7d': number;
    '30d': number;
  };
  applicationStatus: {
    uptime: string;
    averageResponseTime: string;
    endpoints: Array<{ name: string; status: string; avgResponseTime: string }>;
  };
}

interface StatsGridProps {
  adminStatus: AdminStatus | null;
}

export default function StatsGrid({ adminStatus }: StatsGridProps) {
  if (!adminStatus) {
    return null;
  }

  return (
    <>
      <h2 className={styles.sectionTitle}>Statistics</h2>
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
          <p>{adminStatus.totalUsers}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Links Created</h3>
          <p>{adminStatus.totalLinksCreated}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Links Opened</h3>
          <p>{adminStatus.totalLinksOpened}</p>
        </div>

        <div className={styles.statCard}>
          <h3>Active Users (24h)</h3>
          <p>{adminStatus.activeUsers['24h']}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Active Users (7d)</h3>
          <p>{adminStatus.activeUsers['7d']}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Active Users (30d)</h3>
          <p>{adminStatus.activeUsers['30d']}</p>
        </div>

        <div className={styles.fullWidthCard}>
          <h3>Application Status</h3>
          <p>Uptime: {adminStatus.applicationStatus.uptime}</p>
          <p>Avg. Response Time: {adminStatus.applicationStatus.averageResponseTime}</p>
          <h4>Endpoint Status:</h4>
          <ul>
            {adminStatus.applicationStatus.endpoints.map((endpoint, index) => (
              <li key={index}>
                <span>{endpoint.name}</span>
                <span>{endpoint.status} (Avg: {endpoint.avgResponseTime})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
