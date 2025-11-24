'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  
  useEffect(() => {
    document.title = "404 - Page Not Found | Shield";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
      <div className="mb-8 p-6 rounded-full bg-gray-900 border border-gray-800 relative group">
        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-16 h-16 text-green-500 relative z-10"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      
      <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">404</h1>
      
      <div className="max-w-lg space-y-4 mb-10">
        <h2 className="text-2xl font-medium text-gray-200">Are you looking for something?</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          It probably doesn't exist, or the dev ate it. <br/>
          <span className="italic text-gray-500 text-base">He's a funny guy, we know.</span>
        </p>
      </div>
      
      <Link 
        href="/"
        className="group relative px-8 py-4 bg-gray-900 text-white rounded-xl transition-all duration-300 hover:scale-105 border border-gray-800 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(22,163,74,0.3)]"
      >
        <span className="relative z-10 flex items-center gap-2 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Safety
        </span>
      </Link>
    </div>
  );
}
