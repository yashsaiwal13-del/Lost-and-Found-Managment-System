'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { STUDENT_MATCHES } from '@/data/mockData';

export default function PossibleMatchesBanner() {
  const [claimedMatch, setClaimedMatch] = useState<string | null>(null);
  const match = STUDENT_MATCHES[0]; // Top match: AirPods Pro

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-emerald-500/10 border border-amber-300/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Info */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Potential Match Detected ({match.similarityScore}% Match)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Ref: {match.foundItem.id}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            A found item matches your lost report: &quot;{match.studentReportTitle}&quot;
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {match.matchReason}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-slate-800">{match.foundItem.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-700">{match.foundItem.storageLocation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Reported {match.foundItem.date}</span>
            </div>
          </div>
        </div>

        {/* Right: Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {claimedMatch === match.id ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Claim Submitted to Security
            </div>
          ) : (
            <button
              onClick={() => {
                setClaimedMatch(match.id);
                setTimeout(() => setClaimedMatch(null), 3000);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 active:scale-95 transition-all"
            >
              Verify &amp; File Claim
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
