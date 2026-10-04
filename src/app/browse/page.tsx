'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowUpDown,
  Loader2,
  Trash2,
  AlertTriangle,
  Eye,
  Shield,
  RefreshCw,
  User,
  ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CampusItem, Category } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { getFoundItemsFromDatabase } from '@/app/actions/getFoundItems';
import { getCurrentUser } from '@/app/actions/auth';
import { archiveReport } from '@/app/actions/moderation';

export default function BrowseFoundPage() {
  const router = useRouter();

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modal States
  const [selectedItem, setSelectedItem] = useState<CampusItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CampusItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Found items loaded from PostgreSQL
  const [foundItems, setFoundItems] = useState<CampusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verify Role: Access restricted to ADMIN and SECURITY only
  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (!user) {
          router.replace('/login?callbackUrl=/browse');
          return;
        }

        if (user.role !== 'ADMIN' && user.role !== 'SECURITY') {
          router.replace('/dashboard?denied=true&message=Campus+registry+browsing+is+restricted+to+authorized+staff');
          return;
        }

        setCurrentUser(user);
        setAuthChecking(false);
      })
      .catch((err) => {
        console.error('Auth verification error:', err);
        router.replace('/login?callbackUrl=/browse');
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Fetch real found items from database on mount
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const items = await getFoundItemsFromDatabase();
      setFoundItems(items || []);
    } catch (err) {
      console.error('Database found items load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecking) {
      fetchItems();
    }
  }, [authChecking]);

  // Dynamic locations from campus defaults plus custom database locations
  const locationOptions = useMemo(() => {
    const list = [...CAMPUS_LOCATIONS];
    foundItems.forEach((item) => {
      if (item.location && !list.includes(item.location)) {
        list.push(item.location);
      }
    });
    return list;
  }, [foundItems]);

  // Multi-criteria live filtering
  const filteredItems = useMemo(() => {
    return foundItems
      .filter((item) => {
        // 1. Search Query filter
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(query);
          const matchesDesc = item.description.toLowerCase().includes(query);
          const matchesLocation = item.location.toLowerCase().includes(query);
          const matchesStorage = item.storageLocation?.toLowerCase().includes(query);
          const matchesId = item.id.toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesStorage && !matchesId) {
            return false;
          }
        }

        // 2. Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // 3. Location filter
        if (selectedLocation !== 'All Locations') {
          const itemLoc = item.location.toLowerCase();
          const selLoc = selectedLocation.toLowerCase();
          if (!itemLoc.includes(selLoc) && item.location !== selectedLocation) {
            return false;
          }
        }

        // 4. Date filter
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
      })
      .sort((a, b) => {
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

  // Handle Delete / Archive Confirmation
  const handleDeleteReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const reason = deleteReason.trim() || 'Deleted from Campus Registry by Administrator';
      const res = await archiveReport(itemToDelete.id, reason);

      if (!res.success) {
        throw new Error(res.error || 'Failed to delete report.');
      }

      // Remove deleted item from local state
      setFoundItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));

      if (selectedItem?.id === itemToDelete.id) {
        setSelectedItem(null);
      }

      setItemToDelete(null);
      setDeleteReason('');
      setToastMessage(`Report #${itemToDelete.id} successfully deleted from the active registry.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err?.message || 'Failed to delete report.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Verifying administrator authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Admin Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner with Admin Context */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Administrative Registry Console • {currentUser?.role} Mode</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Campus Registry of Found Property
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Official directory of active discovered items logged into campus security custody. Manage entries, review custody storage, and delete outdated reports.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={fetchItems}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Refresh Registry</span>
              </button>

              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs"
              >
                <span>Admin Operations</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keyword, item name, storage desk, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full sm:w-auto text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
              >
                <option value="All Locations">All Locations</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}

          </div>

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>
              Showing <strong className="text-slate-800">{filteredItems.length}</strong> active found {filteredItems.length === 1 ? 'item' : 'items'} in campus registry
            </span>
            <span className="text-[11px] text-slate-400">
              Only items held in campus custody are listed
            </span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="p-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
            <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading campus registry database...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Found Items Match Criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No registered items match the selected search query or filters. Try adjusting your search keywords.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Found Items Cards Grid */}
        {!isLoading && filteredItems.length > 0 && (
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
                  <h3
                    onClick={() => setSelectedItem(item)}
                    className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
                  >
                    {item.title}
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

                {/* Card Footer with "View Details" and "Delete" buttons */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    #{item.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Delete Option (Admin-only action) */}
                    <button
                      onClick={() => setItemToDelete(item)}
                      title="Delete / Archive this report"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* View Details Button (Pure details, zero questioning) */}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* ADMIN ITEM DETAILS MODAL (Completely Questioning-Free) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    <CheckCircle2 className="h-3 w-3" /> Found Item
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedItem.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    #{selectedItem.id}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {selectedItem.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-4 space-y-4 flex-1 text-xs">
              
              {/* Image Preview if available */}
              {selectedItem.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-60 flex items-center justify-center">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full h-full object-contain max-h-60"
                  />
                </div>
              )}

              {/* Item Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Discovery Location</span>
                    <span className="font-semibold text-slate-800">{selectedItem.location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported Date</span>
                    <span className="font-semibold text-slate-800">{selectedItem.date}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Custody Holding Point</span>
                    <span className="font-semibold text-emerald-900">{selectedItem.storageLocation || 'Main Security Office Desk'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Turned in by</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedItem.reportedBy.name} ({selectedItem.reportedBy.role})
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Public Notes &amp; Description
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 p-3.5 rounded-xl">
                  {selectedItem.description}
                </p>
              </div>

              {/* Status Info Card */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Registry Status</span>
                  <span className="font-bold capitalize">{selectedItem.status} in Campus Custody</span>
                </div>
                <Link
                  href="/admin/matches"
                  className="px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold text-xs shadow-2xs transition-colors"
                >
                  Match &amp; Return Console
                </Link>
              </div>

            </div>

            {/* Modal Footer with Delete and Close */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setItemToDelete(selectedItem);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Report</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Item Report?</h3>
                <p className="text-xs text-slate-500">Report #{itemToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete and archive <strong className="text-slate-900">&ldquo;{itemToDelete.title}&rdquo;</strong>? This item will be removed from the active campus registry.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Deletion
                </label>
                <input
                  type="text"
                  placeholder="e.g. Duplicate report, resolved offline, spam..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemToDelete(null);
                    setDeleteReason('');
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Confirm Deletion</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
