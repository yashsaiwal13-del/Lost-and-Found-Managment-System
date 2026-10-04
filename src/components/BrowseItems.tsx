'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Tag, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import { CampusItem, Category } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { getAllCampusItems } from '@/app/actions/getItems';

interface BrowseItemsProps {
  initialSearchQuery?: string;
  initialLocation?: string;
}

export default function BrowseItems({
  initialSearchQuery = '',
  initialLocation = 'All Locations',
}: BrowseItemsProps) {
  const [items, setItems] = useState<CampusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'found' | 'lost'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [activeModalItem, setActiveModalItem] = useState<CampusItem | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getAllCampusItems({ limit: 50 })
      .then((data) => {
        if (isMounted && data) {
          setItems(data);
        }
      })
      .catch((err) => console.error('Failed to fetch items:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter items dynamically based on controls
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by type
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      // Filter by category
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Filter by location
      if (selectedLocation !== 'All Locations' && item.location !== selectedLocation) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedType, selectedCategory, selectedLocation, searchQuery]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSuccess(true);
    setTimeout(() => {
      setClaimSuccess(false);
      setActiveModalItem(null);
    }, 2500);
  };

  return (
    <section id="browse" className="py-16 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
              <Search className="h-3.5 w-3.5" />
              Live Campus Registry
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Browse Lost &amp; Found Items
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Currently indexing items reported across campus buildings in PostgreSQL.
            </p>
          </div>

          {/* Filter Type Pills (All / Found / Lost) */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start md:self-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedType('found')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'found'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Items ({items.filter((i) => i.type === 'found').length})
            </button>
            <button
              onClick={() => setSelectedType('lost')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedType === 'lost'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Reports ({items.filter((i) => i.type === 'lost').length})
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Quick Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-medium text-slate-500 shrink-0 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Location:
            </span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full lg:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading items from PostgreSQL database...</p>
          </div>
        )}

        {/* Item Cards Grid */}
        {!loading && filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No items match your criteria</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, changing the campus location, or clear your filters.
            </p>
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedCategory('All');
                setSelectedLocation('All Locations');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isFound = item.type === 'found';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    
                    {/* Badge row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isFound
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isFound ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Found Item
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            Lost Item
                          </>
                        )}
                      </span>

                      {/* Category Badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {item.category}
                      </span>
                    </div>

                    {/* Item Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      <Link href={`/items/${item.id}`}>
                        {item.title}
                      </Link>
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Campus Location & Date */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Reported {item.date}</span>
                      </div>
                    </div>

                    {/* Security Storage Info */}
                    {item.storageLocation && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                        <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Held at: {item.storageLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: #{item.id}
                    </span>
                    <Link
                      href={`/items/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
