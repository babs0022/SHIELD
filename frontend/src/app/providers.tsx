'use client';

import React, { useState, type ReactNode } from 'react';
import { WagmiProvider, type Config, State } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter } from '@/config/reown';
import { chains } from '@/config/chains';
import { base } from 'wagmi/chains';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { cookieToInitialState } from '@wagmi/core';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_REOWN_PROJECT_ID';

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'Shield',
  description: 'Decentralized and secure file and message sharing.',
  url: 'https://shield-app.vercel.app',
  icons: ['https://shield-app.vercel.app/Shld.png']
};

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: chains,
  defaultNetwork: base,
  metadata: metadata,
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;