'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import UserMenu from './UserMenu';
import { useAccount, useSignMessage } from 'wagmi';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { SiweMessage } from 'siwe';
import { toast } from 'react-hot-toast';
import { useProfile } from '@/contexts/ProfileContext';

export default function Navbar() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWeb3Modal();
  const { signMessageAsync } = useSignMessage();
  const { fetchProfile } = useProfile();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const profileFetchedForAddress = React.useRef<string | null>(null);

  React.useEffect(() => {
    const fetchTier = async () => {
      if (!isConnected || !address) {
        setUserTier(null);
        return;
      }
      const token = localStorage.getItem('reown-siwe-token');
      if (!token) {
        setUserTier('free'); // Default to free if no JWT token (not signed in)
        return;
      }
      try {
        const response = await fetch('/api/user/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserTier(data.tier);
        } else {
          console.error('Failed to fetch user tier for navbar');
          setUserTier('free'); // Default to free on error
        }
      } catch (error) {
        console.error('Error fetching user tier for navbar:', error);
        setUserTier('free'); // Default to free on error
      }
    };

    fetchTier();
  }, [address, isConnected, isAuthenticated]);

  React.useEffect(() => {
    const token = localStorage.getItem('reown-siwe-token');
    const handleSignIn = async () => {
      if (isConnected && address && chainId && !token) {
        const toastId = toast.loading('Please sign the message to continue...');
        try {
          const domain = process.env.NEXT_PUBLIC_FRONTEND_URL;
          if (!domain) {
            throw new Error('NEXT_PUBLIC_FRONTEND_URL is not defined in environment variables.');
          }
          const message = new SiweMessage({
            domain,
            address,
            statement: 'Sign in with Ethereum to the app.',
            uri: domain,
            version: '1',
            chainId,
          });
          const preparedMessage = message.prepareMessage();
          const signature = await signMessageAsync({ message: preparedMessage });

          const response = await fetch('/api/signIn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
          });

          if (!response.ok) throw new Error((await response.json()).error || 'Sign-in failed.');
          
          const { token: newToken, user } = await response.json();
          localStorage.setItem('reown-siwe-token', newToken);
          setIsAuthenticated(true);
          await fetchProfile();
          profileFetchedForAddress.current = address;
          toast.success('Signed in successfully!', { id: toastId });

          if (user && user.first_login_at === user.last_login_at) {
            // This logic will be handled by the ProfileContext
          }

        } catch (error: any) {
          toast.error(error.message || 'An unexpected error occurred.', { id: toastId });
          setIsAuthenticated(false);
        }
      }
    };

    if (token) {
      setIsAuthenticated(true);
      if (address && profileFetchedForAddress.current !== address) {
        fetchProfile();
        profileFetchedForAddress.current = address;
      }
    }
    else {
      setIsAuthenticated(false);
      handleSignIn();
    }
  }, [isConnected, address, chainId, signMessageAsync, fetchProfile]);

  const handleSignOut = () => {
    localStorage.removeItem('reown-siwe-token');
    setIsAuthenticated(false);
    toast.success('You have been signed out.');
  };

  const connectedAddress = address?.toLowerCase();
  const isSuperAdmin = SUPER_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
  const isTeamAdmin = TEAM_ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(connectedAddress || '');
  const isAdmin = isSuperAdmin || isTeamAdmin;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.brand}>
          <Image src="/Shld.svg" alt="Shield Logo" width={32} height={32} />
          <span className={styles.brandText}>Shield</span>
        </Link>
      </div>

      <div className={styles.linksContainer}>
        {userTier === 'free' && isConnected && isAuthenticated && (
          <Link href="/upgrade" className={styles.upgradeLink}>
            Upgrade to Pro
          </Link>
        )}
        {isConnected && isAuthenticated ? (
          <UserMenu onSignOut={handleSignOut} />
        ) : (
          <button onClick={() => open()} className={styles.connectButton}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}