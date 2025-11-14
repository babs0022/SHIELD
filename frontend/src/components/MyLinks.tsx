"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import styles from './MyLinks.module.css';

interface Link {
  id: string;
  createdAt: string;
  url: string;
}

export default function MyLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/links');
        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Failed to fetch links.');
        }
        const data = await response.json();
        setLinks(data.links);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(err => {
      toast.error('Failed to copy link.');
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <p>Loading links...</p>;
    }
    if (error) {
      return <p className={styles.error}>Error: {error}</p>;
    }
    if (links.length === 0) {
      return <p>You haven't created any links yet.</p>;
    }
    return (
      <ul className={styles.linkList}>
        {links.map(link => (
          <li key={link.id} className={styles.linkItem}>
            <div className={styles.linkInfo}>
              <span className={styles.linkUrl}>{link.url}</span>
              <span className={styles.linkDate}>
                Created on: {new Date(link.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button onClick={() => handleCopy(link.url)} className={styles.copyButton}>
              Copy
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={styles.section} id="my-links">
      <h2 className={styles.sectionTitle}>My Shared Links</h2>
      {renderContent()}
    </section>
  );
}
