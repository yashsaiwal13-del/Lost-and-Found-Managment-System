'use client';

import React, { useState, useEffect } from 'react';
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
  LogOut,
  Users,
  Building2,
  FileCheck,
  Search,
  PackageCheck
} from 'lucide-react';
import { STUDENT_PROFILE, OFFICER_PROFILE } from '@/lib/constants';
import { getCurrentUser, logoutUser } from '@/app/actions/auth';

interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'STUDENT' | 'SECURITY' | 'ADMIN';
}

export default function Sidebar({ currentTab = 'overview', onTabChange, isOpen, onClose, userRole }: SidebarProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  const role = userRole || currentUser?.role || 'STUDENT';
  const displayName = currentUser?.name || (role === 'SECURITY' ? OFFICER_PROFILE.name : STUDENT_PROFILE.name);
  const displayId = currentUser?.studentId || (role === 'SECURITY' ? OFFICER_PROFILE.badgeNumber : STUDENT_PROFILE.studentId);

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    href?: string;
    badge?: string;
    highlightBadge?: boolean;
  }

  const getNavItems = (): NavItem[] => {
    if (role === 'ADMIN') {
      return [
        { id: 'admin-overview', label: 'Admin Operations', icon: LayoutDashboard, href: '/admin' },
        { id: 'admin-items', label: 'All Campus Items', icon: Search, href: '/admin#items' },
        { id: 'admin-claims', label: 'Claims Verification', icon: ShieldCheck, href: '/security' },
        { id: 'admin-users', label: 'User Directory', icon: Users, href: '/admin#users' },
        { id: 'admin-browse', label: 'Public Registry', icon: Compass, href: '/browse' },
      ];
    }

    if (role === 'SECURITY') {
      return [
        { id: 'sec-overview', label: 'Campus Safety Desk', icon: ShieldCheck, href: '/security' },
        { id: 'sec-claims', label: 'Claims Review Queue', icon: FileCheck, href: '/security#claims' },
        { id: 'sec-custody', label: 'Custody Locker', icon: Building2, href: '/security#locker' },
        { id: 'sec-log-found', label: 'Log Found Item', icon: PlusCircle, href: '/report-found' },
        { id: 'sec-browse', label: 'Public Registry', icon: Compass, href: '/browse' },
      ];
    }

    // Default STUDENT role
    return [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'verification', label: 'Verification Questions', icon: HelpCircle, href: '/dashboard/verification' },
      { id: 'collected', label: 'Collected Items', icon: PackageCheck, href: '/dashboard/collected' },
      { id: 'lost', label: 'My Lost Reports', icon: AlertCircle },
      { id: 'found', label: 'My Found Reports', icon: PlusCircle },
      { id: 'matches', label: 'Possible Matches', icon: Sparkles },
      { id: 'claims', label: 'Pending Claims', icon: ShieldCheck },
    ];
  };

  const navItems = getNavItems();

  const getPortalTitle = () => {
    if (role === 'ADMIN') return 'Admin Portal';
    if (role === 'SECURITY') return 'Campus Safety';
    return 'Student Portal';
  };

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
                  {getPortalTitle()}
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

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onClose}
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
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onTabChange) onTabChange(item.id);
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

        {/* Bottom Section: Profile & Homepage Backlink */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          
          {/* Back to Homepage Link */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
            <span>Return to Public Homepage</span>
          </Link>

          {/* User Profile Card */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                role === 'ADMIN' ? 'bg-purple-600' : role === 'SECURITY' ? 'bg-blue-600' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'
              }`}>
                {displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate">
                  {role} • <span className="text-slate-400 font-mono font-normal">{displayId}</span>
                </div>
              </div>
            </div>

            <button
              title="Sign Out"
              onClick={async () => {
                try {
                  await logoutUser();
                } catch {
                  window.location.href = '/login';
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
