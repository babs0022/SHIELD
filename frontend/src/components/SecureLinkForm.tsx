'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { isAddress, Hex } from 'viem';
import ShieldABI from '@/lib/Shield.json';

type ShareMode = 'file' | 'text';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Hex | undefined;

const StyledWrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 25px;
    max-width: 550px;
    padding: 40px;
    border-radius: 20px;
    position: relative;
    background-color: transparent;
    color: #fff;
    border: none;
    box-shadow: none;
  }

  .feedback-message {
    font-size: 14px;
    color: #00ff00;
    margin-top: 10px;
    text-align: center;
  }

  .title {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -1px;
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 30px;
    color: #00ff00;
  }

  .title::before { width: 18px; height: 18px; }
  .title::after { width: 18px; height: 18px; animation: pulse 1s linear infinite; }
  .title::before, .title::after {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    border-radius: 50%;
    left: 0px;
    background-color: #00ff00;
  }

  .message { font-size: 15px; color: rgba(255, 255, 255, 0.7); }
  .flex { display: flex; width: 100%; gap: 15px; }
  .form label { position: relative; }

  .form label .input {
    background-color: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    color: #fff;
    width: 100%;
    padding: 20px 10px 10px 10px;
    outline: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: medium;
  }
  
  .form label .textarea {
    height: 120px;
    resize: none;
  }

  .file-label span { color: #00ff00; font-size: 0.75em; font-weight: 600; margin-bottom: 5px; display: block; }
  .file-label .input { padding: 10px; }

  .form label .input + span {
    color: rgba(255, 255, 255, 0.5);
    position: absolute;
    left: 10px;
    top: 15px;
    font-size: 1em;
    cursor: text;
    transition: 0.3s ease;
  }

  .form label .input:placeholder-shown + span { top: 15px; font-size: 1em; }
  .form label .input:focus + span, .form label .input:valid + span { color: #00ff00; top: 4px; font-size: 0.75em; font-weight: 600; }

  .input { font-size: medium; }

  .submit { 
    border: none; 
    outline: none; 
    padding: 12px; 
    border-radius: 10px; 
    color: #fff; 
    font-size: 16px; 
    transform: .3s ease; 
    background-image: linear-gradient(45deg, #00ff00, #008000);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
    font-weight: bold; 
    transition: all 0.3s ease;
  }
  .submit:hover { 
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(0, 255, 0, 0.7);
  }
  .submit:disabled {
    background-image: linear-gradient(45deg, #4b5563, #6b7280);
    box-shadow: none;
    cursor: not-allowed;
    transform: scale(1);
  }
  
  .secureLinkContainer {
    margin-top: 10px;
  }

  .secureLinkTitle {
    color: #00ff00;
    font-size: 0.75em;
    font-weight: 600;
    margin-bottom: 5px; 
    display: block;
  }

  .link-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .link-wrapper input {
    background-color: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    color: #fff;
    width: 100%;
    padding: 10px;
    outline: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 14px;
  }

  .link-wrapper button {
    border: none;
    outline: none;
    padding: 10px;
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    background-color: rgba(0, 255, 0, 0.5);
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .link-wrapper button:hover {
    background-color: rgba(0, 255, 0, 0.8);
  }

  .toggle-container {
    display: flex;
    justify-content: center;
    padding: 4px;
    background-color: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }
  .toggle-container button {
    width: 50%;
    padding: 8px 0;
    border-radius: 10px;
    border: none;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .toggle-container button.active {
    background-color: #00ff00;
    color: #fff;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  }

  @keyframes pulse { from { transform: scale(0.9); opacity: 1; } to { transform: scale(1.8); opacity: 0; } }

  @media (max-width: 768px) {
    .form {
      padding: 20px;
    }

    .title {
      font-size: 24px;
      padding-left: 20px;
    }

    .flex {
      flex-direction: column;
    }
  }
`;

const SecureLinkForm = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error('You must be logged in to create a link.');
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
      let policyId: Hex;
      let policyExists = true;
      while (policyExists) {
        policyId = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')}` as Hex;
        const sender = await publicClient.readContract({
          address: contractAddress,
          abi: ShieldABI.abi,
          functionName: 'policies',
          args: [policyId],
        }) as [string, ...unknown[]];
        if (sender[0] === '0x0000000000000000000000000000000000000000') {
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
        abi: ShieldABI.abi,
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

    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || 'An error occurred.', { id: toastId });
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

  const getButtonText = () => {
    if (status) return status;
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
            <span>Confidential File</span>
            <input className="input" type="file" onChange={handleFileChange} required />
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
        </label>

        <div className="flex access-rules-selector">
          <label>
            <input className="input" type="number" value={expiry} onChange={(e) => setExpiry(Number(e.target.value))} placeholder=" " required />
            <span>Time Limit (seconds)</span>
          </label>
          <label>
            <input className="input" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} placeholder=" " required />
            <span>Max Attempts</span>
          </label>
        </div>  
        
        <button className="submit generate-link-button-selector" type="submit" disabled={isSubmitting || !address}>
          {getButtonText()}
        </button>

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