'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import Pattern from '@/components/Pattern';
import styles from './AdminPage.module.css';
import { toast } from 'react-hot-toast';
import CopyIcon from '@/components/CopyIcon';

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

interface PolicyLink {
  policy_id: string;
  resource_cid: string;
  recipient_address: string;
  created_at: string;
  status: string;
  access_count: number;
  mime_type: string;
  is_text: boolean;
}

interface AdminUser {
  address: string;
  role: 'SUPER_ADMIN' | 'TEAM_ADMIN';
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [links, setLinks] = useState<PolicyLink[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'SUPER_ADMIN' | 'TEAM_ADMIN'>('TEAM_ADMIN');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAdminData = async () => {
    try {
      const statusResponse = await fetch('/api/admin/status');
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(errorData.error || 'Failed to fetch admin status');
      }
      const statusData: AdminStatus = await statusResponse.json();
      setAdminStatus(statusData);

      const linksResponse = await fetch('/api/admin/links');
      if (!linksResponse.ok) {
        const errorData = await linksResponse.json();
        throw new Error(errorData.error || 'Failed to fetch links');
      }
      const linksData: PolicyLink[] = await linksResponse.json();
      setLinks(linksData);

      if (isSuperAdmin) {
        const adminsResponse = await fetch('/api/admin/manage-admins');
        if (!adminsResponse.ok) {
          const errorData = await adminsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch admins');
        }
        const adminsData = await adminsResponse.json();
        const formattedAdmins: AdminUser[] = [
          ...adminsData.superAdmins.map((addr: string) => ({ address: addr, role: 'SUPER_ADMIN' })),
          ...adminsData.teamAdmins.map((addr: string) => ({ address: addr, role: 'TEAM_ADMIN' })),
        ];
        setAdmins(formattedAdmins);
      }

    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message);
    }
  };

  useEffect(() => {
    if (!isConnected || !address) { // Wait for address to be available
      return;
    }

    const checkAdminStatus = async () => {
      const connectedAddress = address?.toLowerCase();
      const superAdmin = SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
      const teamAdmin = TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');

      if (superAdmin || teamAdmin) {
        setIsAdmin(true);
        setIsSuperAdmin(superAdmin);
        await fetchAdminData();
      } else {
        router.push('/'); // Redirect if not an admin
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [address, isConnected, router, isSuperAdmin]);

  const handleRevokeLink = async (policyId: string) => {
    if (!confirm(`Are you sure you want to revoke link ${policyId}?`)) return;

    try {
      const response = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, action: 'revoke' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke link');
      }

      toast.success(`Link ${policyId} revoked successfully!`);
      fetchAdminData(); // Refresh data
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminAddress) {
      toast.error('Admin address cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAdminAddress, role: newAdminRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add admin');
      }

      toast.success(`Admin ${newAdminAddress} (${newAdminRole}) added successfully!`);
      setNewAdminAddress('');
      fetchAdminData(); // Refresh data
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRemoveAdmin = async (addressToRemove: string) => {
    if (!confirm(`Are you sure you want to remove admin ${addressToRemove}?`)) return;

    try {
      const response = await fetch('/api/admin/manage-admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressToRemove }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove admin');
      }

      toast.success(`Admin ${addressToRemove} removed successfully!`);
      fetchAdminData(); // Refresh data
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = searchTerm === '' || 
                          link.policy_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          link.recipient_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || link.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }, (err) => {
      toast.error('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Pattern />
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Loading Admin Page...</h1>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Should have been redirected by now
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <Pattern />
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        {error && <p className={styles.error}>{error}</p>}

        {adminStatus && (
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
        )}

        <h2 className={styles.sectionTitle}>All Links</h2>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search by Policy ID or Recipient Address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Recipient Address</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Access Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => (
                <tr key={link.policy_id}>
                  <td className={styles.policyId}>
                    {link.policy_id}
                    <CopyIcon className={styles.copyIconSmall} onClick={() => handleCopy(link.policy_id)} />
                  </td>
                  <td className={styles.address}>
                    {link.recipient_address}
                    <CopyIcon className={styles.copyIconSmall} onClick={() => handleCopy(link.recipient_address)} />
                  </td>
                  <td>{new Date(link.created_at).toLocaleString()}</td>
                  <td><span className={`${styles.statusBadge} ${styles[link.status.toLowerCase()]}`}>{link.status}</span></td>
                  <td>{link.access_count}</td>
                  <td>
                    {link.status === 'active' && (
                      <button onClick={() => handleRevokeLink(link.policy_id)} className={styles.revokeButton}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isSuperAdmin && (
          <>
            <h2 className={styles.sectionTitle}>Admin Management</h2>
            <div className={styles.adminManagementContainer}>
              <form onSubmit={handleAddAdmin} className={styles.addAdminForm}>
                <input
                  type="text"
                  placeholder="New Admin Wallet Address"
                  value={newAdminAddress}
                  onChange={(e) => setNewAdminAddress(e.target.value)}
                  className={styles.searchInput}
                />
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'SUPER_ADMIN' | 'TEAM_ADMIN')}
                  className={styles.statusFilter}
                >
                  <option value="TEAM_ADMIN">Team Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                <button type="submit" className={styles.button}>
                  Add Admin
                </button>
              </form>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.address}>
                        <td className={styles.address}>
                          {admin.address}
                          <CopyIcon className={styles.copyIconSmall} onClick={() => handleCopy(admin.address)} />
                        </td>
                        <td>{admin.role}</td>
                        <td>
                          {admin.address.toLowerCase() !== address?.toLowerCase() && (
                            <button onClick={() => handleRemoveAdmin(admin.address)} className={styles.revokeButton}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
