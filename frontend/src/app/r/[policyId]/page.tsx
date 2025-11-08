'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Pattern from '@/components/Pattern';
import CryptoJS from 'crypto-js';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { toast } from 'react-hot-toast';
import styles from './ReceiverPage.module.css';

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failed' | 'invalid';
interface Policy {
  resourceCid: string;
  recipient_address: string;
  secretKey: string;
  mimeType: string;
  isText: boolean;
}

export default function ReceiverPage() {
  const params = useParams();
  const policyId = params.policyId as `0x${string}`;
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('Loading...');
  const [decryptedDataUrl, setDecryptedDataUrl] = useState<string>('');
  const [policy, setPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch(`/api/getPolicy/${policyId}`);
        if (!response.ok) {
          throw new Error('Policy not found or backend error.');
        }
        const policyData = await response.json();
        setPolicy(policyData);
        setInfo('Please connect your wallet to verify ownership.');
      } catch (e) {
        setVerificationStatus('invalid');
        setError((e as Error).message || 'An error occurred.');
      }
    };
    if (policyId) loadInitialData();
  }, [policyId]);

  const handleVerify = async () => {
    if (!isConnected || !address || !policy) {
      toast.error('Please connect your wallet.');
      return;
    }

    if (address !== policy.recipient_address) {
      setError('Connected wallet does not match the recipient address.');
      setVerificationStatus('failed');
      return;
    }

    setVerificationStatus('verifying');
    setInfo('Please sign the message in your wallet...');

    try {
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Shield to verify your identity and access the content.',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
      });

      const signature = await signMessageAsync({ message: message.prepareMessage() });

      const response = await fetch('/api/verify-siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, policyId }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to verify signature.');
      }

      const { secretKey } = await response.json();
      toast.success('Verification successful!');
      setInfo('Decrypting resource...');
      await decryptAndSetResource({ ...policy, secretKey });
      setVerificationStatus('success');

    } catch (err) {
      setVerificationStatus('failed');
      const error = err as Error;
      setError(error.message);
      toast.error(error.message);
    }
  };

  const decryptAndSetResource = async (policyData: Policy) => {
    const resourceUrl = `https://ipfs.io/ipfs/${policyData.resourceCid}`;
    const encryptedResponse = await fetch(resourceUrl);
    const encryptedData = await encryptedResponse.text();
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, policyData.secretKey);
    const decryptedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);
    setDecryptedDataUrl(decryptedBase64);
  };

  const renderContent = () => {
    if (!decryptedDataUrl) return null;
    if (policy?.isText) {
      return <p className={styles.decryptedText}>{atob(decryptedDataUrl)}</p>;
    }
    return <img src={decryptedDataUrl} alt="Decrypted content" className={styles.decryptedImage} />;
  };

  const renderStatus = () => {
    switch (verificationStatus) {
      case 'success':
        return renderContent();
      case 'failed':
      case 'invalid':
        return <p className={styles.error}>{error}</p>;
      default:
        return (
          <div>
            <p className={styles.info}>{info}</p>
            <button onClick={handleVerify} className={styles.button} disabled={!isConnected || !policy}>
              Verify Wallet Ownership
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Pattern />
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>Wallet Verification</h1>
        {renderStatus()}
      </div>
    </div>
  );
}
