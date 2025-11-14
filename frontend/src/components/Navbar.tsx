"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './Navbar.module.css';
import UserMenu from './UserMenu';
import { useState } from 'react';
import MenuIcon from './MenuIcon';
import CloseIcon from './CloseIcon';
import { useAccount } from 'wagmi';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { useEffect } from 'react';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const signIn = async () => {
      if (isConnected && address) {
        try {
          await fetch('/api/signIn', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: address }),
          });
        } catch (error) {
          console.error('Failed to sign in:', error);
        }
      }
    };
    signIn();
  }, [isConnected, address]);

  const connectedAddress = address?.toLowerCase();
  const isSuperAdmin = SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
  const isTeamAdmin = TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
  const isAdmin = isSuperAdmin || isTeamAdmin;

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.brand}>
        <Image src="/Shld.png" alt="Shield Logo" width={32} height={32} />
        <span className={styles.brandText}>Shield</span>
      </Link>
      <div className={styles.menuToggle} onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </div>
      <div className={`${styles.links} ${isMenuOpen ? styles.active : ''}`}>
        {isAdmin && (
          <Link href="/admin" className={styles.link}>
            Admin
          </Link>
        )}
        {isConnected ? (
          <>
            <div className="connect-wallet-button-selector">
              <ConnectButton />
            </div>
            <UserMenu />
          </>
        ) : (
          <div className="connect-wallet-button-selector">
            <ConnectButton />
          </div>
        )}
      </div>
    </nav>
  );
}