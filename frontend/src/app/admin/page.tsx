'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';
import StatsCard from '@/components/StatsCard';

interface AdminStats {
  totalUsers: number;
  proUsers: number;
  totalLinks: number;
}

interface GrantedUser {
  wallet_address: string;
  subscription_expires_at: string;
}

export default function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [grantedUsers, setGrantedUsers] = useState<GrantedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the upgrade form
  const [userAddress, setUserAddress] = useState('');
  const [duration, setDuration] = useState(30);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('reown-siwe-token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch stats and granted users in parallel
      const [statsRes, grantedUsersRes] = await Promise.all([
        fetch('/api/admin/status', { headers }),
        fetch('/api/admin/granted-users', { headers })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch admin stats. Are you an admin?');
      if (!grantedUsersRes.ok) throw new Error('Failed to fetch granted users.');

      const statsData = await statsRes.json();
      const grantedUsersData = await grantedUsersRes.json();
      
      setStats(statsData);
      setGrantedUsers(grantedUsersData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgrading(true);
    setUpgradeMessage('');
    try {
      const token = localStorage.getItem('reown-siwe-token');
      const response = await fetch('/api/admin/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userAddress: userAddress,
          durationInDays: Number(duration)
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details?.fieldErrors?.userAddress?.[0] || data.error || 'Failed to upgrade user.');
      }
      
      setUpgradeMessage(data.message);
      setUserAddress('');
      setDuration(30);
      
      // Refresh data after a successful upgrade
      await fetchData();

    } catch (err: any) {
      setUpgradeMessage(err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading dashboard...</div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>

      <div className={styles.statsGrid}>
        <StatsCard title="Total Users" value={stats?.totalUsers ?? 0} />
        <StatsCard title="Total Pro Users" value={stats?.proUsers ?? 0} />
        <StatsCard title="Granted Pro" value={grantedUsers.length} />
        <StatsCard title="Total Links Created" value={stats?.totalLinks ?? 0} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Grant Pro Access</h2>
        <form onSubmit={handleUpgrade} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="userAddress">User Wallet Address</label>
            <input
              id="userAddress"
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="0x..."
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="duration">Duration (in days)</label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>
          <button type="submit" disabled={isUpgrading}>
            {isUpgrading ? 'Processing...' : 'Grant Pro'}
          </button>
        </form>
        {upgradeMessage && <p className={styles.message}>{upgradeMessage}</p>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manually Granted Pro Users</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Wallet Address</th>
                <th>Subscription Expires</th>
              </tr>
            </thead>
            <tbody>
              {grantedUsers.length > 0 ? (
                grantedUsers.map(user => (
                  <tr key={user.wallet_address}>
                    <td>{user.wallet_address}</td>
                    <td>{new Date(user.subscription_expires_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2}>No manually granted Pro users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
