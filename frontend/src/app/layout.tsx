import React from 'react';
import './globals.css';
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';

import MiniAppWrapper from '@/components/MiniAppWrapper';

export const metadata = {
  metadataBase: new URL('https://shield-app.vercel.app'),
  title: 'Shield - Secure Sharing',
  description: 'Decentralized and secure file and message sharing.',
  openGraph: {
    title: 'Shield - Secure Sharing',
    description: 'Decentralized and secure file and message sharing.',
    images: ['/ogimage.png'],
  },
}

const DynamicProviders = dynamic(() => import('./providers').then(mod => mod.Providers), { ssr: false });
import '@rainbow-me/rainbowkit/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:miniapp" content={JSON.stringify({
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
        })} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/Shld.png" sizes="any" />
        <link rel="apple-touch-icon" href="/Shld.png" />
      </head>
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

