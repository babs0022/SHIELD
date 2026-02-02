import React from 'react';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className, width, height }) => {
  const style = {
    width: width,
    height: height,
  };
  return <div className={`${styles.skeleton} ${className}`} style={style}></div>;
};

export default SkeletonLoader;
