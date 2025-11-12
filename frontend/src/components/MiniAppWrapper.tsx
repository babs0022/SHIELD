'use client';

import React, { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function MiniAppWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return <>{children}</>;
}
