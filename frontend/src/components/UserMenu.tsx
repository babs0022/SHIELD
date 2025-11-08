"use client";

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './UserMenu.module.css';
import ChevronDownIcon from './ChevronDownIcon';
import { useAccount, useDisconnect } from 'wagmi';

export default function UserMenu() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
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

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.menuButton}>
        <span>{truncatedAddress}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
            Profile
          </Link>
          <Link href="/profile#my-links" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
            My Links
          </Link>
          <Link href="/profile#settings" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
            Settings
          </Link>
          <div className={styles.separator}></div>
          <button onClick={handleSignOut} className={`${styles.dropdownItem} ${styles.signOut}`}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
