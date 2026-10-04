'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  MapPin,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Package,
  Building2,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { StudentReport, ItemStatus } from '@/types';

interface ReportDetailsModalProps {
  report: StudentReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportDetailsModal({
  report,
  isOpen,
  onClose,
}: ReportDetailsModalProps) {
  if (!isOpen || !report) return null;

  const isLost = report.type === 'lost';
  const match = report.connectedMatch;

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Verification In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Resolved &amp; Reclaimed
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Active / In Search
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isLost
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isLost ? (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Lost Report
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3 w-3" />
                    Found Report
                  </>
                )}
              </span>
              <span className="text-xs font-mono text-slate-400">
                #{report.id}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-lg">
              {report.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 flex-1">
          
          {/* Status & Match Highlighting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              {getStatusBadge(report.status)}
            </div>

            {match && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                {Math.round(match.similarityScore * 100)}% Match Connected
              </span>
            )}
          </div>

          {/* Image & Main Info */}
          <div className="space-y-4">
            {report.image && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-60 flex items-center justify-center">
                <img
                  src={report.image}
                  alt={report.title}
                  className="w-full h-full object-contain max-h-60"
                />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 leading-relaxed">
                {report.description || 'No additional description provided.'}
              </p>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 block">Reported Location</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{report.location}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 block">Date Reported</span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {report.dateReported} {report.time ? `• ${report.time}` : ''}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 block">Category</span>
                  <span className="text-xs font-bold text-slate-800 block">{report.category}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 block">Custody / Holding Point</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {report.storageLocation || 'Campus Security Main Office'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Match Spotlight (if present) */}
          {match && (
            <div className="p-5 bg-gradient-to-br from-indigo-50 via-amber-50/50 to-white rounded-2xl border-2 border-indigo-200 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-indigo-950">
                    Administrator Connected Match
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {match.connectionType === 'MANUAL' ? 'Manual Link' : 'Auto Suggested'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Matching Found Item:</span>
                  <span className="font-bold text-slate-900">{match.foundItemTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Found Location:</span>
                  <span className="font-semibold text-slate-800">{match.foundItemLocation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Collection Desk:</span>
                  <span className="font-bold text-indigo-700">
                    {match.collectionPoint || 'Main Campus Security Desk'}
                  </span>
                </div>
                {match.instructions && (
                  <div className="pt-2 border-t border-slate-100 text-emerald-800 font-medium">
                    Pickup Instructions: &ldquo;{match.instructions}&rdquo;
                  </div>
                )}
                {match.adminNote && (
                  <div className="pt-1 text-slate-600 italic">
                    Note: &ldquo;{match.adminNote}&rdquo;
                  </div>
                )}
              </div>

              {match.returnStatus === 'CONFIRMED' ? (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Handover officially completed &amp; item received.</span>
                </div>
              ) : match.returnStatus === 'ARRANGED' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Pickup Arranged with Campus Safety
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Please visit <strong>{match.collectionPoint || 'Campus Security Desk'}</strong> with your Student ID card to claim your item.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Security is preparing handover arrangements. You will receive an alert once ready for pickup.</span>
                </div>
              )}
            </div>
          )}

          {/* Pending Verification Inquiry Link (if present) */}
          {report.hasPendingVerification && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-purple-600 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-purple-950">Verification Questions Pending</h5>
                  <p className="text-[11px] text-purple-700">Security requested proof-of-ownership details for this report.</p>
                </div>
              </div>
              <Link
                href="/dashboard/verification"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                Answer Now
              </Link>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
