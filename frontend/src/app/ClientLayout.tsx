'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DynamicProviders = dynamic(() => import('./providers').then(mod => mod.Providers), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicProviders>{children}</DynamicProviders>
  );
}