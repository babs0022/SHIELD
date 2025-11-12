import React from 'react';
import './globals.css';
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';

import MiniAppWrapper from '@/components/MiniAppWrapper';

export const metadata = {
  title: 'Shield - Secure Sharing',
  description: 'Decentralized and secure file and message sharing.',
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
        <meta property="fc:miniapp:version" content="vNext" />
        <meta property="fc:miniapp:image" content="https://your-domain.com/embed-image.png" />
        <meta property="fc:miniapp:button:title" content="Open Shield" />
        <meta property="fc:miniapp:button:action" content="launch" />
        <meta property="fc:miniapp:button:url" content="https://your-domain.com" />
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

