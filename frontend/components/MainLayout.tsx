"use client";

import React from 'react';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * MainLayout component that wraps page content with common layout elements
 * including the header and main content container
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-body-bg dark:bg-body-bg">
        {children}
      </main>
    </>
  );
};

export default MainLayout; 