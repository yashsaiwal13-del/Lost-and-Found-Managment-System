'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  GitCompare, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Tag, 
  MapPin, 
  Calendar, 
  User, 
  RefreshCw, 
  ShieldAlert, 
  Users, 
  HelpCircle, 
  History, 
  Settings, 
  ShieldCheck, 
  ChevronRight, 
  Info, 
  SlidersHorizontal, 
  Link2, 
  Unlink, 
  FileText,
  Clock,
  Package,
  Building2,
  Check,
  X,
  PackageCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  getSuggestedMatches, 
  getConfirmedMatches, 
  getActiveReportsForManualMatching, 
  acceptSuggestedMatch, 
  dismissSuggestedMatch, 
  connectReportsManually, 
  disconnectMatch,
  arrangeCollection,
  confirmHandover,
  SuggestedMatchEntry,
  ConfirmedMatchEntry
} from '@/app/actions/matching';
import { getCurrentUser } from '@/app/actions/auth';
import { CATEGORIES } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';

export default function AdminMatchesPage() {
  const [activeTab, setActiveTab] = useState<'suggested' | 'manual' | 'confirmed'>('suggested');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for Return & Handover
  const [arrangeModalMatch, setArrangeModalMatch] = useState<ConfirmedMatchEntry | null>(null);
  const [arrangeNotes, setArrangeNotes] = useState('');
  const [submittingArrange, setSubmittingArrange] = useState(false);

  const [handoverModalMatch, setHandoverModalMatch] = useState<ConfirmedMatchEntry | null>(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Data States
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedMatchEntry[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<ConfirmedMatchEntry[]>([]);
  const [activeLostReports, setActiveLostReports] = useState<any[]>([]);
  const [activeFoundReports, setActiveFoundReports] = useState<any[]>([]);

  // Suggested Matches Filters
  const [suggestedSearch, setSuggestedSearch] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('All');

  // Manual Matching Selection & Filters
  const [selectedLostId, setSelectedLostId] = useState<string | null>(null);
  const [selectedFoundId, setSelectedFoundId] = useState<string | null>(null);
  const [lostSearch, setLostSearch] = useState('');
  const [lostCategory, setLostCategory] = useState('All');
  const [foundSearch, setFoundSearch] = useState('');
  const [foundCategory, setFoundCategory] = useState('All');

  // Modals
  const [acceptModalMatch, setAcceptModalMatch] = useState<SuggestedMatchEntry | null>(null);
  const [acceptNote, setAcceptNote] = useState('');
  const [submittingAccept, setSubmittingAccept] = useState(false);

  const [manualConnectModalOpen, setManualConnectModalOpen] = useState(false);
  const [manualConnectNote, setManualConnectNote] = useState('');
  const [submittingManualConnect, setSubmittingManualConnect] = useState(false);

  const [disconnectModalMatch, setDisconnectModalMatch] = useState<ConfirmedMatchEntry | null>(null);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [submittingDisconnect, setSubmittingDisconnect] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load live data
  const loadData = async () => {
    setLoading(true);
    try {
      const [u, suggested, confirmed, activeReports] = await Promise.all([
        getCurrentUser(),
        getSuggestedMatches(),
        getConfirmedMatches(),
        getActiveReportsForManualMatching(),
      ]);

      if (u) setCurrentUser(u);
      setSuggestedMatches(suggested || []);
      setConfirmedMatches(confirmed || []);
      setActiveLostReports(activeReports.lostReports || []);
      setActiveFoundReports(activeReports.foundReports || []);
    } catch (err: any) {
      console.error('Failed to load matching data:', err);
      showToast('Error loading match records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Suggested Matches
  const filteredSuggested = useMemo(() => {
    return suggestedMatches.filter((m) => {
      if (suggestedCategory !== 'All') {
        if (m.lostItem.category !== suggestedCategory && m.foundItem.category !== suggestedCategory) {
          return false;
        }
      }
      if (suggestedSearch.trim()) {
        const q = suggestedSearch.toLowerCase();
        const lostMatch =
          m.lostItem.name.toLowerCase().includes(q) ||
          m.lostItem.description.toLowerCase().includes(q) ||
          m.lostItem.location.toLowerCase().includes(q) ||
          m.lostItem.reportedBy?.name.toLowerCase().includes(q);
        const foundMatch =
          m.foundItem.name.toLowerCase().includes(q) ||
          m.foundItem.description.toLowerCase().includes(q) ||
          m.foundItem.location.toLowerCase().includes(q) ||
          m.foundItem.reportedBy?.name.toLowerCase().includes(q);
        return lostMatch || foundMatch;
      }
      return true;
    });
  }, [suggestedMatches, suggestedCategory, suggestedSearch]);

  // Filtered Lost Reports for Manual Matching
  const filteredLost = useMemo(() => {
    return activeLostReports.filter((item) => {
      if (lostCategory !== 'All' && item.category !== lostCategory) return false;
      if (lostSearch.trim()) {
        const q = lostSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.reportedBy?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeLostReports, lostCategory, lostSearch]);

  // Filtered Found Reports for Manual Matching
  const filteredFound = useMemo(() => {
    return activeFoundReports.filter((item) => {
      if (foundCategory !== 'All' && item.category !== foundCategory) return false;
      if (foundSearch.trim()) {
        const q = foundSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.reportedBy?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeFoundReports, foundCategory, foundSearch]);

  // Selected Items for Manual Matching
  const selectedLostItem = useMemo(() => {
    return activeLostReports.find((i) => i.id === selectedLostId) || null;
  }, [activeLostReports, selectedLostId]);

  const selectedFoundItem = useMemo(() => {
    return activeFoundReports.find((i) => i.id === selectedFoundId) || null;
  }, [activeFoundReports, selectedFoundId]);

  // Handle Accept Suggested Match
  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalMatch) return;

    try {
      setSubmittingAccept(true);
      const res = await acceptSuggestedMatch(acceptModalMatch.id, acceptNote || undefined);

      if (!res.success) {
        alert(res.error || 'Failed to accept suggested match.');
        return;
      }

      setAcceptModalMatch(null);
      setAcceptNote('');
      showToast('Match connection established successfully! Found item set to PENDING_CLAIM.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error processing match acceptance.');
    } finally {
      setSubmittingAccept(false);
    }
  };

  // Handle Dismiss Suggested Match
  const handleDismiss = async (matchId: string) => {
    if (!confirm('Are you sure you want to dismiss this suggested match?')) return;
    try {
      const res = await dismissSuggestedMatch(matchId);
      if (!res.success) {
        alert(res.error || 'Failed to dismiss match.');
        return;
      }
      showToast('Suggested match dismissed.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error dismissing match.');
    }
  };

  // Handle Manual Connection Submit
  const handleManualConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLostId || !selectedFoundId) return;

    try {
      setSubmittingManualConnect(true);
      const res = await connectReportsManually(selectedLostId, selectedFoundId, manualConnectNote || undefined);

      if (!res.success) {
        alert(res.error || 'Failed to manually connect reports.');
        return;
      }

      setManualConnectModalOpen(false);
      setSelectedLostId(null);
      setSelectedFoundId(null);
      setManualConnectNote('');
      showToast('Reports manually connected! Found item set to PENDING_CLAIM.');
      setActiveTab('confirmed');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error connecting reports manually.');
    } finally {
      setSubmittingManualConnect(false);
    }
  };

  // Handle Disconnect Match
  const handleDisconnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disconnectModalMatch) return;
    if (!disconnectReason.trim()) {
      alert('Please provide a reason for disconnecting this match.');
      return;
    }

    try {
      setSubmittingDisconnect(true);
      const res = await disconnectMatch(disconnectModalMatch.id, disconnectReason.trim());

      if (!res.success) {
        alert(res.error || 'Failed to disconnect match.');
        return;
      }

      setDisconnectModalMatch(null);
      setDisconnectReason('');
      showToast('Match officially disconnected. Found item status reverted to OPEN.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error disconnecting match.');
    } finally {
      setSubmittingDisconnect(false);
    }
  };

  // Handle Arrange Collection
  const handleArrangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrangeModalMatch) return;

    try {
      setSubmittingArrange(true);
      const res = await arrangeCollection(arrangeModalMatch.id, arrangeNotes || undefined);

      if (!res.success) {
        alert(res.error || 'Failed to arrange collection.');
        return;
      }

      setArrangeModalMatch(null);
      setArrangeNotes('');
      showToast('Collection handover arranged! Student notified to collect item.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error arranging collection.');
    } finally {
      setSubmittingArrange(false);
    }
  };

  // Handle Confirm Handover
  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalMatch) return;

    try {
      setSubmittingHandover(true);
      const res = await confirmHandover(handoverModalMatch.id, handoverNotes || undefined);

      if (!res.success) {
        alert(res.error || 'Failed to confirm item handover.');
        return;
      }

      setHandoverModalMatch(null);
      setHandoverNotes('');
      showToast('Item handover officially confirmed! Both reports marked RESOLVED.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error confirming handover.');
    } finally {
      setSubmittingHandover(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      {/* Admin Operations Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title */}
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 shrink-0 border border-indigo-400/30">
                <GitCompare className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800">
                    Administration &amp; Matching Engine
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live System Active
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  Match &amp; Return Console
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged in as: <span className="text-slate-200 font-semibold">{currentUser?.name || 'Administrator'}</span> ({currentUser?.email || 'admin@campus.edu'})
                </p>
              </div>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <ShieldAlert className="h-4 w-4 text-purple-400" />
                Reports Dashboard
              </Link>
              <Link
                href="/admin/students"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <Users className="h-4 w-4 text-purple-400" />
                Student Directory
              </Link>
              <Link
                href="/admin/verification"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <HelpCircle className="h-4 w-4 text-purple-400" />
                Verification Hub
              </Link>
              <Link
                href="/admin/audit-log"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <History className="h-4 w-4 text-purple-400" />
                Audit Trail
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <Settings className="h-4 w-4 text-purple-400" />
                Admin Settings
              </Link>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('suggested')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'suggested'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Suggested Matches
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              activeTab === 'suggested' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {suggestedMatches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Manual Matching Studio
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'confirmed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Link2 className="h-4 w-4" />
            Active Connections &amp; Returns
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              activeTab === 'confirmed' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {confirmedMatches.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SUGGESTED MATCHES */}
        {activeTab === 'suggested' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search suggestions by item title, description, location, or reporter..."
                  value={suggestedSearch}
                  onChange={(e) => setSuggestedSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={suggestedCategory}
                  onChange={(e) => setSuggestedCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Suggestions List */}
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">Scanning campus registry for match suggestions...</p>
              </div>
            ) : filteredSuggested.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-3">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Suggested Matches Pending</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  The automated matching engine analyzes new lost and found reports as they arrive. When candidate pairs overlap in category, location, and keywords, suggestions appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuggested.map((match) => {
                  const scorePct = Math.round(match.similarityScore * 100);
                  return (
                    <div
                      key={match.id}
                      className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-indigo-300 transition-all"
                    >
                      {/* Match Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                            {scorePct}% Match Confidence
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Suggested on {new Date(match.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDismiss(match.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Dismiss
                          </button>
                          <button
                            onClick={() => {
                              setAcceptModalMatch(match);
                              setAcceptNote('');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accept &amp; Connect
                          </button>
                        </div>
                      </div>

                      {/* Side by Side Comparative Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Lost Item Card */}
                        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                              Lost Item Report
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              #{match.lostItem.id}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            {match.lostItem.image ? (
                              <img
                                src={match.lostItem.image}
                                alt={match.lostItem.name}
                                className="h-16 w-16 rounded-xl object-cover border border-amber-200 shrink-0"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                                <Package className="h-7 w-7" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {match.lostItem.name}
                              </h4>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                {match.lostItem.description}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-200/60 text-[11px]">
                            <div>
                              <span className="text-slate-400 block font-medium">Category:</span>
                              <span className="font-semibold text-slate-800">{match.lostItem.category}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Location Lost:</span>
                              <span className="font-semibold text-slate-800 truncate block">{match.lostItem.location}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Date Lost:</span>
                              <span className="font-semibold text-slate-800">{new Date(match.lostItem.date).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Reported By:</span>
                              <span className="font-semibold text-slate-800 truncate block">
                                {match.lostItem.reportedBy.name} {match.lostItem.reportedBy.studentId ? `(${match.lostItem.reportedBy.studentId})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Found Item Card */}
                        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-200/80 px-2 py-0.5 rounded-md">
                              Found Item Report
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              #{match.foundItem.id}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            {match.foundItem.image ? (
                              <img
                                src={match.foundItem.image}
                                alt={match.foundItem.name}
                                className="h-16 w-16 rounded-xl object-cover border border-blue-200 shrink-0"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-700 shrink-0 border border-blue-200">
                                <Package className="h-7 w-7" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {match.foundItem.name}
                              </h4>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                {match.foundItem.description}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-200/60 text-[11px]">
                            <div>
                              <span className="text-slate-400 block font-medium">Category:</span>
                              <span className="font-semibold text-slate-800">{match.foundItem.category}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Location Found:</span>
                              <span className="font-semibold text-slate-800 truncate block">{match.foundItem.location}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Date Found:</span>
                              <span className="font-semibold text-slate-800">{new Date(match.foundItem.date).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Custody / Found By:</span>
                              <span className="font-semibold text-slate-800 truncate block">
                                {match.foundItem.reportedBy.name}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL MATCHING STUDIO */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            
            {/* Top Instructions Banner */}
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3.5">
              <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900">Manual Match Studio Instructions</h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Select <strong>one active Lost report</strong> on the left and <strong>one active Found report</strong> on the right. You can inspect them side-by-side below and explicitly connect them with an optional administrative note.
                </p>
              </div>
            </div>

            {/* Dual Search Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Panel: Lost Reports */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">Active Lost Reports ({filteredLost.length})</h3>
                  </div>
                  {selectedLostItem && (
                    <button
                      onClick={() => setSelectedLostId(null)}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {/* Search & Filter */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lost items..."
                      value={lostSearch}
                      onChange={(e) => setLostSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <select
                    value={lostCategory}
                    onChange={(e) => setLostCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Items List */}
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {filteredLost.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No active lost reports found matching criteria.</p>
                  ) : (
                    filteredLost.map((item) => {
                      const isSelected = selectedLostId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedLostId(isSelected ? null : item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">#{item.id}</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{item.name}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
                                <span className="truncate">📍 {item.location}</span>
                                <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                              isSelected ? 'bg-amber-600 text-white' : 'border border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel: Found Reports */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900">Active Found Reports ({filteredFound.length})</h3>
                  </div>
                  {selectedFoundId && (
                    <button
                      onClick={() => setSelectedFoundId(null)}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {/* Search & Filter */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search found items..."
                      value={foundSearch}
                      onChange={(e) => setFoundSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <select
                    value={foundCategory}
                    onChange={(e) => setFoundCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Items List */}
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {filteredFound.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No active found reports found matching criteria.</p>
                  ) : (
                    filteredFound.map((item) => {
                      const isSelected = selectedFoundId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedFoundId(isSelected ? null : item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">#{item.id}</span>
                                {item.isAlreadyConfirmed && (
                                  <span className="text-[9px] font-extrabold uppercase text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-200">
                                    Already Connected
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{item.name}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
                                <span className="truncate">📍 {item.location}</span>
                                <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                              isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Selected Comparison & Action Section */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-indigo-600" />
                Selected Reports Comparison
              </h3>

              {(!selectedLostItem || !selectedFoundItem) ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  Select one Lost report from the left panel and one Found report from the right panel to compare and connect them.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Lost Summary */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="text-[11px] font-extrabold uppercase text-amber-800 mb-1">
                        Selected Lost Item (#{selectedLostItem.id})
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{selectedLostItem.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{selectedLostItem.description}</p>
                      <div className="mt-3 pt-3 border-t border-amber-200/70 text-xs space-y-1">
                        <div><strong>Category:</strong> {selectedLostItem.category}</div>
                        <div><strong>Location:</strong> {selectedLostItem.location}</div>
                        <div><strong>Date:</strong> {new Date(selectedLostItem.date).toLocaleDateString()}</div>
                        <div><strong>Reporter:</strong> {selectedLostItem.reportedBy?.name} ({selectedLostItem.reportedBy?.email})</div>
                      </div>
                    </div>

                    {/* Found Summary */}
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                      <div className="text-[11px] font-extrabold uppercase text-blue-800 mb-1">
                        Selected Found Item (#{selectedFoundItem.id})
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{selectedFoundItem.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{selectedFoundItem.description}</p>
                      <div className="mt-3 pt-3 border-t border-blue-200/70 text-xs space-y-1">
                        <div><strong>Category:</strong> {selectedFoundItem.category}</div>
                        <div><strong>Location:</strong> {selectedFoundItem.location}</div>
                        <div><strong>Date:</strong> {new Date(selectedFoundItem.date).toLocaleDateString()}</div>
                        <div><strong>Custodian:</strong> {selectedFoundItem.reportedBy?.name}</div>
                      </div>
                    </div>

                  </div>

                  {/* Connect Action Button */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedLostId(null);
                        setSelectedFoundId(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Reset Selection
                    </button>
                    <button
                      onClick={() => {
                        setManualConnectNote('');
                        setManualConnectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <Link2 className="h-4 w-4" />
                      Connect Reports Manually
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: ACTIVE CONNECTIONS & RETURNS */}
        {activeTab === 'confirmed' && (
          <div className="space-y-6">
            
            {confirmedMatches.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-3">
                  <Link2 className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Active Connections</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  When you accept suggested matches or create manual connections, they will be tracked here through the return and handover lifecycle.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {confirmedMatches.map((m) => {
                  const isManual = m.connectionType === 'MANUAL';
                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Distinct visual badge for MANUAL vs SUGGESTED */}
                          {isManual ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
                              <SlidersHorizontal className="h-3.5 w-3.5 text-purple-700" />
                              MANUAL CONNECTION
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                              <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                              SUGGESTED ORIGIN ({Math.round(m.similarityScore * 100)}%)
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            Status: {m.status}
                          </span>

                          {m.return && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              Return: {m.return.status}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {m.return?.status === 'CONFIRMED' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Handover Complete
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setArrangeModalMatch(m);
                                  setArrangeNotes(m.return?.notes || '');
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                              >
                                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                {m.return?.status === 'ARRANGED' ? 'Update Arrangement' : 'Arrange Collection'}
                              </button>

                              {m.return?.status === 'ARRANGED' ? (
                                <button
                                  onClick={() => {
                                    setHandoverModalMatch(m);
                                    setHandoverNotes('');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  Confirm Handover
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title="Arrange collection first before confirming handover"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-60"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  Confirm Handover
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setDisconnectModalMatch(m);
                                  setDisconnectReason('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <Unlink className="h-3.5 w-3.5" />
                                Disconnect Match
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Side by side reports */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="font-extrabold text-slate-800 flex items-center justify-between">
                            <span>Lost: {m.lostItem.name}</span>
                            <span className="text-slate-400 font-mono">#{m.lostItem.id}</span>
                          </div>
                          <p className="text-slate-600 line-clamp-1">{m.lostItem.description}</p>
                          <div className="text-[11px] text-slate-500 pt-2 flex justify-between">
                            <span>📍 {m.lostItem.location}</span>
                            <span>👤 {m.lostItem.reportedBy?.name}</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="font-extrabold text-slate-800 flex items-center justify-between">
                            <span>Found: {m.foundItem.name}</span>
                            <span className="text-slate-400 font-mono">#{m.foundItem.id}</span>
                          </div>
                          <p className="text-slate-600 line-clamp-1">{m.foundItem.description}</p>
                          <div className="text-[11px] text-slate-500 pt-2 flex justify-between">
                            <span>📍 {m.foundItem.location}</span>
                            <span>📦 Custody</span>
                          </div>
                        </div>
                      </div>

                      {/* Connection details footer */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                        <div>
                          Connected by <strong className="text-slate-700">{m.connectedBy?.name || 'Administrator'}</strong>
                          {m.connectedAt && ` on ${new Date(m.connectedAt).toLocaleDateString()}`}
                        </div>
                        {m.note && (
                          <div className="text-slate-600 italic">
                            Note: "{m.note}"
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL: ACCEPT SUGGESTED MATCH */}
      {acceptModalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Accept Suggested Match
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Confirm connection between Lost Item <strong>"{acceptModalMatch.lostItem.name}"</strong> and Found Item <strong>"{acceptModalMatch.foundItem.name}"</strong>. The found item will be updated to <strong>PENDING_CLAIM</strong> and the student reporter will be notified.
            </p>

            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Security / Administrative Note
                </label>
                <textarea
                  rows={3}
                  value={acceptNote}
                  onChange={(e) => setAcceptNote(e.target.value)}
                  placeholder="e.g. Serial numbers match, student verified at front desk..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAcceptModalMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAccept}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingAccept ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Confirm Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL CONNECT CONFIRMATION */}
      {manualConnectModalOpen && selectedLostItem && selectedFoundItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-indigo-600" />
              Confirm Manual Match Connection
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please review both reports before authorizing the manual connection.
            </p>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-700 block mb-0.5">Lost Report</span>
                <div className="font-bold text-slate-900 truncate">{selectedLostItem.name}</div>
                <div className="text-slate-500 text-[11px] truncate">{selectedLostItem.location}</div>
                <div className="text-slate-500 text-[11px] truncate">{selectedLostItem.reportedBy?.name}</div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-700 block mb-0.5">Found Report</span>
                <div className="font-bold text-slate-900 truncate">{selectedFoundItem.name}</div>
                <div className="text-slate-500 text-[11px] truncate">{selectedFoundItem.location}</div>
                <div className="text-slate-500 text-[11px] truncate">{selectedFoundItem.reportedBy?.name}</div>
              </div>
            </div>

            <form onSubmit={handleManualConnectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Connection Reason / Admin Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={manualConnectNote}
                  onChange={(e) => setManualConnectNote(e.target.value)}
                  placeholder="e.g. Physical inspection matched distinct engravement on back..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManualConnect}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingManualConnect ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                  Connect Reports Manually
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ARRANGE COLLECTION */}
      {arrangeModalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2 text-indigo-700">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Arrange Collection / Pickup Schedule
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Set return arrangement details for Lost Item <strong>"{arrangeModalMatch.lostItem.name}"</strong> (Claimant: <strong>{arrangeModalMatch.lostItem.reportedBy?.name}</strong>). The student will be notified to collect the item.
            </p>

            <form onSubmit={handleArrangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Collection Instructions &amp; Pickup Location
                </label>
                <textarea
                  rows={3}
                  value={arrangeNotes}
                  onChange={(e) => setArrangeNotes(e.target.value)}
                  placeholder="e.g. Please collect from Main Campus Security Desk (Building B) between 9am - 4pm with student ID."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setArrangeModalMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingArrange}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingArrange ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                  Save Arrangement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM HANDOVER */}
      {handoverModalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2 text-emerald-700">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              Confirm Official Physical Handover
            </h3>
            
            <div className="p-3 my-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Irreversible Real-World Confirmation:</strong> Confirming this handover indicates that the physical item has been transferred to the verified student. Both the Lost and Found reports will be permanently marked as <strong>RESOLVED</strong>.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-700 block mb-0.5">Lost Item Recipient</span>
                <div className="font-bold text-slate-900 truncate">{handoverModalMatch.lostItem.name}</div>
                <div className="text-slate-600 text-[11px] truncate">Recipient: <strong>{handoverModalMatch.lostItem.reportedBy?.name}</strong></div>
                <div className="text-slate-500 text-[10px] truncate">{handoverModalMatch.lostItem.reportedBy?.email}</div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-700 block mb-0.5">Found Item Released</span>
                <div className="font-bold text-slate-900 truncate">{handoverModalMatch.foundItem.name}</div>
                <div className="text-slate-600 text-[11px] truncate">Location: {handoverModalMatch.foundItem.location}</div>
                <div className="text-slate-500 text-[10px] truncate">Locker: {handoverModalMatch.foundItem.storageLocation || 'Security Desk'}</div>
              </div>
            </div>

            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Handover Confirmation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Student presented physical ID card #10294, item condition verified in person."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHandoverModalMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHandover}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {submittingHandover ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                  Confirm Handover &amp; Resolve Reports
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISCONNECT MATCH */}
      {disconnectModalMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2 text-rose-600">
              <Unlink className="h-5 w-5 text-rose-600" />
              Disconnect Match
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to disconnect Lost Item <strong>"{disconnectModalMatch.lostItem.name}"</strong> and Found Item <strong>"{disconnectModalMatch.foundItem.name}"</strong>? This will revert the found item status and record an audit log.
            </p>

            <form onSubmit={handleDisconnectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Disconnection Reason <span className="text-rose-600 font-bold">*</span> (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={disconnectReason}
                  onChange={(e) => setDisconnectReason(e.target.value)}
                  placeholder="e.g. Student inspected item in person and confirmed it is not theirs..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDisconnectModalMatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDisconnect}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingDisconnect ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                  Confirm Disconnect
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
