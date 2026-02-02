'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';
import StatsCard from '@/components/StatsCard';
import AdminPageSkeleton from './AdminPageSkeleton';

interface AdminStats {
  totalUsers: number;
  proUsers: number;
  totalLinks: number;
}

interface User {
  wallet_address: string;
  display_name: string | null;
  tier: 'free' | 'pro';
  total_links: number;
}

interface GrantedUser {
  wallet_address: string;
  subscription_expires_at: string;
}

export default function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [grantedUsers, setGrantedUsers] = useState<GrantedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('');

  // State for the upgrade form
  const [userAddress, setUserAddress] = useState('');
  const [duration, setDuration] = useState(30);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const fetchData = async () => {
    // setLoading(true) is not needed here anymore for refetches, 
    // as we don't want the whole page to turn into a skeleton on every search.
    // The initial load is handled by the initial state of `loading`.
    try {
      const token = localStorage.getItem('reown-siwe-token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Build users API URL with query params
      const usersApiUrl = new URL('/api/admin/users', window.location.origin);
      usersApiUrl.searchParams.append('page', currentPage.toString());
      if (searchTerm) usersApiUrl.searchParams.append('search', searchTerm);
      if (filterTier) usersApiUrl.searchParams.append('tier', filterTier);

      // Fetch all data in parallel
      const [statsRes, grantedUsersRes, usersRes] = await Promise.all([
        fetch('/api/admin/status', { headers }),
        fetch('/api/admin/granted-users', { headers }),
        fetch(usersApiUrl.toString(), { headers })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch admin stats. Are you an admin?');
      if (!grantedUsersRes.ok) throw new Error('Failed to fetch granted users.');
      if (!usersRes.ok) throw new Error('Failed to fetch users.');

      const statsData = await statsRes.json();
      const grantedUsersData = await grantedUsersRes.json();
      const usersData = await usersRes.json();
      
      setStats(statsData);
      setGrantedUsers(grantedUsersData);
      setUsers(usersData.users);
      setTotalPages(usersData.totalPages);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false); // This will only be set to false after the first fetch
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [currentPage, searchTerm, filterTier]);

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

  const handleUserUpgrade = (address: string) => {
    setUserAddress(address);
    const upgradeForm = document.getElementById('upgradeForm');
    if (upgradeForm) {
      upgradeForm.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  if (loading) {
    return <AdminPageSkeleton />;
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

      <div id="upgradeForm" className={styles.section}>
        <h2 className={styles.sectionTitle}>Grant Pro Access</h2>
        <form onSubmit={handleUpgrade} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              id="userAddress"
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder=" "
              required
              className={styles.input}
            />
            <label htmlFor="userAddress">User Wallet Address</label>
          </div>
          <div className={styles.inputGroup}>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
              className={styles.input}
              placeholder=" "
            />
            <label htmlFor="duration">Duration (in days)</label>
          </div>
          <button type="submit" disabled={isUpgrading}>
            {isUpgrading ? 'Processing...' : 'Grant Pro'}
          </button>
        </form>
        {upgradeMessage && <p className={styles.message}>{upgradeMessage}</p>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>User Management</h2>
        
        <div className={styles.filters}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder=" "
              className={styles.input}
            />
            <label>Search Wallet or Name</label>
          </div>
          <div className={styles.inputGroup}>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className={styles.input}
            >
              <option value="">All Tiers</option>
              <option value="pro">Pro</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Wallet Address</th>
                <th>Name</th>
                <th>Tier</th>
                <th>Total Links</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.wallet_address}>
                  <td>{user.wallet_address}</td>
                  <td>{user.display_name || 'N/A'}</td>
                  <td>{user.tier}</td>
                  <td>{user.total_links}</td>
                  <td>
                    {user.tier === 'free' && (
                      <button 
                        onClick={() => handleUserUpgrade(user.wallet_address)}
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
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
