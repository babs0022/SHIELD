'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import styles from './AdminPage.module.css';
import { toast } from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import StatsGrid from './StatsGrid';
import LinksTable from './LinksTable';
import AdminManagement from './AdminManagement';

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

  const fetchAdminData = async () => {
    const token = localStorage.getItem('reown-siwe-token');
    if (!token) {
      setError('Authentication token not found.');
      toast.error('Authentication token not found.');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const statusResponse = await fetch('/api/admin/status', { headers });
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(errorData.error || 'Failed to fetch admin status');
      }
      const statusData: AdminStatus = await statusResponse.json();
      setAdminStatus(statusData);

      const linksResponse = await fetch('/api/admin/links', { headers });
      if (!linksResponse.ok) {
        const errorData = await linksResponse.json();
        throw new Error(errorData.error || 'Failed to fetch links');
      }
      const linksData: PolicyLink[] = await linksResponse.json();
      setLinks(linksData);

      if (isSuperAdmin) {
        const adminsResponse = await fetch('/api/admin/manage-admins', { headers });
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
    if (!isConnected || !address) {
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
        router.push('/');
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [address, isConnected, router, isSuperAdmin]);

  const handleRevokeLink = async (policyId: string) => {
    if (!confirm(`Are you sure you want to revoke link ${policyId}?`)) return;

    try {
      const token = localStorage.getItem('reown-siwe-token');
      const response = await fetch('/api/admin/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ policyId, action: 'revoke' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke link');
      }

      toast.success(`Link ${policyId} revoked successfully!`);
      fetchAdminData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent, newAdminAddress: string, newAdminRole: 'SUPER_ADMIN' | 'TEAM_ADMIN') => {
    e.preventDefault();
    if (!newAdminAddress) {
      toast.error('Admin address cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('reown-siwe-token');
      const response = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: newAdminAddress, role: newAdminRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add admin');
      }

      toast.success(`Admin ${newAdminAddress} (${newAdminRole}) added successfully!`);
      fetchAdminData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRemoveAdmin = async (addressToRemove: string) => {
    if (!confirm(`Are you sure you want to remove admin ${addressToRemove}?`)) return;

    try {
      const token = localStorage.getItem('reown-siwe-token');
      const response = await fetch('/api/admin/manage-admins', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: addressToRemove }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove admin');
      }

      toast.success(`Admin ${addressToRemove} removed successfully!`);
      fetchAdminData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <h1 className={styles.title}>Loading Admin Page...</h1>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <h1 className={styles.title}>Admin Dashboard</h1>
      {error && <p className={styles.error}>{error}</p>}

      <StatsGrid adminStatus={adminStatus} />
      <LinksTable links={links} handleRevokeLink={handleRevokeLink} />

      {isSuperAdmin && (
        <AdminManagement
          admins={admins}
          currentAdminAddress={address}
          handleAddAdmin={handleAddAdmin}
          handleRemoveAdmin={handleRemoveAdmin}
        />
      )}
    </AdminLayout>
  );
}