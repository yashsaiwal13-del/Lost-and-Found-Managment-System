'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Filter, 
  X, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Building2, 
  SlidersHorizontal,
  ChevronDown,
  Info,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CampusItem, Category } from '@/types';
import { MOCK_ITEMS, CATEGORIES, CAMPUS_LOCATIONS } from '@/data/mockData';

export default function BrowseFoundPage() {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modal State for "View Details"
  const [selectedItem, setSelectedItem] = useState<CampusItem | null>(null);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Filter only found items
  const foundItems = useMemo(() => {
    return MOCK_ITEMS.filter((item) => item.type === 'found');
  }, []);

  // Multi-criteria client-side live filtering
  const filteredItems = useMemo(() => {
    return foundItems.filter((item) => {
      // 1. Search Query filter (matches title, description, or location)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesLocation = item.location.toLowerCase().includes(query);
        const matchesStorage = item.storageLocation?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesStorage) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Location filter
      if (selectedLocation !== 'All Locations' && item.location !== selectedLocation) {
        return false;
      }

      // 4. Date filter (based on item.daysAgo)
      if (selectedDateFilter === 'today' && (item.daysAgo ?? 0) > 0) {
        return false;
      }
      if (selectedDateFilter === 'past3days' && (item.daysAgo ?? 0) > 3) {
        return false;
      }
      if (selectedDateFilter === 'pastweek' && (item.daysAgo ?? 0) > 7) {
        return false;
      }
      if (selectedDateFilter === 'pastmonth' && (item.daysAgo ?? 0) > 30) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return (a.daysAgo ?? 0) - (b.daysAgo ?? 0);
      }
      if (sortBy === 'oldest') {
        return (b.daysAgo ?? 0) - (a.daysAgo ?? 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [foundItems, searchQuery, selectedCategory, selectedLocation, selectedDateFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All Locations');
    setSelectedDateFilter('all');
    setSortBy('newest');
  };

  const activeFiltersCount = [
    searchQuery.trim() !== '',
    selectedCategory !== 'All',
    selectedLocation !== 'All Locations',
    selectedDateFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Browse Found Registry</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Campus Found Registry
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Browse Found Items
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Explore items currently held in campus security custody or registered by finders.
              </p>
            </div>

            {/* Quick Action Links */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                href="/report-lost"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
              >
                Can&apos;t find yours? Report Lost
              </Link>
              <Link
                href="/report-found"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
              >
                + Report Found Item
              </Link>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs mb-8 space-y-4">
          
          {/* Top Row: Search Bar + Sort */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* 1. Search Bar */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keyword, item name, brand, or campus building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Item Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Filters Grid (Category, Location, Date) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            
            {/* 2. Category Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Categories ({foundItems.length})</option>
                {CATEGORIES.map((cat) => {
                  const count = foundItems.filter((i) => i.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Location Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Campus Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Date Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Date Found
              </label>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="past3days">Past 3 Days</option>
                <option value="pastweek">Past Week</option>
                <option value="pastmonth">Past Month</option>
              </select>
            </div>

          </div>

          {/* Active Filters Summary Bar */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Found <span className="font-bold text-slate-900">{filteredItems.length}</span> matching items with {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}.
              </span>
              <button
                onClick={handleResetFilters}
                className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Clear all filters
              </button>
            </div>
          )}

        </div>

        {/* 5. Item Cards Grid */}
        {filteredItems.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No matching items found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              We couldn&apos;t find any found items matching your current filters. Try searching with different keywords or clearing your criteria.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Reset All Filters
              </button>
              <Link
                href="/report-lost"
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                File a Lost Report
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Found Item
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {item.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    <Link href={`/items/${item.id}`}>
                      {item.title}
                    </Link>
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Location & Date */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  {/* Current Storage Custody Pill */}
                  {item.storageLocation && (
                    <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                      <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.storageLocation}</span>
                    </div>
                  )}

                </div>

                {/* Card Footer with "View Details" button */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    #{item.id}
                  </span>

                  {/* 6. View Details Button (Requested) */}
                  <Link
                    href={`/items/${item.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs active:scale-95 transition-all"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* Interactive "View Details" Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {claimSubmitted ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Claim Request Submitted</h3>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Campus Security has received your claim for <span className="font-semibold text-slate-800">{selectedItem.title}</span>. Please bring your college student ID to {selectedItem.storageLocation || 'Campus Security Office'} for verification.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs">
                  Claim Reference: #CLM-{(Math.floor(1000 + Math.random() * 9000))}
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Header tags */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    <CheckCircle2 className="h-3 w-3" /> Found Item
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedItem.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-auto">
                    #{selectedItem.id}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {selectedItem.title}
                </h2>

                {/* Item Details Grid */}
                <div className="mt-5 space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Found Location</span>
                      <span className="font-semibold text-slate-800">{selectedItem.location}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Discovery Date</span>
                      <span className="text-slate-700 font-medium">{selectedItem.date}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Custody Desk</span>
                      <span className="font-semibold text-emerald-800">{selectedItem.storageLocation || 'Campus Security Main Locker'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Turned in by</span>
                      <span className="text-slate-700 capitalize">{selectedItem.reportedBy.role}: {selectedItem.reportedBy.name}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-1">
                    Description &amp; Public Notes
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 p-3 rounded-xl">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Safety & Verification Notice */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    To protect genuine owners, campus security requires student ID and specific identifying proof (like serial number, screen unlock, or case details) prior to release.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setClaimSubmitted(true)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    Claim This Item
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
