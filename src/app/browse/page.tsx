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
  X, 
  CheckCircle2, 
  Building2, 
  Sparkles, 
  Trash2,
  AlertTriangle,
  Eye,
  Shield,
  RefreshCw,
  User,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CampusItem } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { getFoundItemsFromDatabase } from '@/app/actions/getFoundItems';
import { getCurrentUser } from '@/app/actions/auth';
import { archiveReport } from '@/app/actions/moderation';

function getItemIcon(category: string, name: string): IconName {
  const lower = `${name} ${category}`.toLowerCase();
  if (lower.includes('headphone') || lower.includes('airpod') || lower.includes('audio') || lower.includes('earbud')) return 'headphones';
  if (lower.includes('wallet') || lower.includes('purse') || lower.includes('card')) return 'wallet';
  if (lower.includes('bottle') || lower.includes('flask') || lower.includes('mug')) return 'bottle';
  if (lower.includes('phone') || lower.includes('iphone') || lower.includes('mobile')) return 'phone';
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('tote')) return 'bag';
  if (lower.includes('key')) return 'key';
  if (lower.includes('laptop') || lower.includes('macbook')) return 'laptop';
  return 'sparkle';
}

export default function BrowseFoundPage() {
  const router = useRouter();

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
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

  // Dynamic locations
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

        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        if (selectedLocation !== 'All Locations') {
          const itemLoc = item.location.toLowerCase();
          const selLoc = selectedLocation.toLowerCase();
          if (!itemLoc.includes(selLoc) && item.location !== selectedLocation) {
            return false;
          }
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
  }, [foundItems, searchQuery, selectedCategory, selectedLocation, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All Locations');
    setSortBy('newest');
  };

  const activeFiltersCount = [
    searchQuery.trim() !== '',
    selectedCategory !== 'All',
    selectedLocation !== 'All Locations',
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
      <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <RefreshCw className="h-8 w-8 animate-spin" style={{ color: 'var(--purple)', marginBottom: '12px' }} />
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Verifying administrative authorization...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="dashboard-page section-shell" style={{ paddingBottom: '90px' }}>
        {/* Header Title Bar */}
        <div className="dashboard-heading">
          <div>
            <span className="section-kicker">Administrative Registry Console · {currentUser?.role} Mode</span>
            <h1>Campus Registry of Found Property</h1>
            <p>Official directory of active discovered items logged into campus security custody.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={fetchItems}
              disabled={isLoading}
              className="button button-quiet"
              style={{ minHeight: '40px', fontSize: '12px' }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Registry
            </button>

            <Link
              href="/admin"
              className="button button-admin"
              style={{ minHeight: '40px', fontSize: '12px' }}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Portal
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ background: 'var(--paper)', padding: '20px', borderRadius: '16px', border: '1px solid var(--line)', margin: '24px 0 28px' }}>
          <div className="recent-tools" style={{ marginBottom: 0 }}>
            <div className="recent-search" style={{ maxWidth: '100%' }}>
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search by keyword, item name, custody location, or ref code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 0, background: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                border: '1px solid var(--line)',
                background: '#f8f4ee',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--navy)',
                outline: 0
              }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                border: '1px solid var(--line)',
                background: '#f8f4ee',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--navy)',
                outline: 0
              }}
            >
              <option value="All Locations">All Locations</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '9px',
                border: '1px solid var(--line)',
                background: '#f8f4ee',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--navy)',
                outline: 0
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="button button-ghost"
                style={{ minHeight: '38px', padding: '0 14px', fontSize: '11px', color: 'var(--coral)' }}
              >
                <X className="h-3.5 w-3.5" /> Reset ({activeFiltersCount})
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
              Showing <strong>{filteredItems.length}</strong> active found {filteredItems.length === 1 ? 'item' : 'items'} in campus registry
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="recent-empty">
            <RefreshCw className="h-6 w-6 animate-spin" style={{ margin: '0 auto 8px', color: 'var(--purple)' }} />
            <p>Loading campus registry database...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="recent-empty">
            <Search className="h-8 w-8" style={{ margin: '0 auto 10px', color: 'var(--muted)' }} />
            <h3 style={{ font: '800 18px "Manrope"', color: 'var(--navy)', margin: '0 0 6px' }}>No Found Items Match Criteria</h3>
            <p style={{ margin: 0, fontSize: '12px' }}>No registered items match the selected search query or filters.</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="button button-quiet"
                style={{ marginTop: '16px', minHeight: '36px', fontSize: '11px' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Found Items Cards Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="recent-grid">
            {filteredItems.map((item, idx) => {
              const iconName = getItemIcon(item.category, item.title);
              const colorVariant = idx % 3 === 0 ? 'mint' : idx % 3 === 1 ? 'amber' : 'violet';

              return (
                <article key={item.id} className={`recent-card ${colorVariant}`}>
                  <div className="recent-art">
                    <span className="recent-pill">Found Property</span>
                    <Icon name={iconName} size={64} />
                  </div>

                  <div className="recent-body">
                    <span className="recent-time">#{item.id}</span>
                    <h3>{item.title}</h3>
                    <p>
                      <MapPin className="h-3 w-3" />
                      <span>{item.location}</span>
                    </p>
                    {item.storageLocation && (
                      <p style={{ marginTop: '3px', color: 'var(--teal)', fontWeight: 700 }}>
                        <Building2 className="h-3 w-3" />
                        <span>{item.storageLocation}</span>
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '6px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="button button-light"
                        style={{ flex: 1, minHeight: '34px', fontSize: '11px' }}
                      >
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        title="Delete / Archive report"
                        className="button button-ghost"
                        style={{ minHeight: '34px', width: '34px', padding: 0, display: 'grid', placeItems: 'center', color: 'var(--coral)' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ITEM DETAILS MODAL */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'rgba(29, 21, 26, .6)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--paper)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '28px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: 'var(--shadow)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span className="type-badge found">Found Item · #{selectedItem.id}</span>
                <h2 style={{ margin: '6px 0 0', font: '800 22px "Manrope"', color: 'var(--navy)' }}>
                  {selectedItem.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ border: 0, background: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', fontSize: '12px' }}>
              {selectedItem.imageUrl && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)', maxHeight: '200px' }}>
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ background: '#f1e6d7', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Discovery Location</span>
                  <strong style={{ display: 'block', color: 'var(--navy)', marginTop: '2px' }}>{selectedItem.location}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Date Logged</span>
                  <strong style={{ display: 'block', color: 'var(--navy)', marginTop: '2px' }}>{selectedItem.date}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Custody Location</span>
                  <strong style={{ display: 'block', color: 'var(--teal)', marginTop: '2px' }}>{selectedItem.storageLocation || 'Campus Security Locker'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Turned in by</span>
                  <strong style={{ display: 'block', color: 'var(--navy)', marginTop: '2px' }}>{selectedItem.reportedBy?.name || 'Campus Member'}</strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Public Description</span>
                <p style={{ margin: '4px 0 0', padding: '12px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '10px', color: 'var(--ink)' }}>
                  {selectedItem.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setItemToDelete(selectedItem)}
                  className="button button-ghost"
                  style={{ color: 'var(--coral)' }}
                >
                  <Trash2 className="h-4 w-4" /> Delete Report
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/admin?tab=matches" className="button button-admin" style={{ fontSize: '11px' }}>
                    Match &amp; Return
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="button button-ghost"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'rgba(29, 21, 26, .6)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--paper)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ margin: '0 0 8px', font: '800 18px "Manrope"', color: 'var(--navy)' }}>
              Delete Item Report?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--muted)' }}>
              Are you sure you want to archive <strong>&ldquo;{itemToDelete.title}&rdquo;</strong> (#{itemToDelete.id})? This will remove it from the active campus registry.
            </p>

            {deleteError && (
              <div style={{ padding: '10px', background: 'var(--coral-soft)', color: 'var(--coral)', borderRadius: '8px', fontSize: '11px', marginBottom: '12px' }}>
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteReport} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--navy)' }}>
                  Reason for Deletion
                </label>
                <input
                  type="text"
                  placeholder="e.g. Duplicate report, resolved offline, spam..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '11px',
                    outline: 0,
                    background: '#f8f4ee',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setItemToDelete(null);
                    setDeleteReason('');
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="button button-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="button"
                  style={{ background: 'var(--coral)', color: 'white' }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${toastMessage ? 'show' : ''}`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{toastMessage}</span>
      </div>

      <Footer />
    </div>
  );
}
