import React from 'react';
import './globals.css';
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import MiniAppWrapper from '@/components/MiniAppWrapper';
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
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://shield-app.vercel.app/ogimage.png',
      button: {
        title: 'Create a secure link',
        action: {
          type: 'launch_frame',
          name: 'Shield',
          url: 'https://shield-app.vercel.app'
        }
      }
    })
  }
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
        <MiniAppWrapper>
          <DynamicProviders>
            <StyledComponentsRegistry>
              <Toaster />
              <Navbar />
              {children}
            </StyledComponentsRegistry>
          </DynamicProviders>
        </MiniAppWrapper>
      </body>
    </html>
  )
}