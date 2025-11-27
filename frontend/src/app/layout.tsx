import React from 'react';
import './globals.css';
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import { Toaster } from 'react-hot-toast';
import { ProfileProvider } from '@/contexts/ProfileContext';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import type { Metadata, Viewport } from 'next';

const DynamicProviders = dynamic(() => import('./providers').then(mod => mod.Providers), { ssr: false });

export const metadata: Metadata = {
  title: 'Shield - Secure Sharing',
  description: 'Decentralized and secure file and message sharing.',
  icons: {
    icon: '/Shld.png',
    apple: '/Shld.png',
  },
  keywords: ['secure sharing', 'decentralized', 'web3', 'crypto', 'file sharing', 'message sharing'],
  openGraph: {
    title: 'Shield - Secure Sharing',
    description: 'Decentralized and secure file and message sharing.',
    url: 'https://shield-app.vercel.app',
    siteName: 'Shield',
    images: [
      {
        url: 'https://shield-app.vercel.app/ogimage.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shield - Secure Sharing',
    description: 'Decentralized and secure file and message sharing.',
    creator: '@shieldapp',
    images: ['https://shield-app.vercel.app/ogimage.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DynamicProviders>
          <ProfileProvider>
            <StyledComponentsRegistry>
              <Toaster />
              <Navbar />
              {children}
            </StyledComponentsRegistry>
          </ProfileProvider>
        </DynamicProviders>
      </body>
    </html>
  )
}