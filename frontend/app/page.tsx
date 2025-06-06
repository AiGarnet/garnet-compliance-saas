"use client";

import React from 'react';
import GarnetLandingPage from '../components/GarnetLandingPage';
import MinimalFooter from '../components/MinimalFooter';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <GarnetLandingPage />
      <MinimalFooter />
    </div>
  );
}

export default Home; 