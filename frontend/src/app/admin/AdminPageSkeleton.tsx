import React from 'react';
import SkeletonLoader from '@/components/SkeletonLoader';
import styles from './AdminPage.module.css';

const AdminPageSkeleton = () => {
  return (
    <div className={styles.container}>
      <SkeletonLoader width="300px" height="36px" className={styles.titleSkeleton} />

      <div className={styles.statsGrid}>
        <SkeletonLoader height="100px" />
        <SkeletonLoader height="100px" />
        <SkeletonLoader height="100px" />
        <SkeletonLoader height="100px" />
      </div>

      <div className={styles.section}>
        <SkeletonLoader width="250px" height="28px" />
        <div style={{ height: '2rem' }}></div>
        <SkeletonLoader height="50px" />
        <div style={{ height: '1rem' }}></div>
        <SkeletonLoader height="50px" />
        <div style={{ height: '1rem' }}></div>
        <SkeletonLoader height="50px" width="120px" />
      </div>

      <div className={styles.section}>
        <SkeletonLoader width="250px" height="28px" />
        <div style={{ height: '2rem' }}></div>
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="40px" />
      </div>
    </div>
  );
};

export default AdminPageSkeleton;
