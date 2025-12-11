import React from 'react';
import './globals.css';
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import { Toaster } from 'react-hot-toast';
import { ProfileProvider } from '@/contexts/ProfileContext';
import Navbar from '@/components/Navbar';
import type { Metadata, Viewport } from 'next';
import ClientLayout from './ClientLayout';

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
    url: 'https://app.shieldhq.xyz',
    siteName: 'Shield',
    images: [
      {
        url: 'https://app.shieldhq.xyz/ogimage.png',
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
    images: ['https://app.shieldhq.xyz/ogimage.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};


import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          <ProfileProvider>
            <StyledComponentsRegistry>
              <Toaster />
              <Navbar />
              {children}
      
              <Analytics />
            </StyledComponentsRegistry>
          </ProfileProvider>
        </ClientLayout>
      </body>
    </html>
  )
}