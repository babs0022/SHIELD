'use client';

import React, { useState, useEffect } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  safeWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  localhost,
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { appkit } from '@/lib/reown';

const chains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  ...(process.env.NODE_ENV === 'development' ? [localhost] : [])
] as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => {
    const connectors = connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [injectedWallet, metaMaskWallet, safeWallet, walletConnectWallet],
        },
      ],
      {
        appName: 'Shield',
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      }
    );

    return createConfig({
      connectors,
      chains: chains,
      transports: chains.reduce((acc, chain) => {
        acc[chain.id] = http();
        return acc;
      }, {} as Record<number, ReturnType<typeof http>>),
    });
  });

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({
          accentColor: '#16A34A',
          accentColorForeground: 'white',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}