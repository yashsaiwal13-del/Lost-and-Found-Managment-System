'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ReportSection from '@/components/ReportSection';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-indigo-500 selection:text-white">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero 
          onSearchChange={(q) => setSearchQuery(q)}
          onLocationChange={(loc) => setSelectedLocation(loc)}
        />

        {/* Reporting Section (Interactive Forms for Lost & Found items) */}
        <ReportSection />

        {/* 6. How It Works Section */}
        <HowItWorks />

        {/* 7. Features Section */}
        <Features />
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
