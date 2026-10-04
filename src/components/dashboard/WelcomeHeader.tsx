'use client';

import React from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  PlusCircle, 
  Menu, 
  Sparkles, 
  Bell, 
  Shield 
} from 'lucide-react';

interface WelcomeHeaderProps {
  userName?: string | null;
  studentId?: string | null;
  onOpenSidebar: () => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
}

export default function WelcomeHeader({ 
  userName, 
  studentId,
  onOpenSidebar, 
  onOpenReportModal 
}: WelcomeHeaderProps) {
  const displayName = userName || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Top bar with mobile hamburger and quick alerts */}
        <div className="flex items-center justify-between gap-4 lg:hidden mb-4 pb-4 border-b border-slate-100">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              CampusFind Portal
            </span>
          </div>

          <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {initial}
          </div>
        </div>

        {/* Desktop / Responsive Main Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Welcome Message */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Student Account Verified
              </span>
              {studentId && (
                <>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    ID: {studentId}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {displayName}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track your reported belongings, check live status updates, and manage ownership claims in real time.
            </p>
          </div>

          {/* Core Action Buttons */}
          <div className="flex items-center gap-3 pt-2 md:pt-0">
            
            {/* Report Lost Item Button */}
            <Link
              href="/report-lost"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-95 transition-all"
            >
              <AlertCircle className="h-4 w-4" />
              Report Lost Item
            </Link>

            {/* Report Found Item Button */}
            <Link
              href="/report-found"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Report Found Item
            </Link>

          </div>

        </div>

      </div>
    </header>
  );
}
