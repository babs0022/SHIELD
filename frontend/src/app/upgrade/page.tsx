// frontend/src/app/upgrade/page.tsx

import { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';

export const metadata: Metadata = {
  title: 'Shield: Upgrade to Pro',
  description: 'Unlock advanced features and higher limits with Shield Pro.',
};

export default function UpgradePage() {
  return <UpgradeClient />;
}
