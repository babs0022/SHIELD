'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { isAddress, Hex } from 'viem';
import { ShieldABI } from '@/lib/ShieldABI';
import axios from 'axios';
import Spinner from './Spinner';
import { CopyIcon } from './CopyIcon';
import styles from './SecureLinkForm.module.css';

type ShareMode = 'file' | 'text';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Hex | undefined;
const baseChainId = base.id;

// Web Crypto API helpers for client-side encryption
async function generateSecretKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function exportKeyToString(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

async function encryptContent(content: BufferSource, key: CryptoKey): Promise<{ encryptedData: ArrayBuffer, iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    content
  );
  return { encryptedData, iv };
}

// Helper to combine IV and encrypted data for upload
function combineIvAndEncryptedData(iv: Uint8Array, encryptedData: ArrayBuffer): Blob {
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData).slice(), iv.length);
  return new Blob([combined]);
}

const SecureLinkForm = () => {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { data: hash, writeContractAsync } = useWriteContract();
  
  const [shareMode, setShareMode] = useState<ShareMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [expiry, setExpiry] = useState<number>(3600);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [secureLink, setSecureLink] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientAddressError, setRecipientAddressError] = useState<string>('');

  const isWrongNetwork = address && chainId !== baseChainId;

  const MAX_FILE_SIZE_MB = 50; // Increased file size limit
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (recipientAddress && !isAddress(recipientAddress)) {
      setRecipientAddressError('Please enter a valid Ethereum address.');
    } else {
      setRecipientAddressError('');
    }
  }, [recipientAddress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = '';
        setFile(null);
      } else {
        setFile(selectedFile);
        // Update the data-file-name attribute for the custom file input label
        const label = e.target.parentElement;
        if (label) {
          label.setAttribute('data-file-name', selectedFile.name);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientAddressError || !address || isWrongNetwork || ((shareMode === 'file' && !file) || (shareMode === 'text' && !textContent.trim())) || !isAddress(recipientAddress) || !contractAddress || !publicClient) {
      toast.error('Please fill out all fields correctly and connect your wallet.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Encrypting content...');
    
    try {
      // Step 1: Encrypt content on the client-side
      setStatus('Encrypting...');
      const secretKey = await generateSecretKey();
      const keyString = await exportKeyToString(secretKey);

      let contentBuffer: ArrayBuffer;
      let mimeType: string;

      if (shareMode === 'file' && file) {
        contentBuffer = await file.arrayBuffer();
        mimeType = file.type;
      } else {
        contentBuffer = new TextEncoder().encode(textContent).buffer;
        mimeType = 'text/plain';
      }

      const { encryptedData, iv } = await encryptContent(contentBuffer, secretKey);
      const finalBlobToUpload = combineIvAndEncryptedData(iv, encryptedData);

      // Step 2: Upload encrypted content directly to Pinata (IPFS)
      setStatus('Working on it...');
      toast.loading('Working on it...', { id: toastId });

      const formData = new FormData();
      formData.append('file', finalBlobToUpload, 'encrypted-content');
      
      const pinataResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`, // Use a new, restricted Pinata API key for client-side uploads
        },
      });

      if (pinataResponse.status !== 200) {
        throw new Error('Failed to pin file to IPFS.');
      }
      const contentCid = pinataResponse.data.IpfsHash;

      // Step 3: Generate unique policyId
      let policyId: Hex = '0x';
      let policyExists = true;
      while (policyExists) {
        policyId = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')}` as Hex;
        const existingPolicy = await publicClient.readContract({
          address: contractAddress,
          abi: ShieldABI,
          functionName: 'policies',
          args: [policyId],
        });
        if (existingPolicy[0] === '0x0000000000000000000000000000000000000000') {
          policyExists = false;
        }
      }

      // Step 4: Sign transaction to create policy on-chain
      setStatus('Confirming...');
      toast.loading('Please confirm in your wallet...', { id: toastId });
      const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + expiry);
      const maxAttemptsBigInt = BigInt(maxAttempts);

      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: ShieldABI,
        functionName: 'createPolicy',
        args: [policyId, recipientAddress, expiryTimestamp, maxAttemptsBigInt],
      });

      // Step 5: Wait for transaction receipt
      setStatus('Processing...');
      toast.loading('Processing transaction...', { id: toastId });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Step 6: Store public metadata (NO secret key)
      const storeResponse = await fetch('/api/storeMetadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId, creatorId: address, contentCid, recipientAddress,
          mimeType, isText: shareMode === 'text', expiry: expiry.toString(), maxAttempts: maxAttempts.toString(),
        }),
      });
      if (!storeResponse.ok) throw new Error((await storeResponse.json()).error || 'Failed to store metadata.');
      const { link } = await storeResponse.json();

      // Step 7: Construct final link with secret key in URL fragment
      const finalLink = `${link}#${encodeURIComponent(keyString)}`;
      setSecureLink(finalLink);
      toast.success('Secure link generated successfully!', { id: toastId });

    } catch (error: any) {
      console.error(error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.message && error.message.includes('User rejected the request')) {
        errorMessage = 'Wallet signature rejected. Please try again.';
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `Upload failed: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
      setStatus('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secureLink).then(() => {
      toast.success('Link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast.error('Failed to copy link.');
    });
  };

  const getButtonContent = () => {
    if (isSubmitting) {
      return (
        <>
          <Spinner />
          {status || 'Processing...'}
        </>
      );
    }
    if (isWrongNetwork) return 'Wrong Network';
    if (!address) return 'Sign in to Generate Link';
    return 'Generate Link';
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.title}>Create a Secure Link</p>
        <p className={styles.message}>Upload a resource and define the terms for access.</p>
        
        <div className={styles.toggleContainer}>
          <button type="button" onClick={() => setShareMode('file')} className={shareMode === 'file' ? styles.active : ''}>File</button>
          <button type="button" onClick={() => setShareMode('text')} className={shareMode === 'text' ? styles.active : ''}>Text</button>
        </div>

        {shareMode === 'file' ? (
          <label className={styles.fileLabel}>
            <span>CONFIDENTIAL FILE</span>
            <input type="file" onChange={handleFileChange} required />
            <div 
              className={`${styles.fileInputDisplay} ${file ? styles.hasFile : ''}`}
              data-file-name={file ? file.name : ''}
            ></div>
          </label>
        ) : (
          <label className={styles.label}>
            <textarea className={styles.textarea} value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder=" " required />
            <span>CONFIDENTIAL TEXT</span>
          </label>
        )}

        <label className={styles.label}>
          <input className={styles.input} type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder=" " required />
          <span>RECIPIENT ADDRESS</span>
          {recipientAddressError && <p className={styles.errorMessage}>{recipientAddressError}</p>}
        </label>

        <div className={styles.flex}>
          <label className={styles.label}>
            <input className={styles.input} type="number" value={expiry} onChange={(e) => setExpiry(Number(e.target.value))} placeholder=" " required />
            <span>TIME LIMIT (SECONDS)</span>
          </label>
          <label className={styles.label}>
            <input className={styles.input} type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} placeholder=" " required />
            <span>MAX ATTEMPTS</span>
          </label>
        </div>  
        
        {isWrongNetwork ? (
          <button className={`${styles.submit} ${styles.switchNetworkButton}`} type="button" onClick={() => switchChain({ chainId: baseChainId })}>
            Switch to Base Network
          </button>
        ) : (
          <button className={`${styles.submit} ${styles.generateLinkButtonSelector}`} type="submit" disabled={isSubmitting || !address || !!recipientAddressError}>
            {getButtonContent()}
          </button>
        )}

        {secureLink && (
          <div className={styles.secureLinkContainer}>
            <span className={styles.secureLinkTitle}>Your Secure Link</span>
            <div className={styles.linkWrapper}>
              <input type="text" readOnly value={secureLink} />
              <button type="button" onClick={handleCopy}>
                <CopyIcon /> Copy
              </button>
            </div>
            <p className={styles.warningMessage}>
              <strong>Important:</strong> Copy this link now. The decryption key is not stored and will not be shown again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

export default SecureLinkForm;