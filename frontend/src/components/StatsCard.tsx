'use client';
import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number | string;
}

const StatsCard = ({ title, value }: StatsCardProps) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>{value}</p>
    </div>
  );
};

export default StatsCard;