'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Pattern from '@/components/Pattern';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { toast } from 'react-hot-toast';
import styles from './ReceiverPage.module.css';
import DownloadIcon from '@/components/DownloadIcon';
import { CopyIcon } from '@/components/CopyIcon';

// Web Crypto API helpers for client-side decryption
async function importKeyFromString(keyString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(keyString);
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function decryptContent(encryptedDataWithIv: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = new Uint8Array(encryptedDataWithIv.slice(0, 12));
  const encryptedData = encryptedDataWithIv.slice(12);
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failed' | 'invalid';
export interface Policy {
  resourceCid: string;
  recipient_address: string;
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
        chainId: 1, // This should ideally be dynamic based on the connected chain
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
      
      toast.success('Wallet verified!');
      setInfo('Decrypting content...');
      
      const keyString = decodeURIComponent(window.location.hash.substring(1));
      if (!keyString) {
        throw new Error('Decryption key not found in URL. Make sure you have the correct link.');
      }
      
      const decryptionSuccessful = await decryptAndSetResource(policy, keyString);
      if (decryptionSuccessful) {
        setVerificationStatus('success');
      } else {
        // Error state is already set within decryptAndSetResource
        setVerificationStatus('failed');
      }

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

  const decryptAndSetResource = async (policyData: Policy, keyString: string): Promise<boolean> => {
    try {
      const secretKey = await importKeyFromString(keyString);

      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${policyData.resourceCid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch the encrypted content from IPFS.');
      }
      
      const encryptedDataWithIv = await response.arrayBuffer();
      if (!encryptedDataWithIv) {
        throw new Error('Encrypted data is missing from IPFS response.');
      }
      
      const decryptedBuffer = await decryptContent(encryptedDataWithIv, secretKey);

      if (policyData.isText) {
        const decryptedText = new TextDecoder().decode(decryptedBuffer);
        if (!decryptedText) {
          throw new Error('Decryption resulted in empty text. The secret key may be incorrect.');
        }
        setDecryptedDataUrl(decryptedText);
      } else {
        const blob = new Blob([decryptedBuffer], { type: policyData.mimeType });
        const url = URL.createObjectURL(blob);
        setDecryptedDataUrl(url);
      }
      return true; // Decryption successful
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown decryption error occurred.';
      setError(`Decryption failed: ${errorMessage}`);
      toast.error(`Decryption failed. The link may have been tampered with or the key is incorrect.`);
      return false; // Decryption failed
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
        {verificationStatus === 'success' ? (
          <>
            <h1 className={styles.title}>Here's your Content</h1>
            <p className={styles.subtitle}>You can now copy, download or save.</p>
          </>
        ) : (
          <h1 className={styles.title}>Wallet Verification</h1>
        )}
        {renderStatus()}
      </div>
    </div>
  );
}
