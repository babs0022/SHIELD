'use client';

import React, { useState } from 'react';
import styles from './AdminPage.module.css';
import CopyIcon from '@/components/CopyIcon';
import { toast } from 'react-hot-toast';

interface PolicyLink {
  policy_id: string;
  recipient_address: string;
  created_at: string;
  status: string;
  access_count: number;
}

interface LinksTableProps {
  links: PolicyLink[];
  handleRevokeLink: (policyId: string) => Promise<void>;
}

export default function LinksTable({ links, handleRevokeLink }: LinksTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [linksPerPage] = useState(10);

  const baseUrl = `https://${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }, (err) => {
      toast.error('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = searchTerm === '' ||
                          link.policy_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          link.recipient_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (link.status || '').toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastLink = currentPage * linksPerPage;
  const indexOfFirstLink = indexOfLastLink - linksPerPage;
  const currentLinks = filteredLinks.slice(indexOfFirstLink, indexOfLastLink);
  const totalPages = Math.ceil(filteredLinks.length / linksPerPage);

  return (
    <>
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
            {currentLinks.map((link) => (
              <tr key={link.policy_id}>
                <td className={styles.policyIdCell}>
                  <span className={styles.truncate}>{link.policy_id}</span>
                  <CopyIcon className={styles.copyIconSmall} onClick={() => handleCopy(`${baseUrl}/r/${link.policy_id}`)} />
                </td>
                <td className={styles.addressCell}>
                  <span className={styles.truncate}>{link.recipient_address}</span>
                  <CopyIcon className={styles.copyIconSmall} onClick={() => handleCopy(link.recipient_address)} />
                </td>
                <td>{new Date(link.created_at).toLocaleString()}</td>
                <td><span className={`${styles.statusBadge} ${styles[(link.status || 'unknown').toLowerCase()]}`}>{link.status || 'Unknown'}</span></td>
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
      <div className={styles.pagination}>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </>
  );
}