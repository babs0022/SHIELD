"use client";

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './UserMenu.module.css';
import ChevronDownIcon from './ChevronDownIcon';
import { useAccount, useDisconnect } from 'wagmi';
import { useProfile } from '@/contexts/ProfileContext';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';

export default function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { profile, isLoading } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    onSignOut();
    disconnect();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isConnected || !address) return null;

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = profile?.displayName || truncatedAddress;
  const pfpUrl = profile?.pfpUrl;

  const connectedAddress = address?.toLowerCase();
  const isSuperAdmin = SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
  const isTeamAdmin = TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
  const isAdmin = isSuperAdmin || isTeamAdmin;

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.menuButton}>
        {isLoading ? (
          <div className={styles.pfpSkeleton} />
        ) : pfpUrl ? (
          <img src={pfpUrl} alt={displayName} className={styles.pfp} />
        ) : (
          <div className={styles.pfpPlaceholder} />
        )}
        <span>{displayName}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
            Profile
          </Link>
          <Link href="/docs" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
            Docs
          </Link>
          {isAdmin && (
            <Link href="/admin" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
              Admin
            </Link>
          )}
          <div className={styles.separator}></div>
          <button onClick={handleSignOut} className={`${styles.dropdownItem} ${styles.signOut}`}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
