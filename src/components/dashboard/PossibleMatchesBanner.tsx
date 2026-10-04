'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Package, 
  Info, 
  CheckCircle2, 
  Calendar, 
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { getMyMatchedItems, StudentMatchedItem } from '@/app/actions/matching';

export default function PossibleMatchesBanner() {
  const [matchedItems, setMatchedItems] = useState<StudentMatchedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMyMatchedItems()
      .then((items) => {
        if (isMounted) {
          setMatchedItems(items || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching matched items for student:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
        Checking for administrator-connected matches...
      </div>
    );
  }

  // If no confirmed matches exist for this student's lost items, render nothing or empty state
  if (matchedItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50/90 via-amber-50/70 to-emerald-50/80 border-2 border-indigo-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900">
                Connected Lost &amp; Found Item {matchedItems.length === 1 ? 'Match' : 'Matches'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {matchedItems.length} Connected
              </span>
            </div>
            <p className="text-xs font-medium text-amber-800 flex items-center gap-1 mt-0.5">
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              Admin-linked potential match — not yet confirmed as yours
            </p>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {matchedItems.map((match) => {
          const isArranged = match.returnDetails?.status === 'ARRANGED';
          const isConfirmedReturn = match.returnDetails?.status === 'CONFIRMED';
          const matchPct = Math.round(match.similarityScore * 100);

          return (
            <div
              key={match.id}
              className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                
                {/* Match Badges Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                      <Sparkles className="h-3 w-3 text-indigo-600" />
                      {matchPct}% Match Score
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {match.connectionType === 'MANUAL' ? 'Manually connected' : 'Algorithmic suggestion'}
                    </span>
                  </div>

                  {/* Return Lifecycle Status Badge */}
                  {isConfirmedReturn ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Handover Complete
                    </span>
                  ) : isArranged ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      Collection Arranged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock className="h-3 w-3 text-amber-600" />
                      Awaiting Handover Setup
                    </span>
                  )}
                </div>

                {/* Found Item Details Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-start gap-3">
                    {match.foundItem.image ? (
                      <img
                        src={match.foundItem.image}
                        alt={match.foundItem.title}
                        className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Found Item In Custody
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {match.foundItem.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {match.foundItem.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block font-medium">Category:</span>
                      <span className="font-semibold text-slate-800">{match.foundItem.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Reported Location:</span>
                      <span className="font-semibold text-slate-800 truncate block">{match.foundItem.reportedLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Date Found:</span>
                      <span className="font-semibold text-slate-800">{new Date(match.foundItem.reportedDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Collection Point:</span>
                      <span className="font-semibold text-indigo-700 truncate block">
                        {match.foundItem.collectionPoint || 'Main Campus Security Desk'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connected Lost Report Reference */}
                <div className="text-[11px] text-slate-500 bg-amber-50/60 rounded-xl px-3 py-2 border border-amber-200/60 flex items-center justify-between">
                  <span>Linked to your lost report: <strong>"{match.lostItem.name}"</strong></span>
                  <span className="font-mono text-slate-400">#{match.lostItem.id}</span>
                </div>

                {/* Optional Admin Note */}
                {match.adminNote && (
                  <p className="text-xs text-slate-600 bg-slate-100 rounded-xl p-2.5 italic border border-slate-200">
                    <strong>Admin Note:</strong> &ldquo;{match.adminNote}&rdquo;
                  </p>
                )}

              </div>

              {/* Action / Next Steps Footer */}
              <div className="pt-3 border-t border-slate-100 text-xs">
                {isArranged && match.returnDetails ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Collection Arranged with Campus Safety
                    </div>
                    {match.returnDetails.arrangedAt && (
                      <p className="text-[11px] text-emerald-800">
                        Scheduled on: {new Date(match.returnDetails.arrangedAt).toLocaleDateString()}
                      </p>
                    )}
                    {match.returnDetails.instructions && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Instructions: {match.returnDetails.instructions}
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-800 pt-1">
                      Please bring your Student ID to <strong>{match.foundItem.collectionPoint || 'Main Campus Security Desk'}</strong> to verify and collect your item.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-2 text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Awaiting collection arrangement</span>
                      <span className="text-[11px] text-slate-500">
                        Campus security is reviewing and preparing collection handover details. You will receive an alert once pickup is ready.
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
