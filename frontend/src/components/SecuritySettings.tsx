"use client";

import React from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import parentStyles from '../app/profile/Profile.module.css';
import dangerStyles from './SecuritySettings.module.css';
import ConfirmModal from './ConfirmModal';

export default function SecuritySettings() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    toast.error("This feature is not yet implemented.");
    setIsModalOpen(false);
  };

  const openConfirmationModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <section className={parentStyles.section} id="settings">
        <h2 className={parentStyles.sectionTitle}>Security Settings</h2>
        
        {/* Future settings can go here */}

        <div className={dangerStyles.dangerZone}>
          <h3 className={dangerStyles.dangerTitle}>Danger Zone</h3>
          <div className={dangerStyles.dangerContent}>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
            <button onClick={openConfirmationModal} className={dangerStyles.dangerButton}>
              Delete My Account
            </button>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Confirm Account Deletion"
        message="Are you sure you want to permanently delete your account? This action cannot be undone."
      />
    </>
  );
}
