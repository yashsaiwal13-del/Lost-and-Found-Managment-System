'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  Lock, 
  Sparkles, 
  Share2, 
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MOCK_ITEMS, STUDENT_PROFILE } from '@/data/mockData';
import { CampusItem } from '@/types';
import { submitOwnershipClaim } from '@/app/actions/claims';

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = (params?.id as string) || '';

  // Find the item in mock registry
  const item: CampusItem | undefined = useMemo(() => {
    return MOCK_ITEMS.find((i) => i.id.toLowerCase() === itemId.toLowerCase());
  }, [itemId]);

  // Claim Form State (Visible so student can verify immediately)
  const [showClaimForm, setShowClaimForm] = useState(true);
  const [claimData, setClaimData] = useState({
    exactColor: '',
    uniqueMark: '',
    lastSeenLocation: '',
    studentName: STUDENT_PROFILE.name,
    studentId: STUDENT_PROFILE.studentId,
  });

  const [claimErrors, setClaimErrors] = useState<{
    exactColor?: string;
    uniqueMark?: string;
    lastSeenLocation?: string;
  }>({});

  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [generatedClaimId, setGeneratedClaimId] = useState('');

  // Claim Form Validation
  const validateClaim = (): boolean => {
    const errors: typeof claimErrors = {};

    if (!claimData.exactColor.trim()) {
      errors.exactColor = 'Please specify the exact color or shade.';
    }
    if (!claimData.uniqueMark.trim()) {
      errors.uniqueMark = 'Please describe at least one unique identifying mark or detail.';
    } else if (claimData.uniqueMark.trim().length < 5) {
      errors.uniqueMark = 'Please provide a more descriptive detail (at least 5 characters).';
    }
    if (!claimData.lastSeenLocation.trim()) {
      errors.lastSeenLocation = 'Please mention where you last saw or remember having it.';
    }

    setClaimErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateClaim()) {
      return;
    }

    setIsSubmittingClaim(true);

    try {
      const res = await submitOwnershipClaim({
        itemId: item ? item.id : itemId,
        color: claimData.exactColor,
        uniqueMark: claimData.uniqueMark,
        lastSeenLocation: claimData.lastSeenLocation,
      });

      if (res.success && res.claimId) {
        setGeneratedClaimId(res.claimId);
        setClaimSuccess(true);
      } else {
        alert(res.error || 'Could not submit claim. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Claim Pending Verification
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Reunited with Owner
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            In Security Custody (Awaiting Owner Claim)
          </span>
        );
    }
  };

  // If item not found
  if (!item) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 py-16 px-4 text-center max-w-lg mx-auto">
          <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Item Not Found</h1>
          <p className="text-xs text-slate-500 mt-2">
            No item matching reference code &quot;{itemId}&quot; exists in the campus lost &amp; found registry.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/browse"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Browse Registry
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-indigo-600 transition-colors">
            Browse Registry
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {item.title}
          </span>
        </nav>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Found Registry
          </Link>
        </div>

        {/* Main Content Grid: 2 cols on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Col 1 & 2: Main Item Presentation */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Item Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              
              {/* 1. Item Photo Container */}
              <div className="relative w-full h-64 sm:h-80 rounded-2xl bg-gradient-to-tr from-slate-100 via-indigo-50/40 to-slate-100 border border-slate-200/80 flex flex-col items-center justify-center p-6 text-center overflow-hidden group">
                
                {/* Visual Category Illustration / Placeholder */}
                <div className="h-24 w-24 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform duration-200 mb-3">
                  <Tag className="h-10 w-10 text-indigo-600" />
                </div>

                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Official Campus Safety Evidence Custody #{item.id}
                </span>

                {/* Status Overlay Badge */}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(item.status)}
                </div>

                {/* Reference ID Pill */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-600 border border-slate-200 shadow-2xs">
                  Ref: #{item.id}
                </div>
              </div>

              {/* 2. Item Name */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* 3. Category */}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                    <Tag className="h-3 w-3" />
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Reported by {item.reportedBy.role} ({item.reportedBy.name})
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {item.title}
                </h1>
              </div>

              {/* 4. Found Location & 5. Found Date */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Found Location
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Found Date &amp; Time
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Storage Custody */}
              {item.storageLocation && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-500">Currently Secured At: </span>
                    <span className="font-bold text-emerald-900">{item.storageLocation}</span>
                  </div>
                </div>
              )}

              {/* 6. Description */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Public Description &amp; Details
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl">
                  {item.description}
                </p>
              </div>

              {/* 7. Status Explanation & CTA Bar */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Is this your belonging?
                  </span>
                  <span className="text-xs text-slate-500">
                    Answer 3 quick identifying questions to verify ownership with security.
                  </span>
                </div>

                {/* Submit Ownership Claim Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowClaimForm(true);
                    // Smooth scroll down to form
                    setTimeout(() => {
                      document.getElementById('claim-form-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Ownership Claim</span>
                </button>
              </div>

            </div>

            {/* OWNERSHIP CLAIM FORM SECTION */}
            <div id="claim-form-section">
              {showClaimForm && (
                <div className="bg-white rounded-3xl border border-indigo-200 p-6 sm:p-8 shadow-lg shadow-indigo-100/50 animate-in slide-in-from-top duration-300">
                  
                  {claimSuccess ? (
                    /* Claim Success Confirmation */
                    <div className="text-center py-6">
                      <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                        Claim Received by Campus Security
                      </span>

                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Ownership Claim Submitted!
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                        Your verification answers for <span className="font-semibold text-slate-800">{item.title}</span> have been sent to the Campus Safety Office for cross-examination.
                      </p>

                      {/* Claim Summary Card */}
                      <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
                        <div className="flex justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-medium">Claim Reference</span>
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {generatedClaimId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Claimant:</span>
                          <span className="font-semibold text-slate-800">{claimData.studentName} ({claimData.studentId})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pick-up Location:</span>
                          <span className="font-medium text-slate-700">{item.storageLocation || 'Main Security Desk'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Estimated Review Time:</span>
                          <span className="font-medium text-emerald-700">15 – 30 Minutes</span>
                        </div>
                      </div>

                      {/* Next Steps Reminder */}
                      <div className="mt-5 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 max-w-md mx-auto text-left flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          Please bring your official <strong>College Student ID card</strong> to the Security Desk when collecting your belonging.
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                          href="/dashboard"
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
                        >
                          Track in Student Dashboard
                        </Link>
                        <Link
                          href="/browse"
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Browse Other Items
                        </Link>
                      </div>

                    </div>
                  ) : (
                    /* The 3-Question Ownership Claim Form */
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-slate-900">
                              Ownership Verification Claim
                            </h2>
                            <p className="text-xs text-slate-500">
                              Claiming: <span className="font-semibold text-slate-700">{item.title}</span> (#{item.id})
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowClaimForm(false)}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleClaimSubmit} noValidate className="space-y-5">
                        
                        {/* Claimant info banner */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Claimant Student Account</span>
                            <span className="font-semibold text-slate-800">{claimData.studentName}</span>
                          </div>
                          <span className="font-mono text-slate-500">{claimData.studentId}</span>
                        </div>

                        {/* QUESTION 1: What is the exact color? */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            1. What is the exact color? <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Matte black, rose gold with transparent bumper, deep navy blue..."
                            value={claimData.exactColor}
                            onChange={(e) => {
                              setClaimData({ ...claimData, exactColor: e.target.value });
                              if (claimErrors.exactColor) setClaimErrors({ ...claimErrors, exactColor: undefined });
                            }}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                              claimErrors.exactColor
                                ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                                : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          />
                          {claimErrors.exactColor && (
                            <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {claimErrors.exactColor}
                            </p>
                          )}
                        </div>

                        {/* QUESTION 2: What unique mark does it have? */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            2. What unique mark does it have? <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Small scratch on the top corner, astronaut sticker on the back, lock screen wallpaper of a golden retriever, initials etched..."
                            value={claimData.uniqueMark}
                            onChange={(e) => {
                              setClaimData({ ...claimData, uniqueMark: e.target.value });
                              if (claimErrors.uniqueMark) setClaimErrors({ ...claimErrors, uniqueMark: undefined });
                            }}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                              claimErrors.uniqueMark
                                ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                                : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          />
                          {claimErrors.uniqueMark && (
                            <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {claimErrors.uniqueMark}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                            Kept confidential. Checked strictly by campus security against the held item.
                          </p>
                        </div>

                        {/* QUESTION 3: Where did you last see it? */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            3. Where did you last see it? <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Left on the 2nd floor library study table around 3:00 PM..."
                            value={claimData.lastSeenLocation}
                            onChange={(e) => {
                              setClaimData({ ...claimData, lastSeenLocation: e.target.value });
                              if (claimErrors.lastSeenLocation) setClaimErrors({ ...claimErrors, lastSeenLocation: undefined });
                            }}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none transition-colors ${
                              claimErrors.lastSeenLocation
                                ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                                : 'border-slate-200 focus:border-indigo-500'
                            }`}
                          />
                          {claimErrors.lastSeenLocation && (
                            <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {claimErrors.lastSeenLocation}
                            </p>
                          )}
                        </div>

                        {/* Submit Claim Button */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowClaimForm(false)}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingClaim}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-70 transition-all cursor-pointer"
                          >
                            {isSubmittingClaim ? (
                              <>
                                <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>Verifying Claim...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" />
                                <span>Submit Claim to Security</span>
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

          {/* Col 3: Sidebar Security Desk Guidance */}
          <div className="space-y-6">
            
            {/* Safe Custody Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-3">
                <ShieldCheck className="h-4 w-4" />
                Security Verification Protocol
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campus security protects student property by keeping physical found items locked in designated safe lockers.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <p>• Only true owners know secret marks and passwords.</p>
                <p>• Student ID card required at pickup.</p>
                <p>• Unclaimed items held for 90 days per college policy.</p>
              </div>
            </div>

            {/* Campus Safety Desk Info */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-3">
                <Building2 className="h-4 w-4" />
                Main Security Desk
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Visit the central security dispatch desk to collect verified items or turn in discovered property.
              </p>
              <div className="text-xs space-y-1.5 text-slate-400 border-t border-slate-700/60 pt-3">
                <p><span className="text-white font-medium">Building:</span> Administration Complex #4</p>
                <p><span className="text-white font-medium">Room:</span> Ground Floor, Room 102</p>
                <p><span className="text-white font-medium">Operating Hours:</span> 7:00 AM – 9:00 PM</p>
                <p><span className="text-white font-medium">Dispatch Phone:</span> (555) 019-2834</p>
              </div>
            </div>

            {/* Questions Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 text-amber-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1.5 text-amber-800">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                Why 3 Verification Questions?
              </div>
              <p className="leading-relaxed text-amber-800/90">
                Asking about exact color, unique marks, and last seen location helps officers identify genuine owners within minutes without public exposure.
              </p>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
