'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  GitCompare, 
  FileCheck2, 
  Package, 
  Search, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Tag, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  FileText,
  SlidersHorizontal,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  getSuggestedMatches, 
  getConfirmedMatches, 
  getActiveReportsForManualMatching, 
  acceptSuggestedMatch, 
  dismissSuggestedMatch, 
  connectReportsManually,
  SuggestedMatchEntry,
  ConfirmedMatchEntry
} from '@/app/actions/matching';
import { getAdminClaims, approveClaim, rejectClaim, confirmHandover } from '@/app/actions/claims';
import { getAllAdminItems, AdminCampusItem } from '@/app/actions/getAllItems';
import { getCurrentUser } from '@/app/actions/auth';
import { CATEGORIES } from '@/lib/constants';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';

export default function AdminPortalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams?.get('tab') as 'matches' | 'claims' | 'custody') || 'matches';
  
  const [activeTab, setActiveTab] = useState<'matches' | 'claims' | 'custody'>(initialTab);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Data states
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedMatchEntry[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<ConfirmedMatchEntry[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [custodyItems, setCustodyItems] = useState<AdminCampusItem[]>([]);
  
  // Manual matching active reports
  const [activeLostReports, setActiveLostReports] = useState<any[]>([]);
  const [activeFoundReports, setActiveFoundReports] = useState<any[]>([]);
  const [selectedLostId, setSelectedLostId] = useState<string | null>(null);
  const [selectedFoundId, setSelectedFoundId] = useState<string | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Filters
  const [lostSearch, setLostSearch] = useState('');
  const [foundSearch, setFoundSearch] = useState('');
  const [lostCategory, setLostCategory] = useState('All');
  const [foundCategory, setFoundCategory] = useState('All');
  const [claimsSearch, setClaimsSearch] = useState('');
  const [custodySearch, setCustodySearch] = useState('');

  // Reject modal state
  const [rejectModalClaim, setRejectModalClaim] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Handover modal state
  const [handoverModalItem, setHandoverModalItem] = useState<any | null>(null);
  const [handoverRecipient, setHandoverRecipient] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Action in progress state
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') as 'matches' | 'claims' | 'custody' | null;
    if (tabFromUrl && ['matches', 'claims', 'custody'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const switchTab = (tab: 'matches' | 'claims' | 'custody') => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load live data from database
  const loadData = async () => {
    setLoading(true);
    try {
      const [u, suggested, confirmed, activeReports, adminClaims, allItems] = await Promise.all([
        getCurrentUser(),
        getSuggestedMatches(),
        getConfirmedMatches(),
        getActiveReportsForManualMatching(),
        getAdminClaims(),
        getAllAdminItems({ includeArchived: false }),
      ]);

      if (u) setCurrentUser(u);
      setSuggestedMatches(suggested || []);
      setConfirmedMatches(confirmed || []);
      setActiveLostReports(activeReports.lostReports || []);
      setActiveFoundReports(activeReports.foundReports || []);
      setClaims(adminClaims || []);
      
      // Custody items: Found items currently logged in custody
      const foundInCustody = (allItems || []).filter(
        (i) => i.type?.toUpperCase() === 'FOUND'
      );
      setCustodyItems(foundInCustody);
    } catch (err: any) {
      console.error('Failed to load admin portal data:', err);
      showToast('Error loading live data from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Match review actions
  const handleAcceptMatch = async (matchId: string) => {
    setActionInProgressId(matchId);
    try {
      const res = await acceptSuggestedMatch(matchId, 'Confirmed connection by Administrator');
      if (res.success) {
        showToast('Connection confirmed. Both student parties notified.');
        setSuggestedMatches((prev) => prev.filter((m) => m.id !== matchId));
        loadData();
      } else {
        alert(res.error || 'Failed to confirm match connection.');
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming match connection.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDismissMatch = async (matchId: string) => {
    setActionInProgressId(matchId);
    try {
      const res = await dismissSuggestedMatch(matchId);
      if (res.success) {
        showToast('Suggested match dismissed.');
        setSuggestedMatches((prev) => prev.filter((m) => m.id !== matchId));
        loadData();
      } else {
        alert(res.error || 'Failed to dismiss match.');
      }
    } catch (err: any) {
      alert(err.message || 'Error dismissing match.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Manual connect action
  const handleManualConnect = async () => {
    if (!selectedLostId || !selectedFoundId) {
      alert('Please select both a lost report and a found report to connect.');
      return;
    }
    setSubmittingManual(true);
    try {
      const res = await connectReportsManually(
        selectedLostId,
        selectedFoundId,
        manualNotes || 'Manual pairing executed by Administrator'
      );
      if (res.success) {
        showToast('Reports linked successfully. Notification sent to student.');
        setSelectedLostId(null);
        setSelectedFoundId(null);
        setManualNotes('');
        loadData();
      } else {
        alert(res.error || 'Failed to link reports.');
      }
    } catch (err: any) {
      alert(err.message || 'Error linking reports.');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Claim actions
  const handleApproveClaim = async (claimId: string) => {
    setActionInProgressId(claimId);
    try {
      const res = await approveClaim(claimId);
      if (res.success) {
        showToast('Claim approved. Item marked VERIFIED and ready for collection.');
        loadData();
      } else {
        alert(res.error || 'Failed to approve claim.');
      }
    } catch (err: any) {
      alert(err.message || 'Error approving claim.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalClaim) return;
    if (!rejectReason.trim()) {
      alert('Please provide a specific rejection reason.');
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await rejectClaim(rejectModalClaim.id, rejectReason.trim());
      if (res.success) {
        showToast('Claim rejected. Student notified with reason.');
        setRejectModalClaim(null);
        setRejectReason('');
        loadData();
      } else {
        alert(res.error || 'Failed to reject claim.');
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting claim.');
    } finally {
      setSubmittingReject(false);
    }
  };

  // Handover action
  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalItem) return;

    setSubmittingHandover(true);
    try {
      const res = await confirmHandover(
        handoverModalItem.id,
        handoverRecipient || handoverModalItem.reportedById || undefined,
        handoverNotes || 'Item officially handed over at Campus Safety Desk'
      );
      if (res.success) {
        showToast(`Item #${handoverModalItem.id} officially marked as RESOLVED and handed over.`);
        setHandoverModalItem(null);
        setHandoverRecipient('');
        setHandoverNotes('');
        loadData();
      } else {
        alert(res.error || 'Failed to confirm item handover.');
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming item handover.');
    } finally {
      setSubmittingHandover(false);
    }
  };

  // Filtered lists for manual matching
  const filteredLost = useMemo(() => {
    return activeLostReports.filter((item) => {
      if (lostCategory !== 'All' && item.category !== lostCategory) return false;
      if (lostSearch.trim()) {
        const q = lostSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.reportedBy?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeLostReports, lostCategory, lostSearch]);

  const filteredFound = useMemo(() => {
    return activeFoundReports.filter((item) => {
      if (foundCategory !== 'All' && item.category !== foundCategory) return false;
      if (foundSearch.trim()) {
        const q = foundSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.reportedBy?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeFoundReports, foundCategory, foundSearch]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (claimsSearch.trim()) {
        const q = claimsSearch.toLowerCase();
        return (
          c.itemTitle?.toLowerCase().includes(q) ||
          c.claimantName?.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q) ||
          c.status?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [claims, claimsSearch]);

  // Filtered custody items
  const filteredCustody = useMemo(() => {
    return custodyItems.filter((i) => {
      if (custodySearch.trim()) {
        const q = custodySearch.toLowerCase();
        return (
          i.name?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q) ||
          i.storageLocation?.toLowerCase().includes(q) ||
          i.id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [custodyItems, custodySearch]);

  const selectedLostItem = useMemo(
    () => activeLostReports.find((i) => i.id === selectedLostId) || null,
    [activeLostReports, selectedLostId]
  );
  const selectedFoundItem = useMemo(
    () => activeFoundReports.find((i) => i.id === selectedFoundId) || null,
    [activeFoundReports, selectedFoundId]
  );

  const pendingClaimsCount = claims.filter((c) => c.status === 'pending').length;
  const activeInCustodyCount = custodyItems.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'ITEM_RETURNED'
  ).length;

  return (
    <>
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <span className="match-kicker">Campus Safety &amp; Asset Control</span>
          <h1>Admin Portal</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
            Review potential matches, assess ownership claims, and track custody.
          </p>
        </div>

        <div>
          <div className="verified">
            <ShieldCheck className="h-4 w-4" />
            <span>Live Verification Engine</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: 'var(--paper)', padding: '4px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <button
              onClick={() => switchTab('matches')}
              className={`button ${activeTab === 'matches' ? 'button-admin' : 'button-ghost'}`}
              style={{ minHeight: '36px', padding: '0 12px', fontSize: '11px' }}
            >
              Match &amp; Return ({suggestedMatches.length})
            </button>
            <button
              onClick={() => switchTab('claims')}
              className={`button ${activeTab === 'claims' ? 'button-admin' : 'button-ghost'}`}
              style={{ minHeight: '36px', padding: '0 12px', fontSize: '11px' }}
            >
              Claims Review ({pendingClaimsCount})
            </button>
            <button
              onClick={() => switchTab('custody')}
              className={`button ${activeTab === 'custody' ? 'button-admin' : 'button-ghost'}`}
              style={{ minHeight: '36px', padding: '0 12px', fontSize: '11px' }}
            >
              Custody Locker ({activeInCustodyCount})
            </button>
            <button
              onClick={loadData}
              title="Refresh database records"
              className="button button-ghost"
              style={{ minHeight: '36px', width: '36px', padding: 0, display: 'grid', placeItems: 'center' }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MATCH & RETURN */}
      {/* ========================================================= */}
      {activeTab === 'matches' && (
        <section>
          {/* Summary Bar */}
          <div className="admin-summary">
            <div>
              <span>
                <GitCompare className="h-4 w-4" />
              </span>
              <p>
                <strong>Potential Match Queue ({suggestedMatches.length})</strong>
                <small>Confidence scoring &amp; attribute alignment analysis</small>
              </p>
            </div>
            <span>
              {suggestedMatches.length > 0
                ? `${suggestedMatches.length} candidate match${suggestedMatches.length > 1 ? 'es' : ''} awaiting review`
                : 'All match queues clear'}
            </span>
          </div>

          {/* Suggested Match Cards */}
          {suggestedMatches.length > 0 ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              {suggestedMatches.map((match) => (
                <article key={match.id} className="admin-match-card">
                  <div className="admin-match-head">
                    <div>
                      <span className="confidence">
                        <Sparkles className="h-3 w-3" />
                        Algorithmic Match Suggestion
                      </span>
                      <h2>
                        {match.lostItem.name} ↔ {match.foundItem.name}
                      </h2>
                      <p>
                        Match score: {match.similarityScore}% · Lost #{match.lostItem.id} vs Found #{match.foundItem.id}
                      </p>
                    </div>

                    <div className="confidence-ring">
                      <strong>{match.similarityScore}%</strong>
                      <small>Confidence</small>
                    </div>
                  </div>

                  <div className="comparison">
                    {/* Lost Item Column */}
                    <div className="compare-item lost">
                      <div className="compare-label">Lost Report</div>
                      <div className="compare-title">
                        {match.lostItem.image ? (
                          <div
                            onClick={() =>
                              setFullImage({
                                url: match.lostItem.image!,
                                title: match.lostItem.name,
                                subtitle: `Lost Report · Ref #${match.lostItem.id} · Reported by ${match.lostItem.reportedBy?.name || 'Student'}`,
                              })
                            }
                            title="Click to view full image"
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '1px solid var(--line)',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={match.lostItem.image}
                              alt={match.lostItem.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <span>
                            <Sparkles className="h-5 w-5" />
                          </span>
                        )}
                        <div>
                          <h3>{match.lostItem.name}</h3>
                          <p>Ref #{match.lostItem.id} · {match.lostItem.category}</p>
                          {match.lostItem.image && (
                            <button
                              type="button"
                              onClick={() =>
                                setFullImage({
                                  url: match.lostItem.image!,
                                  title: match.lostItem.name,
                                  subtitle: `Lost Report · Ref #${match.lostItem.id}`,
                                })
                              }
                              style={{
                                border: 0,
                                background: 'none',
                                color: 'var(--coral)',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '2px',
                              }}
                            >
                              Examine Photo ↗
                            </button>
                          )}
                        </div>
                      </div>

                      <dl>
                        <div>
                          <dt>Owner</dt>
                          <dd>{match.lostItem.reportedBy?.name || 'Student'}</dd>
                        </div>
                        <div>
                          <dt>Location</dt>
                          <dd>{match.lostItem.location}</dd>
                        </div>
                        <div>
                          <dt>Date Lost</dt>
                          <dd>
                            {match.lostItem.date
                              ? new Date(match.lostItem.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </dd>
                        </div>
                        <div>
                          <dt>Notes</dt>
                          <dd>{match.lostItem.description || 'No additional notes provided.'}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Match Signals Column */}
                    <div className="signals">
                      <span>Match signals</span>

                      <div>
                        <i>✓</i>
                        <strong>Category: {match.lostItem.category}</strong>
                        <em></em>
                      </div>

                      <div>
                        <i>✓</i>
                        <strong>
                          Location:{' '}
                          {match.lostItem.location === match.foundItem.location
                            ? 'Exact Zone Match'
                            : 'Campus Area Proximity'}
                        </strong>
                        <em></em>
                      </div>

                      <div>
                        <i>✓</i>
                        <strong>Keyword similarity</strong>
                        <em></em>
                      </div>

                      <div>
                        <i>✓</i>
                        <strong>Recent timestamp match</strong>
                        <em></em>
                      </div>
                    </div>

                    {/* Found Item Column */}
                    <div className="compare-item found">
                      <div className="compare-label">Found Item</div>
                      <div className="compare-title">
                        {match.foundItem.image ? (
                          <div
                            onClick={() =>
                              setFullImage({
                                url: match.foundItem.image!,
                                title: match.foundItem.name,
                                subtitle: `Found Item · Ref #${match.foundItem.id} · Stored at ${match.foundItem.storageLocation || 'Locker'}`,
                              })
                            }
                            title="Click to view full image"
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '1px solid var(--line)',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={match.foundItem.image}
                              alt={match.foundItem.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <span>
                            <Sparkles className="h-5 w-5" />
                          </span>
                        )}
                        <div>
                          <h3>{match.foundItem.name}</h3>
                          <p>Ref #{match.foundItem.id} · Custody Locker</p>
                          {match.foundItem.image && (
                            <button
                              type="button"
                              onClick={() =>
                                setFullImage({
                                  url: match.foundItem.image!,
                                  title: match.foundItem.name,
                                  subtitle: `Found Item · Ref #${match.foundItem.id}`,
                                })
                              }
                              style={{
                                border: 0,
                                background: 'none',
                                color: 'var(--teal)',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '2px',
                              }}
                            >
                              Examine Photo ↗
                            </button>
                          )}
                        </div>
                      </div>

                      <dl>
                        <div>
                          <dt>Finder</dt>
                          <dd>{match.foundItem.reportedBy?.name || 'Campus Member'}</dd>
                        </div>
                        <div>
                          <dt>Location</dt>
                          <dd>{match.foundItem.location}</dd>
                        </div>
                        <div>
                          <dt>Storage</dt>
                          <dd>{match.foundItem.storageLocation || 'Campus Security Locker'}</dd>
                        </div>
                        <div>
                          <dt>Notes</dt>
                          <dd>{match.foundItem.description || 'No additional notes provided.'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="admin-actions">
                    <button
                      type="button"
                      disabled={actionInProgressId === match.id}
                      onClick={() => handleDismissMatch(match.id)}
                      className="button button-ghost"
                    >
                      Dismiss Match
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgressId === match.id}
                      onClick={() => handleAcceptMatch(match.id)}
                      className="button button-admin"
                    >
                      {actionInProgressId === match.id ? 'Connecting...' : 'Confirm Connection'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <span>
                <Check className="h-8 w-8" />
              </span>
              <h2>All Match Queues Clear</h2>
              <p>
                There are no automated match candidates pending review. You can manually connect reports below or review claims.
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* MANUAL MATCHING STUDIO */}
          {/* ========================================================= */}
          <div style={{ marginTop: '36px' }}>
            <div className="section-row">
              <div>
                <h2>Manual Report Matching Studio</h2>
                <p>Select an active lost report and an active found report to pair them manually.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '16px' }}>
              
              {/* Left Column: Active Lost Reports */}
              <div className="admin-list" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="type-badge lost">Lost Reports</span>
                    <strong style={{ fontSize: '12px' }}>({filteredLost.length})</strong>
                  </div>
                  <div className="search-field" style={{ width: '170px' }}>
                    <Search className="h-3.5 w-3.5" />
                    <input
                      type="text"
                      placeholder="Search lost items..."
                      value={lostSearch}
                      onChange={(e) => setLostSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                  {filteredLost.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '11px' }}>
                      No active lost reports found.
                    </div>
                  ) : (
                    filteredLost.map((item) => {
                      const isSelected = selectedLostId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedLostId(isSelected ? null : item.id)}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isSelected ? 'var(--coral)' : 'var(--line)'}`,
                            background: isSelected ? 'var(--coral-soft)' : 'var(--paper)',
                            cursor: 'pointer',
                            transition: '.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '11px', color: 'var(--navy)' }}>{item.name}</strong>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--coral)' }}>#{item.id}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--muted)' }}>
                            {item.location} · {item.category}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'var(--muted)' }}>
                            By {item.reportedBy?.name || 'Student'} ({item.reportedBy?.email || ''})
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Active Found Reports */}
              <div className="admin-list" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="type-badge found">Found Reports</span>
                    <strong style={{ fontSize: '12px' }}>({filteredFound.length})</strong>
                  </div>
                  <div className="search-field" style={{ width: '170px' }}>
                    <Search className="h-3.5 w-3.5" />
                    <input
                      type="text"
                      placeholder="Search found items..."
                      value={foundSearch}
                      onChange={(e) => setFoundSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                  {filteredFound.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '11px' }}>
                      No active found reports found.
                    </div>
                  ) : (
                    filteredFound.map((item) => {
                      const isSelected = selectedFoundId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedFoundId(isSelected ? null : item.id)}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isSelected ? 'var(--teal)' : 'var(--line)'}`,
                            background: isSelected ? 'var(--teal-soft)' : 'var(--paper)',
                            cursor: 'pointer',
                            transition: '.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '11px', color: 'var(--navy)' }}>{item.name}</strong>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--teal)' }}>#{item.id}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--muted)' }}>
                            {item.location} · {item.category}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'var(--muted)' }}>
                            Locker: {item.storageLocation || 'Campus Security Locker'}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Manual Connection Confirmation Bar */}
            <div
              style={{
                marginTop: '16px',
                padding: '18px 24px',
                borderRadius: '14px',
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'grid' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--muted)', fontWeight: 800 }}>
                    Selected Pair
                  </span>
                  <strong style={{ fontSize: '12px', color: 'var(--navy)' }}>
                    {selectedLostItem ? selectedLostItem.name : 'Select Lost Item'}{' '}
                    <span style={{ color: 'var(--purple)' }}>↔</span>{' '}
                    {selectedFoundItem ? selectedFoundItem.name : 'Select Found Item'}
                  </strong>
                </div>

                <input
                  type="text"
                  placeholder="Optional admin connection note..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  style={{
                    flex: 1,
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '11px',
                    outline: 0,
                    background: '#f8f4ee',
                  }}
                />
              </div>

              <button
                type="button"
                disabled={!selectedLostId || !selectedFoundId || submittingManual}
                onClick={handleManualConnect}
                className="button button-admin"
                style={{ opacity: selectedLostId && selectedFoundId ? 1 : 0.5 }}
              >
                <GitCompare className="h-4 w-4" />
                {submittingManual ? 'Connecting...' : 'Connect Reports Manually'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLAIMS REVIEW */}
      {/* ========================================================= */}
      {activeTab === 'claims' && (
        <section>
          {/* Summary Bar */}
          <div className="admin-summary">
            <div>
              <span>
                <FileCheck2 className="h-4 w-4" />
              </span>
              <p>
                <strong>Ownership Claims Registry ({claims.length})</strong>
                <small>Assess student proof answers &amp; authorize collections</small>
              </p>
            </div>
            <span>
              {pendingClaimsCount} pending decision · {claims.filter((c) => c.status === 'approved').length} approved
            </span>
          </div>

          <div className="admin-list" style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--navy)' }}>Submitted Verification Claims</strong>
              <div className="search-field">
                <Search className="h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search by student, item, ID..."
                  value={claimsSearch}
                  onChange={(e) => setClaimsSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredClaims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)', fontSize: '12px' }}>
                No matching ownership claims found in registry.
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const isPending = claim.status === 'pending';
                const isApproved = claim.status === 'approved';
                const isRejected = claim.status === 'rejected';

                let statusClass = 'review';
                let statusLabel = 'Pending Review';
                if (isApproved) {
                  statusClass = 'ready';
                  statusLabel = 'Approved / Verified';
                } else if (isRejected) {
                  statusClass = 'searching';
                  statusLabel = 'Rejected';
                }

                return (
                  <article key={claim.id}>
                    <span>
                      <FileText className="h-4 w-4" />
                    </span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--navy)' }}>
                          {claim.itemTitle}
                        </strong>
                        <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                          · Claimant: {claim.claimantName} ({claim.studentId})
                        </span>
                      </div>
                      <small style={{ marginTop: '3px' }}>
                        Submitted {claim.submittedDate} · Color: {claim.answers?.exactColor} · Marks: {claim.answers?.uniqueMark} · Location: {claim.answers?.lastSeenLocation}
                      </small>
                      {claim.rejectionReason && (
                        <small style={{ color: '#be4b5e', fontWeight: 700, marginTop: '2px' }}>
                          Rejection Reason: {claim.rejectionReason}
                        </small>
                      )}
                    </div>

                    <span className={`status ${statusClass}`}>
                      <i></i>
                      {statusLabel}
                    </span>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={actionInProgressId === claim.id}
                            onClick={() => handleApproveClaim(claim.id)}
                            title="Approve Claim & Verify Item"
                            className="button button-found"
                            style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px' }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionInProgressId === claim.id}
                            onClick={() => {
                              setRejectModalClaim(claim);
                              setRejectReason('');
                            }}
                            title="Reject Claim"
                            className="button button-ghost"
                            style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px', color: '#be4b5e' }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            setHandoverModalItem({ id: claim.itemId, name: claim.itemTitle, reportedById: claim.studentId });
                            setHandoverRecipient(claim.studentId);
                            setHandoverNotes('');
                          }}
                          className="button button-admin"
                          style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px' }}
                        >
                          Handover
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CUSTODY LOCKER */}
      {/* ========================================================= */}
      {activeTab === 'custody' && (
        <section>
          {/* Summary Bar */}
          <div className="admin-summary">
            <div>
              <span>
                <Package className="h-4 w-4" />
              </span>
              <p>
                <strong>Custody Locker &amp; Asset Vault ({custodyItems.length})</strong>
                <small>Physical items securely held by Campus Safety &amp; Security</small>
              </p>
            </div>
            <span>{activeInCustodyCount} currently stored in locker</span>
          </div>

          <div className="admin-list" style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--navy)' }}>Items in Physical Custody</strong>
              <div className="search-field">
                <Search className="h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search custody items..."
                  value={custodySearch}
                  onChange={(e) => setCustodySearch(e.target.value)}
                />
              </div>
            </div>

            {filteredCustody.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)', fontSize: '12px' }}>
                No custody items found in vault.
              </div>
            ) : (
              filteredCustody.map((item) => {
                const isHandedOver = item.status === 'RESOLVED' || item.status === 'ITEM_RETURNED';
                const statusClass = isHandedOver ? 'returned' : 'ready';
                const statusLabel = isHandedOver ? 'Returned / Resolved' : 'Held in Locker';

                return (
                  <article key={item.id}>
                    {item.image ? (
                      <div
                        onClick={() =>
                          setFullImage({
                            url: item.image!,
                            title: item.name,
                            subtitle: `Custody Locker · Ref #${item.id} · Stored at ${item.storageLocation || 'Campus Safety Desk'}`,
                          })
                        }
                        title="Click to view full image"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid var(--line)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <span>
                        <Package className="h-4 w-4" />
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--navy)' }}>
                          #{item.id} · {item.name}
                        </strong>
                        <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                          ({item.category})
                        </span>
                        {item.image && (
                          <button
                            type="button"
                            onClick={() =>
                              setFullImage({
                                url: item.image!,
                                title: item.name,
                                subtitle: `Custody Locker · Ref #${item.id}`,
                              })
                            }
                            style={{
                              border: 0,
                              background: 'none',
                              color: 'var(--teal)',
                              fontSize: '9px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Examine Photo ↗
                          </button>
                        )}
                      </div>
                      <small style={{ marginTop: '3px' }}>
                        Locker: {item.storageLocation || 'Campus Safety Desk'} · Found at {item.location} · Finder: {item.reportedByName || 'Campus Member'}
                      </small>
                    </div>

                    <span className={`status ${statusClass}`}>
                      <i></i>
                      {statusLabel}
                    </span>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {!isHandedOver && (
                        <button
                          type="button"
                          onClick={() => {
                            setHandoverModalItem(item);
                            setHandoverRecipient(item.reportedById || '');
                            setHandoverNotes('');
                          }}
                          className="button button-admin"
                          style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px' }}
                        >
                          Handover
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* REJECT CLAIM MODAL */}
      {/* ========================================================= */}
      {rejectModalClaim && (
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
            <h3 style={{ margin: '0 0 8px', font: '800 18px "Manrope", sans-serif', color: 'var(--navy)' }}>
              Reject Ownership Claim
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '11px', color: 'var(--muted)' }}>
              Provide a clear reason explaining why this claim for <strong>{rejectModalClaim.itemTitle}</strong> is being rejected. The student will be notified.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Identifying color or marks did not match item in custody..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '9px',
                border: '1px solid var(--line)',
                fontSize: '11px',
                outline: 0,
                background: '#f8f4ee'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setRejectModalClaim(null)}
                className="button button-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReject}
                onClick={handleRejectClaimSubmit}
                className="button"
                style={{ background: '#be4b5e', color: 'white' }}
              >
                {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HANDOVER CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {handoverModalItem && (
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
            <h3 style={{ margin: '0 0 8px', font: '800 18px "Manrope", sans-serif', color: 'var(--navy)' }}>
              Authorize Item Handover
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '11px', color: 'var(--muted)' }}>
              Confirm physical handover of <strong>{handoverModalItem.name}</strong> (#{handoverModalItem.id}). This will permanently stamp the handover in the security audit log.
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase' }}>
                  Recipient Student ID / Account
                </label>
                <input
                  type="text"
                  placeholder="Student ID or Email..."
                  value={handoverRecipient}
                  onChange={(e) => setHandoverRecipient(e.target.value)}
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

              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase' }}>
                  Handover Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Identity verified via Student Card #STU-..."
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setHandoverModalItem(null)}
                className="button button-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingHandover}
                onClick={handleHandoverSubmit}
                className="button button-admin"
              >
                {submittingHandover ? 'Recording...' : 'Authorize & Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? 'show' : ''}`}>
        <Check className="h-3.5 w-3.5" />
        <span>{toastMessage}</span>
      </div>

      {/* Full Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!fullImage}
        imageUrl={fullImage?.url || null}
        title={fullImage?.title}
        subtitle={fullImage?.subtitle}
        onClose={() => setFullImage(null)}
      />
    </>
  );
}
