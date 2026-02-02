// frontend/src/app/upgrade/UpgradeClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useWriteContract } from 'wagmi';
import { toast } from 'react-hot-toast';
import { Hex, parseEther } from 'viem';
import { base } from 'viem/chains';
import styles from './Upgrade.module.css';

const UPGRADE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_UPGRADE_WALLET_ADDRESS as Hex | undefined;
const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as Hex | undefined;

// Prices in USDC units for transactions (6 decimals)
const MONTHLY_PRICE_USDC_UNITS = BigInt(9990000); // 9.99 USDC
const YEARLY_PRICE_USDC_UNITS = BigInt(99990000); // 99.99 USDC

// Prices for display purposes
const MONTHLY_PRICE_DISPLAY = 9.99;
const YEARLY_PRICE_DISPLAY = 99.99;

export default function UpgradeClient() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<{ tier: string; subscriptionExpiresAt: string | null } | null>(null);

  useEffect(() => {
    const fetchUserTier = async () => {
      if (!address) return;
      const token = localStorage.getItem('reown-siwe-token');
      if (!token) return;

      try {
        const response = await fetch('/api/user/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserStatus(data);
        } else {
          console.error('Failed to fetch user tier');
        }
      } catch (error) {
        console.error('Error fetching user tier:', error);
      }
    };
    fetchUserTier();
  }, [address]);

  const handleUpgrade = async (subscriptionType: 'monthly' | 'yearly') => {
    if (!isConnected || !address || !UPGRADE_WALLET_ADDRESS || !USDC_CONTRACT_ADDRESS) {
      toast.error('Please connect your wallet and ensure all configurations are set.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Initiating ${subscriptionType} upgrade...`);

    try {
      const usdcAmount = subscriptionType === 'monthly' ? MONTHLY_PRICE_USDC_UNITS : YEARLY_PRICE_USDC_UNITS;

      // Transfer USDC to the upgrade wallet address
      const transferHash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: [{
          "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "value", "type": "uint256" }
          ],
          "name": "transfer",
          "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        functionName: 'transfer',
        args: [UPGRADE_WALLET_ADDRESS, usdcAmount],
      });

      toast.loading('Confirming payment...', { id: toastId });

      // Backend verification
      const token = localStorage.getItem('reown-siwe-token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const response = await fetch('/api/upgrade/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ txHash: transferHash, subscriptionType }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Payment verification failed.');
      }

      toast.success('Upgrade successful! Welcome to Pro!', { id: toastId });
      setUserStatus({ tier: 'pro', subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }); // Update UI immediately

    } catch (error: any) {
      console.error('Upgrade error:', error);
      let errorMessage = 'Failed to upgrade. Please try again.';
      if (error.message.includes('User rejected the request')) {
        errorMessage = 'Transaction rejected by user.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Upgrade to Shield Pro</h1>
      <p className={styles.description}>
        {userStatus?.tier === 'pro'
          ? "You're enjoying the full power of Shield. Here's a reminder of your benefits."
          : 'Unlock more features and higher limits by upgrading to Pro.'}
      </p>

      <div className={styles.benefitsGrid}>
        <div className={styles.benefitCard}>
          <h3>Daily Links</h3>
          <p className={styles.benefitValue}>50</p>
          <p className={styles.benefitOldValue}>vs 5 on Free</p>
        </div>
        <div className={styles.benefitCard}>
          <h3>File Size</h3>
          <p className={styles.benefitValue}>100MB</p>
          <p className={styles.benefitOldValue}>vs 20MB on Free</p>
        </div>
        <div className={styles.benefitCard}>
          <h3>Text Length</h3>
          <p className={styles.benefitValue}>Unlimited</p>
          <p className={styles.benefitOldValue}>vs 500 Chars on Free</p>
        </div>
      </div>

      {userStatus?.tier === 'pro' ? (
        <div className={styles.proStatus}>
          <p>You are currently a Pro user! 🎉</p>
          {userStatus.subscriptionExpiresAt && (
            <p className={styles.expiryDate}>
              Your subscription is valid until: {new Date(userStatus.subscriptionExpiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.pricingGrid}>
          <div className={styles.tierCard}>
            <h2>Monthly</h2>
            <p className={styles.price}>${MONTHLY_PRICE_DISPLAY} <span className={styles.currency}>USDC</span></p>
            <p className={styles.duration}>per month</p>
            <button
              className={styles.upgradeButton}
              onClick={() => handleUpgrade('monthly')}
              disabled={loading || !isConnected}
            >
              {loading ? 'Processing...' : 'Choose Monthly'}
            </button>
          </div>

          <div className={`${styles.tierCard} ${styles.yearlyCard}`}>
            <h2>Yearly</h2>
            <p className={styles.price}>${YEARLY_PRICE_DISPLAY} <span className={styles.currency}>USDC</span></p>
            <p className={styles.duration}>per year (Save ${MONTHLY_PRICE_DISPLAY * 12 - YEARLY_PRICE_DISPLAY})</p>
            <button
              className={styles.upgradeButton}
              onClick={() => handleUpgrade('yearly')}
              disabled={loading || !isConnected}
            >
              {loading ? 'Processing...' : 'Choose Yearly'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
