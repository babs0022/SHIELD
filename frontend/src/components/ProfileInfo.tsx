"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import styles from './ProfileInfo.module.css';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ProfileInfoProps {
  user: {
    uid: string;
  };
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const { profile, updateProfile, isLoading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [pfpUrl, setPfpUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPfpUrl(profile.pfpUrl || '');
      setPreviewUrl(profile.pfpUrl || '');
    }
  }, [profile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading('Saving profile...');
    try {
      let finalPfpUrl = pfpUrl;

      if (selectedFile) {
        const response = await fetch('/api/avatar/upload', {
          method: 'POST',
          headers: { 'content-type': selectedFile.type },
          body: selectedFile,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image.');
        }

        const newBlob = await response.json();
        finalPfpUrl = newBlob.url;
      }

      await updateProfile({ displayName, pfpUrl: finalPfpUrl });
      setIsEditing(false);
      toast.success('Profile saved!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save profile.', { id: toastId });
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Profile Information</h2>
      
      {isEditing ? (
        <div className={styles.avatarUploader}>
          <Image
            src={previewUrl || '/default-avatar.png'} // A default avatar image
            alt="Profile Preview"
            width={80}
            height={80}
            className={styles.avatar}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/png, image/jpeg"
          />
          <button onClick={() => fileInputRef.current?.click()} className={styles.uploadButton}>
            Change Picture
          </button>
        </div>
      ) : (
        previewUrl && <Image src={previewUrl} alt="Profile Picture" width={80} height={80} className={styles.avatar} />
      )}

      <div className={styles.info}>
        <p className={styles.label}>Wallet Address</p>
        <p className={styles.value}>{user.uid}</p>
      </div>
      
      <div className={styles.info}>
        <p className={styles.label}>Display Name</p>
        {isEditing ? (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
          />
        ) : (
          <p className={styles.value}>{profile?.displayName}</p>
        )}
      </div>

      {isEditing ? (
        <div className={styles.actions}>
          <button onClick={() => setIsEditing(false)} className={`${styles.button} ${styles.cancelButton}`}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.button}>
            Save
          </button>
        </div>
      ) : (
        <button onClick={() => setIsEditing(true)} className={styles.button}>
          Edit Profile
        </button>
      )}
    </div>
  );
}