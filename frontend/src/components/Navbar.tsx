'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import UserMenu from './UserMenu';
import { useAccount, useSignMessage } from 'wagmi';
import { SUPER_ADMIN_ADDRESSES, TEAM_ADMIN_ADDRESSES } from '@/config/admin';
import { SiweMessage } from 'siwe';
import { toast } from 'react-hot-toast';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'next/navigation';

import { useAppKit } from '@reown/appkit/react';

export default function Navbar() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const { fetchProfile, setShowOnboarding } = useProfile();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const profileFetchedForAddress = React.useRef<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    if (isConnected && address && chainId) {
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
        await fetchProfile(address);
        profileFetchedForAddress.current = address;
        toast.success('Signed in successfully!', { id: toastId });

        // Check if the user is new and trigger onboarding
        if (user && user.first_login_at === user.last_login_at) {
          setShowOnboarding(true);
        }

      } catch (error: any) {
        toast.error(error.message || 'An unexpected error occurred.', { id: toastId });
        setIsAuthenticated(false);
      }
    }
  };

  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const processSignIn = async () => {
      if (isConnecting && isConnected && address && chainId) {
        await handleSignIn();
        setIsConnecting(false);
      }
    };
    processSignIn();
  }, [isConnected, isConnecting, address, chainId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const farcasterToken = urlParams.get('token');

    if (farcasterToken) {
      localStorage.setItem('reown-siwe-token', farcasterToken);
      setIsAuthenticated(true);
      router.replace(window.location.pathname); // Clean the URL
      toast.success('Signed in via Farcaster!');
    }

    const token = localStorage.getItem('reown-siwe-token');
    if (token) {
      setIsAuthenticated(true);
      if (address && profileFetchedForAddress.current !== address) {
        fetchProfile(address);
        profileFetchedForAddress.current = address;
      }
    }
    else if (!farcasterToken) { // Only attempt SIWE if no Farcaster token was found
      setIsAuthenticated(false);
    }
  }, [isConnected, address, chainId, signMessageAsync, fetchProfile, router]);

  const onSignIn = async () => {
    setIsConnecting(true);
    await open();
  };

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
          <Image src="/Shld.png" alt="Shield Logo" width={32} height={32} />
          <span className={styles.brandText}>Shield</span>
        </Link>
      </div>

      <div className={styles.linksContainer}>
        
        {isConnected && isAuthenticated ? (
          <UserMenu onSignOut={handleSignOut} />
        ) : (
          <button onClick={onSignIn} className={styles.connectButton}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
