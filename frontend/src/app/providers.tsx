'use client';

import React, { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/config/web3modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { ProfileProvider } from '@/contexts/ProfileContext';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    createWeb3Modal({ wagmiConfig, projectId });
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
