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
  const [currentPage, setCurrentPage] = useState(1);
  const [linksPerPage] = useState(5);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('reown-siwe-token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const response = await fetch('/api/user/links', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

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

  // Pagination Logic
  const indexOfLastLink = currentPage * linksPerPage;
  const indexOfFirstLink = indexOfLastLink - linksPerPage;
  const currentLinks = links.slice(indexOfFirstLink, indexOfLastLink);
  const totalPages = Math.ceil(links.length / linksPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageJump = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageNumber = Number(e.target.value);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
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
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Link URL</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentLinks.map(link => (
              <tr key={link.id}>
                <td data-label="Link URL" className={styles.policyId}>{link.url}</td>
                <td data-label="Created At">{new Date(link.createdAt).toLocaleDateString()}</td>
                <td data-label="Actions" className={styles.actions}>
                  <button onClick={() => handleCopy(link.url)}>Copy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.pagination}>
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page 
            <input 
              type="number" 
              value={currentPage} 
              onChange={handlePageJump} 
              min="1" 
              max={totalPages}
              className={styles.pageInput}
            /> 
            of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className={styles.container} id="my-links">
      <h2 className={styles.sectionTitle}>My Shared Links</h2>
      {renderContent()}
    </section>
  );
}
