'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { isAddress, Hex } from 'viem';
import { ShieldABI } from '@/lib/ShieldABI';
import Spinner from './Spinner';

type ShareMode = 'file' | 'text';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Hex | undefined;
const baseChainId = base.id;

const StyledWrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 550px;
    padding: 30px;
    border-radius: 20px;
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e4e4e7; /* zinc-200 */
  }

  .title {
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -1px;
    background: linear-gradient(to bottom right, #ffffff, #a1a1aa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    margin-bottom: 10px;
  }

  .message {
    font-size: 14px;
    color: #a1a1aa; /* zinc-400 */
    text-align: center;
    margin-bottom: 20px;
  }

  .flex { display: flex; width: 100%; gap: 15px; }
  .form label { position: relative; }

  .form label .input {
    background-color: rgba(0, 0, 0, 0.2);
    color: #e4e4e7;
    width: 100%;
    padding: 15px 10px 10px 10px;
    outline: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .form label .input:focus {
    border-color: #6366f1; /* indigo-500 */
  }
  
  .form label .textarea {
    height: 100px;
    resize: none;
  }

  .file-label span, .form label .input + span, .form label .timeLimitLabel, .form label .maxAttemptsLabel {
    color: #a1a1aa; /* zinc-400 */
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: absolute;
    left: 10px;
    top: 5px;
    transition: 0.3s ease;
  }

  .form label .input:placeholder-shown + span {
    top: 15px;
    font-size: 14px;
    text-transform: none;
    letter-spacing: normal;
  }

  .form label .input:focus + span, .form label .input:valid + span {
    color: #6366f1; /* indigo-500 */
    top: 5px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .error-message {
    color: #ef4444; /* red-500 */
    font-size: 12px;
    margin-top: 5px;
    padding-left: 10px;
  }

  .submit { 
    border: none; 
    outline: none; 
    padding: 12px; 
    border-radius: 100px; 
    color: #000; 
    font-size: 14px; 
    font-weight: 500;
    background-color: #ffffff;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .submit:hover { 
    background-color: #e4e4e7; /* zinc-200 */
  }
  .submit:disabled {
    background-color: #3f3f46; /* zinc-700 */
    color: #71717a; /* zinc-500 */
    box-shadow: none;
    cursor: not-allowed;
  }
  
  .switch-network-button {
    background-color: #f59e0b; /* amber-500 */
    color: #000;
  }
  .switch-network-button:hover {
    background-color: #fbbf24; /* amber-400 */
  }

  .secureLinkContainer {
    margin-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
  }

  .secureLinkTitle {
    color: #a1a1aa; /* zinc-400 */
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px; 
    display: block;
  }

  .link-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .link-wrapper input {
    background-color: rgba(0, 0, 0, 0.3);
    color: #e4e4e7;
    width: 100%;
    padding: 10px;
    outline: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 14px;
    font-family: monospace;
  }

  .link-wrapper button {
    border: none;
    outline: none;
    padding: 10px;
    border-radius: 8px;
    color: #e4e4e7;
    font-size: 12px;
    background-color: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .link-wrapper button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .toggle-container {
    display: flex;
    justify-content: center;
    padding: 4px;
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 100px;
  }
  .toggle-container button {
    width: 50%;
    padding: 8px 0;
    border-radius: 100px;
    border: none;
    background-color: transparent;
    color: #a1a1aa; /* zinc-400 */
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .toggle-container button.active {
    background-color: #6366f1; /* indigo-500 */
    color: #fff;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
  }

  @media (max-width: 768px) {
    .form {
      padding: 20px;
    }
    .flex {
      flex-direction: column;
    }
  }
`;

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

  const MAX_FILE_SIZE_MB = 50;
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
        e.target.value = ''; // Clear the file input
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientAddressError) {
      toast.error('Please correct the errors before submitting.');
      return;
    }
    if (!address) {
      toast.error('You must be logged in to create a link.');
      return;
    }
    if (isWrongNetwork) {
      toast.error('Please switch to the Base network to create a link.');
      return;
    }
    if ((shareMode === 'file' && !file) || (shareMode === 'text' && !textContent.trim())) {
      toast.error('Please provide the content you want to share.');
      return;
    }
    if (!isAddress(recipientAddress)) {
      toast.error('Please provide a valid recipient address.');
      return;
    }
    if (!contractAddress || !publicClient) {
      toast.error('Contract or client is not ready. Please try again.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Preparing content...');
    
    try {
      // Step 1: Prepare content
      setStatus('Preparing...');
      const formData = new FormData();
      if (shareMode === 'file' && file) {
        formData.append('content', file);
        formData.append('mimeType', file.type);
      } else {
        formData.append('content', textContent);
        formData.append('mimeType', 'text/plain');
      }
      const isText = shareMode === 'text';
      formData.append('isText', isText.toString());

      const prepareResponse = await fetch('/api/prepareContent', { method: 'POST', body: formData });
      if (!prepareResponse.ok) throw new Error((await prepareResponse.json()).error || 'Failed to prepare content.');
      const { contentCid, secretKey, mimeType } = await prepareResponse.json();

      // Step 2: Generate unique policyId
      let policyId: Hex = '0x'; // Initialize to satisfy TypeScript
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

      // Step 3: Sign transaction
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

      // Step 4: Wait for transaction receipt
      setStatus('Processing...');
      toast.loading('Processing transaction...', { id: toastId });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Step 5: Store metadata
      const storeResponse = await fetch('/api/storeMetadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId, creatorId: address, contentCid, recipientAddress,
          secretKey, mimeType, isText, expiry: expiry.toString(), maxAttempts: maxAttempts.toString(),
        }),
      });
      if (!storeResponse.ok) throw new Error((await storeResponse.json()).error || 'Failed to store metadata.');
      const { link } = await storeResponse.json();

      setSecureLink(link);
      toast.success('Secure link generated successfully!', { id: toastId });

    } catch (error: any) {
      console.error(error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.message && error.message.includes('User rejected the request')) {
        errorMessage = 'Wallet signature rejected. Please confirm the transaction in your wallet to create the link.';
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
    <StyledWrapper>
      <form className="form secure-link-form-selector" onSubmit={handleSubmit}>
        <p className="title">Create a Secure Link</p>
        <p className="message">Upload a resource and define the terms for access.</p>
        
        <div className="toggle-container">
          <button type="button" onClick={() => setShareMode('file')} className={shareMode === 'file' ? 'active' : ''}>File</button>
          <button type="button" onClick={() => setShareMode('text')} className={shareMode === 'text' ? 'active' : ''}>Text</button>
        </div>

        {shareMode === 'file' ? (
          <label className="file-label">
            <input className="input" type="file" onChange={handleFileChange} required />
            <span>Confidential File</span>
          </label>
        ) : (
          <label>
            <textarea className="input textarea" value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder=" " required />
            <span>Confidential Text</span>
          </label>
        )}

        <label>
          <input className="input" type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder=" " required />
          <span>Recipient Address</span>
          {recipientAddressError && <p className="error-message">{recipientAddressError}</p>}
        </label>

        <div className="flex access-rules-selector">
          <label>
            <input className="input" type="number" value={expiry} onChange={(e) => setExpiry(Number(e.target.value))} placeholder=" " required />
            <span className="timeLimitLabel">Time Limit (seconds)</span>
          </label>
          <label>
            <input className="input" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} placeholder=" " required />
            <span className="maxAttemptsLabel">Max Attempts</span>
          </label>
        </div>  
        
        {isWrongNetwork ? (
          <button className="submit switch-network-button" type="button" onClick={() => switchChain({ chainId: baseChainId })}>
            Switch to Base Network
          </button>
        ) : (
          <button className="submit generate-link-button-selector" type="submit" disabled={isSubmitting || !address || !!recipientAddressError}>
            {getButtonContent()}
          </button>
        )}

        {secureLink && (
          <div className="secureLinkContainer">
            <span className="secureLinkTitle">Your Secure Link</span>
            <div className="link-wrapper">
              <input type="text" readOnly value={secureLink} />
              <button type="button" onClick={handleCopy}>Copy</button>
            </div>
          </div>
        )}
      </form>
    </StyledWrapper>
  );
}

export default SecureLinkForm;