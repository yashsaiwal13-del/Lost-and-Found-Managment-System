'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  Calendar, 
  Tag, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  ArrowLeft,
  X,
  FileCheck,
  Check,
  Ban,
  Eye,
  UserCheck,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { OFFICER_PROFILE, CATEGORIES } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { AdminClaim, CampusItem, ClaimDecision } from '@/types';
import { getAdminClaims, approveClaim, rejectClaim, confirmHandover } from '@/app/actions/claims';
import { getAllCampusItems } from '@/app/actions/getItems';
import { changeItemStatus } from '@/app/actions/items';
import { getCurrentUser } from '@/app/actions/auth';
import Sidebar from '@/components/dashboard/Sidebar';

export default function SecurityDeskPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Claims Queue
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<AdminClaim | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [rejectPromptClaim, setRejectPromptClaim] = useState<AdminClaim | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Verification answers did not match held item specifications.');

  // Handover Modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverItem, setHandoverItem] = useState<CampusItem | null>(null);
  const [handoverRecipientId, setHandoverRecipientId] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  // Custody Locker Items
  const [foundItems, setFoundItems] = useState<CampusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockerSearch, setLockerSearch] = useState('');
  const [lockerCategory, setLockerCategory] = useState('All');
  
  // Notification Toast
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    getAdminClaims().then((data) => {
      if (data) setClaims(data);
    });

    getAllCampusItems({ type: 'FOUND', limit: 100 })
      .then((data) => {
        if (data) setFoundItems(data);
      })
      .catch((err) => console.error('Error loading found items in security desk:', err))
      .finally(() => setLoading(false));

    getCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const officerName = currentUser?.name || OFFICER_PROFILE.name;
  const officerBadge = currentUser?.studentId || OFFICER_PROFILE.badgeNumber;

  // Handle Approve Claim (Intermediate VERIFIED state)
  const handleApproveClaim = async (claimId: string) => {
    const res = await approveClaim(claimId);
    if (res.success) {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: 'approved' as ClaimDecision } : c))
      );
      const target = claims.find((c) => c.id === claimId);
      setAlertMessage(`Claim #${claimId} for "${target?.itemTitle}" APPROVED. Item status updated to VERIFIED (awaiting handover confirmation).`);
      setInspectModalOpen(false);
      setTimeout(() => setAlertMessage(null), 5000);
      loadData();
    } else {
      alert(res.error || 'Failed to approve claim.');
    }
  };

  // Handle Reject Claim
  const handleRejectClaim = async (claimId: string) => {
    const res = await rejectClaim(claimId, rejectionReason);
    if (res.success) {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId ? { ...c, status: 'rejected' as ClaimDecision, rejectionReason } : c
        )
      );
      setAlertMessage(`Claim #${claimId} has been REJECTED. Logged in security custody record.`);
      setRejectPromptClaim(null);
      setInspectModalOpen(false);
      setTimeout(() => setAlertMessage(null), 5000);
    } else {
      alert(res.error || 'Failed to reject claim.');
    }
  };

  // Handle Explicit Confirm Handover
  const handleConfirmHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverItem) return;
    try {
      setHandoverSubmitting(true);
      const res = await confirmHandover(
        handoverItem.id,
        handoverRecipientId || undefined,
        handoverNotes || undefined
      );
      if (res.success) {
        setAlertMessage(`Handover confirmed! Item #${handoverItem.id} officially marked RESOLVED & returned.`);
        setHandoverModalOpen(false);
        setHandoverItem(null);
        setHandoverRecipientId('');
        setHandoverNotes('');
        setTimeout(() => setAlertMessage(null), 5000);
        loadData();
      } else {
        alert(res.error || 'Failed to confirm item handover.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error confirming item handover.');
    } finally {
      setHandoverSubmitting(false);
    }
  };

  // Handle Direct Mark Item as RESOLVED
  const handleMarkResolved = async (itemId: string) => {
    try {
      const res = await changeItemStatus(itemId, 'RESOLVED');
      if (res.success) {
        setAlertMessage(`Item #${itemId} marked as RESOLVED & returned to owner.`);
        setTimeout(() => setAlertMessage(null), 5000);
        loadData();
      } else {
        alert(res.error || 'Failed to update item status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter locker items
  const filteredLockerItems = useMemo(() => {
    return foundItems.filter((item) => {
      if (lockerCategory !== 'All' && item.category !== lockerCategory) return false;
      if (lockerSearch.trim()) {
        const q = lockerSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          (item.storageLocation && item.storageLocation.toLowerCase().includes(q)) ||
          item.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [foundItems, lockerCategory, lockerSearch]);

  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const approvedClaims = claims.filter((c) => c.status === 'approved');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      {/* Security Operations Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Officer Profile */}
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 shrink-0 border border-blue-400/30">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800">
                    Campus Safety &amp; Custody Desk
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Officer Active
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  {officerName} <span className="text-slate-400 font-mono text-sm">({officerBadge})</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {OFFICER_PROFILE.assignedStation} • {OFFICER_PROFILE.shift}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Link
                href="/report-found"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                Log Turned-In Item
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                Public Registry
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Toast Notification */}
        {alertMessage && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{alertMessage}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Security Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Pending Claims to Verify</span>
            <div className="text-3xl font-black text-amber-600 mt-1">{pendingClaims.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Requires officer question review</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Items in Security Custody</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{foundItems.filter(i => i.status !== 'resolved').length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Stored in campus safe lockers</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Belongings Reunited &amp; Resolved</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{approvedClaims.length + foundItems.filter(i => i.status === 'resolved').length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Returned to verified owners</p>
          </div>
        </div>

        {/* Section 1: Claims Review Queue */}
        <section id="claims" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Ownership Claims Review Queue
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  {pendingClaims.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect 3-point ownership proof submitted by students before releasing items.
              </p>
            </div>
          </div>

          {pendingClaims.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">All Claims Clear!</h3>
              <p className="text-xs text-slate-500 mt-1">No pending ownership claims awaiting review right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">#{claim.id}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Item: {claim.itemId}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Submitted {claim.submittedDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {claim.claimantName} ({claim.studentId}) — Claiming &quot;{claim.itemTitle}&quot;
                    </h3>
                    <p className="text-xs text-slate-600">
                      Email: <span className="font-medium text-slate-800">{claim.studentEmail}</span> • Locker: <span className="font-semibold text-emerald-700">{claim.storageLocation}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setInspectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      Inspect Answers
                    </button>
                    <button
                      onClick={() => handleApproveClaim(claim.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Approve &amp; Return
                    </button>
                    <button
                      onClick={() => setRejectPromptClaim(claim)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Ban className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Custody Locker & Found Items Table */}
        <section id="locker" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Campus Security Custody Locker
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage found items currently held in official lockers and safe desks.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter locker items..."
                  value={lockerSearch}
                  onChange={(e) => setLockerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={lockerCategory}
                onChange={(e) => setLockerCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Ref ID</th>
                  <th className="px-6 py-3.5">Found Item</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Found Location</th>
                  <th className="px-6 py-3.5">Custody Locker / Desk</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLockerItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-500">#{item.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{item.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.location}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block">
                        {item.storageLocation || 'Security Central Locker'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'verified'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : item.status === 'pending_verification'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'resolved' ? (
                        <span className="text-slate-400 font-medium text-xs">Returned ✓</span>
                      ) : item.status === 'verified' ? (
                        <button
                          onClick={() => {
                            setHandoverItem(item);
                            setHandoverRecipientId('');
                            setHandoverNotes('');
                            setHandoverModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Confirm Handover
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setHandoverItem(item);
                            setHandoverRecipientId('');
                            setHandoverNotes('');
                            setHandoverModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Confirm Handover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Inspect Claim Modal */}
      {inspectModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setInspectModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              Ownership Verification Answers
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Claim #{selectedClaim.id}: {selectedClaim.itemTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Claimant: <span className="font-semibold text-slate-800">{selectedClaim.claimantName}</span> ({selectedClaim.studentId}) • {selectedClaim.studentEmail}
            </p>

            <div className="mt-5 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">1. Stated Exact Color / Finish:</span>
                <p className="font-semibold text-slate-800 mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedClaim.answers.exactColor}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">2. Unique Identifying Marks / Screen Wallpaper:</span>
                <p className="font-semibold text-slate-800 mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedClaim.answers.uniqueMark}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">3. Last Seen Campus Location:</span>
                <p className="font-semibold text-slate-800 mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedClaim.answers.lastSeenLocation}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setInspectModalOpen(false);
                  setRejectPromptClaim(selectedClaim);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl"
              >
                Reject Claim
              </button>
              <button
                onClick={() => handleApproveClaim(selectedClaim.id)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Approve Verification (Verified)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {handoverModalOpen && handoverItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              Confirm Item Custody Handover
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Officially hand over item #{handoverItem.id} ({handoverItem.title}) to verified recipient.
            </p>

            <form onSubmit={handleConfirmHandoverSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Student ID / Account ID (Optional, defaults to reporter)
                </label>
                <input
                  type="text"
                  value={handoverRecipientId}
                  onChange={(e) => setHandoverRecipientId(e.target.value)}
                  placeholder="e.g. STU-2026-8819 or User ID"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Handover Notes / Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Physical student ID inspected. Item returned in good condition."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={handoverSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {handoverSubmitting ? 'Confirming...' : 'Authorize & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Prompt Modal */}
      {rejectPromptClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Reject Claim #{rejectPromptClaim.id}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Specify the reason why verification failed for {rejectPromptClaim.claimantName}.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-4 w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectPromptClaim(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectClaim(rejectPromptClaim.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
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
