'use client';

import React, { useState } from 'react';
import { 
  Search, 
  AlertCircle, 
  PlusCircle, 
  Compass, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { STATS } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';

interface HeroProps {
  onSearchChange?: (query: string) => void;
  onLocationChange?: (location: string) => void;
}

export default function Hero({ onSearchChange, onLocationChange }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(searchQuery);
    if (onLocationChange) onLocationChange(selectedLocation);
    // Smooth scroll down to browse section
    const browseSection = document.getElementById('browse');
    if (browseSection) {
      browseSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-white pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-200/40 via-blue-100/30 to-emerald-100/20 blur-3xl opacity-70 pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-800 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Official College Lost & Found Management System</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Lost something on campus? <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
              We&apos;ll help you get it back.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            CampusFind connects students, faculty, and campus security in one transparent hub.
            Report lost belongings, log items you found, or verify ownership claims directly with security.
          </p>

          {/* The 3 Core Action CTAs (Explicitly Requested) */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            
            {/* Button 1: Report Lost Item */}
            <a
              href="/report-lost"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] shadow-md shadow-rose-600/25 transition-all duration-200"
            >
              <AlertCircle className="h-4 w-4" />
              Report Lost Item
            </a>

            {/* Button 2: Report Found Item */}
            <a
              href="/report-found"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/25 transition-all duration-200"
            >
              <PlusCircle className="h-4 w-4" />
              Report Found Item
            </a>

            {/* Button 3: Student Portal & Dashboard */}
            <a
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 active:scale-[0.98] shadow-xs hover:border-slate-400 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Student Dashboard
            </a>

          </div>

          {/* Quick Search Card */}
          <div className="mt-12 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2.5">
              
              <div className="flex items-center gap-2.5 w-full sm:flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search item name (e.g. AirPods, ID Card, Hydro Flask)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (onSearchChange) onSearchChange(e.target.value);
                  }}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    if (onLocationChange) onLocationChange(e.target.value);
                  }}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-xs"
              >
                Search
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Trust Highlights */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-200/60">
            {STATS.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
