'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  AlertCircle, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Tag, 
  Building2, 
  Eye, 
  Check, 
  X, 
  ArrowLeft, 
  Lock, 
  UserCheck, 
  FileText, 
  Sparkles,
  HelpCircle,
  LogOut,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  MOCK_ITEMS, 
  ADMIN_STATS, 
  ADMIN_CLAIMS, 
  OFFICER_PROFILE,
  CATEGORIES,
  CAMPUS_LOCATIONS 
} from '@/data/mockData';
import { AdminClaim, CampusItem, ClaimDecision } from '@/types';
import { getAdminClaims, approveClaim, rejectClaim } from '@/app/actions/claims';
import { getCurrentUser } from '@/app/actions/auth';

export default function AdminSecurityDashboard() {
  // Claims State (loaded from PostgreSQL database with fallback to collegiate mock claims)
  const [claims, setClaims] = useState<AdminClaim[]>(ADMIN_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<AdminClaim | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [rejectPromptClaim, setRejectPromptClaim] = useState<AdminClaim | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Verification answers did not match held item specifications.');

  // Notification Banner
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load real claims and current session user on mount
  useEffect(() => {
    getAdminClaims().then((data) => {
      if (data && data.length > 0) {
        setClaims(data);
      }
    });

    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Reports Table State
  const [reportFilter, setReportFilter] = useState<'all' | 'lost' | 'found' | 'resolved'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [selectedReportCategory, setSelectedReportCategory] = useState('All');

  // Compute live metrics based on state
  const metrics = useMemo(() => {
    const pendingCount = claims.filter((c) => c.status === 'pending').length;
    const approvedCount = claims.filter((c) => c.status === 'approved').length;
    return {
      totalLost: ADMIN_STATS.totalLostReports,
      totalFound: ADMIN_STATS.totalFoundReports,
      pendingClaims: pendingCount,
      resolvedItems: ADMIN_STATS.resolvedItems + approvedCount,
    };
  }, [claims]);

  // Handle Approve Claim (Updates Claim to APPROVED and Item to RESOLVED in PostgreSQL)
  const handleApproveClaim = async (claimId: string) => {
    // 1. Call server action to update database
    await approveClaim(claimId, currentUser?.name || OFFICER_PROFILE.name);

    // 2. Update local UI state immediately
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'approved' as ClaimDecision } : c))
    );
    const target = claims.find((c) => c.id === claimId);
    setAlertMessage(`Claim ${claimId} for "${target?.itemTitle}" has been APPROVED. Item status updated to RESOLVED.`);
    setInspectModalOpen(false);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Handle Reject Claim (Updates Claim to REJECTED in PostgreSQL)
  const handleRejectClaim = async (claimId: string) => {
    // 1. Call server action to update database
    await rejectClaim(claimId, rejectionReason, currentUser?.name || OFFICER_PROFILE.name);

    // 2. Update local UI state immediately
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, status: 'rejected' as ClaimDecision, rejectionReason }
          : c
      )
    );
    setAlertMessage(`Claim ${claimId} has been REJECTED. Reason recorded in security custody log.`);
    setRejectPromptClaim(null);
    setInspectModalOpen(false);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Filter Reports Table
  const filteredReports = useMemo(() => {
    return MOCK_ITEMS.filter((item) => {
      if (reportFilter === 'lost' && item.type !== 'lost') return false;
      if (reportFilter === 'found' && item.type !== 'found') return false;
      if (reportFilter === 'resolved' && item.status !== 'resolved') return false;
      if (selectedReportCategory !== 'All' && item.category !== selectedReportCategory) return false;

      if (reportSearchQuery.trim() !== '') {
        const q = reportSearchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesId) return false;
      }

      return true;
    });
  }, [reportFilter, selectedReportCategory, reportSearchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar />

      {/* Security Staff Operations Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Officer Profile & Station Info */}
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 shrink-0 border border-indigo-400/30">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800">
                    Campus Safety Admin Desk
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    On Duty
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  {OFFICER_PROFILE.name} <span className="text-slate-400 font-mono text-sm">({OFFICER_PROFILE.badgeNumber})</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {OFFICER_PROFILE.assignedStation} • {OFFICER_PROFILE.shift}
                </p>
              </div>
            </div>

            {/* Quick Links & Switchers */}
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                Student View
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Public Home
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Main Operations Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Toast Notification */}
        {alertMessage && (
          <div className="bg-emerald-900/90 border border-emerald-700 text-emerald-100 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{alertMessage}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-emerald-300 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 1-4: The 4 Required Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: Total Lost Reports */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Active Seeking
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Lost Reports
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                {metrics.totalLost}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              Student submissions awaiting match
            </p>
          </div>

          {/* Card 2: Total Found Reports */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                In Custody
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Found Reports
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                {metrics.totalFound}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              Secured in lockers &amp; reception desks
            </p>
          </div>

          {/* Card 3: Pending Claims */}
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-xs flex flex-col justify-between bg-amber-50/10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                Officer Action Needed
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Pending Claims
              </span>
              <div className="text-3xl font-black text-amber-700 tracking-tight mt-1">
                {metrics.pendingClaims}
              </div>
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-3 pt-2.5 border-t border-amber-200/60">
              Submitted student ownership claims
            </p>
          </div>

          {/* Card 4: Resolved Items */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Case Closed
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Resolved Items
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                {metrics.resolvedItems}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              Reunited with verified students
            </p>
          </div>

        </section>

        {/* 5. Pending Claims Table (Requested Section) */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Pending Ownership Claims
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review student answers to verify proof before approving custody release.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{claims.length}</span> recorded claims
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Claim ID</th>
                  <th className="py-3.5 px-6">Item Claimed</th>
                  <th className="py-3.5 px-6">Claimant Student</th>
                  <th className="py-3.5 px-6">Custody Locker</th>
                  <th className="py-3.5 px-6">Submitted</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Claim ID */}
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600">
                      {claim.id}
                    </td>

                    {/* Item */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{claim.itemTitle}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Ref #{claim.itemId}</div>
                    </td>

                    {/* Claimant */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{claim.claimantName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{claim.studentId}</div>
                    </td>

                    {/* Custody Locker */}
                    <td className="py-4 px-6 font-medium text-slate-700">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{claim.storageLocation}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-slate-500">
                      {claim.submittedDate}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-6">
                      {claim.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Clock className="h-3 w-3 text-amber-500" /> Pending Review
                        </span>
                      )}
                      {claim.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Approved
                        </span>
                      )}
                      {claim.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3 text-rose-500" /> Rejected
                        </span>
                      )}
                    </td>

                    {/* The 3 Requested Buttons: View Claim, Approve Claim, Reject Claim */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View Claim button */}
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setInspectModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                          title="View submitted student answers"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View Claim</span>
                        </button>

                        {claim.status === 'pending' && (
                          <>
                            {/* Approve Claim button */}
                            <button
                              onClick={() => handleApproveClaim(claim.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-2xs active:scale-95 cursor-pointer"
                              title="Approve ownership and issue release"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>

                            {/* Reject Claim button */}
                            <button
                              onClick={() => setRejectPromptClaim(claim)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 cursor-pointer"
                              title="Reject claim due to insufficient proof"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

        {/* 6. Reports Table (Requested Section) */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Header with Filters */}
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Campus Lost &amp; Found Reports Registry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Central database of all belongings logged by students, faculty, and campus dispatch.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Type Switcher Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setReportFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    reportFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({MOCK_ITEMS.length})
                </button>
                <button
                  onClick={() => setReportFilter('lost')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    reportFilter === 'lost'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lost
                </button>
                <button
                  onClick={() => setReportFilter('found')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    reportFilter === 'found'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Found
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter reports..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Item Title</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Campus Location</th>
                  <th className="py-3.5 px-6">Reported By</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Status / Locker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-500">
                      <Link href={`/items/${item.id}`} className="hover:text-indigo-600">
                        #{item.id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      <Link href={`/items/${item.id}`} className="hover:text-indigo-600">
                        {item.title}
                      </Link>
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.type === 'found'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-slate-700 font-medium">
                      {item.category}
                    </td>

                    <td className="py-3.5 px-6 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">{item.location}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 capitalize text-slate-600">
                      {item.reportedBy.role}: {item.reportedBy.name}
                    </td>

                    <td className="py-3.5 px-6 text-slate-500">
                      {item.date}
                    </td>

                    <td className="py-3.5 px-6">
                      {item.storageLocation ? (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 truncate block max-w-[180px]">
                          {item.storageLocation}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Active Search
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

      </main>

      {/* VIEW CLAIM INSPECTION MODAL */}
      {inspectModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setInspectModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Security Claim Inspection
              </span>
              <span className="text-xs font-mono text-slate-400">
                {selectedClaim.id}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Claim for {selectedClaim.itemTitle}
            </h2>

            {/* Storage custody reminder */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Held at:</span>
                <span className="font-bold text-slate-800">{selectedClaim.storageLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Claimant Student:</span>
                <span className="font-semibold text-slate-800">{selectedClaim.claimantName} ({selectedClaim.studentId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Email:</span>
                <span className="font-mono text-slate-700">{selectedClaim.studentEmail}</span>
              </div>
            </div>

            {/* The 3 Student Verification Answers */}
            <div className="mt-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Submitted Ownership Proof (Cross-Examine with Item)
              </h3>

              {/* Answer 1: Exact Color */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  1. What is the exact color?
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {selectedClaim.answers.exactColor}
                </p>
              </div>

              {/* Answer 2: Unique Mark */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  2. What unique mark does it have?
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {selectedClaim.answers.uniqueMark}
                </p>
              </div>

              {/* Answer 3: Last Seen Location */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  3. Where did you last see it?
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {selectedClaim.answers.lastSeenLocation}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>

              {selectedClaim.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectPromptClaim(selectedClaim);
                      setInspectModalOpen(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => handleApproveClaim(selectedClaim.id)}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                  >
                    Approve &amp; Issue Pickup
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REJECT PROMPT MODAL */}
      {rejectPromptClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <h3 className="text-lg font-bold text-slate-900">
              Reject Claim #{rejectPromptClaim.id}?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please document the security review reason for claimant {rejectPromptClaim.claimantName}.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Security Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRejectPromptClaim(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectClaim(rejectPromptClaim.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
