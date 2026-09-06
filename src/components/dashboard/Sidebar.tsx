'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Compass, 
  LayoutDashboard, 
  AlertCircle, 
  PlusCircle, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ArrowLeft,
  X,
  LogOut
} from 'lucide-react';
import { STUDENT_PROFILE, STUDENT_STATS } from '@/data/mockData';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'lost', label: 'My Lost Reports', icon: AlertCircle, badge: `${STUDENT_STATS.lostCount}` },
    { id: 'found', label: 'My Found Reports', icon: PlusCircle, badge: `${STUDENT_STATS.foundCount}` },
    { id: 'matches', label: 'Possible Matches', icon: Sparkles, badge: `${STUDENT_STATS.possibleMatches}`, highlightBadge: true },
    { id: 'claims', label: 'Pending Claims', icon: ShieldCheck, badge: `${STUDENT_STATS.pendingClaims}` },
    { id: 'help', label: 'Campus Help & Desks', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding & Close Button */}
        <div>
          <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                  Campus<span className="text-indigo-400">Find</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block -mt-1">
                  Student Portal
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-3">
              Dashboard Menu
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.highlightBadge
                            ? 'bg-amber-400 text-slate-950 font-extrabold'
                            : isActive
                            ? 'bg-indigo-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Student Profile & Homepage Backlink */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          
          {/* Back to Homepage Link */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
            <span>Return to Public Homepage</span>
          </Link>

          {/* Student Profile Card */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {STUDENT_PROFILE.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {STUDENT_PROFILE.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {STUDENT_PROFILE.studentId}
                </div>
              </div>
            </div>

            <button
              title="Sign Out (Mock)"
              onClick={() => alert("Logged in as mock student: Maya Lin")}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
