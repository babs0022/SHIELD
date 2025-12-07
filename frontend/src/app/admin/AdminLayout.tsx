'use client';

import React from 'react';
import Pattern from '@/components/Pattern';
import styles from './AdminPage.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <Pattern />
      <div className={styles.contentWrapper}>
        {children}
      </div>
    </div>
  );
}
