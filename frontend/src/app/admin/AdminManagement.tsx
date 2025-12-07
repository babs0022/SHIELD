'use client';

import React, { useState } from 'react';
import styles from './AdminPage.module.css';
import CopyIcon from '@/components/CopyIcon';
import { toast } from 'react-hot-toast';

interface AdminUser {
  address: string;
  role: 'SUPER_ADMIN' | 'TEAM_ADMIN';
}

interface AdminManagementProps {
  admins: AdminUser[];
  currentAdminAddress: string | undefined;
  handleAddAdmin: (e: React.FormEvent, address: string, role: 'SUPER_ADMIN' | 'TEAM_ADMIN') => Promise<void>;
  handleRemoveAdmin: (address: string) => Promise<void>;
}

export default function AdminManagement({ admins, currentAdminAddress, handleAddAdmin, handleRemoveAdmin }: AdminManagementProps) {
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'SUPER_ADMIN' | 'TEAM_ADMIN'>('TEAM_ADMIN');

  const onAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddAdmin(e, newAdminAddress, newAdminRole);
    setNewAdminAddress('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }, (err) => {
      toast.error('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <>
      <h2 className={styles.sectionTitle}>Admin Management</h2>
      <div className={styles.adminManagementContainer}>
        <form onSubmit={onAddAdminSubmit} className={styles.addAdminForm}>
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
                    {admin.address.toLowerCase() !== currentAdminAddress?.toLowerCase() && (
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
  );
}
