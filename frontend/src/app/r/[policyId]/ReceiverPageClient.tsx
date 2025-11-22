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
import DownloadIcon from '@/components/DownloadIcon';
import CopyIcon from '@/components/CopyIcon';

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failed' | 'invalid';
export interface Policy {
  resourceCid: string;
  recipient_address: string;
  secretKey: string;
  mimeType: string;
  isText: boolean;
}

export default function ReceiverPageClient({ policy: initialPolicy }: { policy: Policy | null }) {
  const params = useParams();
  const policyId = params?.policyId as `0x${string}`;
  const { address, isConnected, status } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('Loading...');
  const [decryptedDataUrl, setDecryptedDataUrl] = useState<string>('');
  const [policy, setPolicy] = useState<Policy | null>(initialPolicy);

  useEffect(() => {
    if (initialPolicy) {
      if (status === 'connecting' || status === 'reconnecting') {
        setInfo('Connecting to wallet...');
      } else if (status === 'disconnected') {
        setInfo('Please connect your wallet to verify ownership.');
      } else if (status === 'connected') {
        setInfo('Please verify your wallet to access the content.');
      }
    } else {
      setVerificationStatus('invalid');
      setError('Policy not found or backend error.');
    }
  }, [initialPolicy, status]);

  // Effect to clean up the object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (decryptedDataUrl && decryptedDataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(decryptedDataUrl);
      }
    };
  }, [decryptedDataUrl]);

  const handleVerify = async () => {
    if (status !== 'connected' || !address || !policy) {
      toast.error('Please connect your wallet first.');
      return;
    }

    if (address.toLowerCase() !== policy.recipient_address.toLowerCase()) {
      setError('This content is not for you. The connected wallet does not match the recipient address.');
      setVerificationStatus('failed');
      toast.error('Incorrect wallet connected.');
      return;
    }

    setVerificationStatus('verifying');
    setInfo('Please sign the message in your wallet to prove ownership...');

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

      setInfo('Verifying signature...');
      const response = await fetch('/api/verify-siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, policyId }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Signature verification failed on the server.');
      }

      const { secretKey } = await response.json();
      toast.success('Wallet verified!');
      setInfo('Decrypting content...');
      await decryptAndSetResource({ ...policy, secretKey });
      setVerificationStatus('success');

    } catch (err: any) {
      setVerificationStatus('failed');
      let errorMessage = 'An unexpected error occurred.';
      if (err.message.includes('User rejected the request')) {
        errorMessage = 'You rejected the signature request. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(`Verification failed: ${errorMessage}`);
      toast.error(errorMessage);
    }
  };

  const decryptAndSetResource = async (policyData: Policy) => {
    try {
      const response = await fetch(`/api/getEncryptedContent/${policyData.resourceCid}`);
      if (!response.ok) {
        const { error, details } = await response.json();
        throw new Error(error || details || 'Failed to fetch the encrypted content from the server.');
      }
      
      const { encryptedData } = await response.json();
      if (!encryptedData) {
        throw new Error('Encrypted data is missing from the server response.');
      }
      
      const decryptedWordArray = CryptoJS.AES.decrypt(encryptedData, policyData.secretKey);

      if (policyData.isText) {
        const decryptedText = decryptedWordArray.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
          throw new Error('Decryption resulted in empty text. The secret key may be incorrect.');
        }
        setDecryptedDataUrl(decryptedText);
      } else {
        const decryptedBase64 = decryptedWordArray.toString(CryptoJS.enc.Base64);
        if (!decryptedBase64) {
          throw new Error('Decryption resulted in empty data. The secret key may be incorrect.');
        }
        const fetchRes = await fetch(`data:${policyData.mimeType};base64,${decryptedBase64}`);
        const blob = await fetchRes.blob();
        const url = URL.createObjectURL(blob);
        setDecryptedDataUrl(url);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown decryption error occurred.';
      setError(`Decryption failed: ${errorMessage}`);
      setVerificationStatus('failed');
      toast.error(`Decryption failed. Please try again.`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(decryptedDataUrl).then(() => {
      toast.success('Copied to clipboard!');
    }, (err) => {
      toast.error('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  const renderContent = () => {
    if (!decryptedDataUrl || !policy) return null;
    const fileName = `decrypted_image.${policy.mimeType.split('/')[1] || 'png'}`;

    if (policy.isText) {
      return (
        <div className={styles.textContainer}>
          <p className={styles.decryptedText}>{decryptedDataUrl}</p>
          <CopyIcon className={styles.copyIcon} onClick={handleCopy} />
        </div>
      );
    }

    if (policy.mimeType.startsWith('image/')) {
      return (
        <div className={styles.imageContainer}>
          <img src={decryptedDataUrl} alt="Decrypted content" className={styles.decryptedImage} />
          <a href={decryptedDataUrl} download={fileName} className={styles.downloadIcon}>
            <DownloadIcon />
          </a>
        </div>
      );
    }

    if (policy.mimeType === 'application/pdf') {
      return (
        <embed 
          src={decryptedDataUrl} 
          type="application/pdf" 
          width="100%" 
          height="600px" 
          className={styles.decryptedPdf}
        />
      );
    }

    const downloadFileName = `decrypted_file.${policy.mimeType.split('/')[1] || 'bin'}`;
    return (
      <div className={styles.downloadContainer}>
        <p>Content type: {policy.mimeType}</p>
        <a href={decryptedDataUrl} download={downloadFileName} className={styles.downloadButton}>
          Download File
        </a>
      </div>
    );
  };

  const renderStatus = () => {
    switch (verificationStatus) {
      case 'success':
        return renderContent();
      case 'failed':
      case 'invalid':
        return <p className={styles.error}>{error}</p>;
      case 'verifying':
        return <p className={styles.info}>{info}</p>;
      default:
        return (
          <div>
            <p className={styles.info}>{info}</p>
            <button onClick={handleVerify} className={styles.button} disabled={status !== 'connected' || !policy}>
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
