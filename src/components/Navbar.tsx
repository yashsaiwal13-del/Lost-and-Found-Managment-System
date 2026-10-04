'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Shield, 
  Menu, 
  X, 
  PlusCircle, 
  AlertCircle, 
  Compass, 
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { getCurrentUser, logoutUser } from '@/app/actions/auth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
          setLoadingUser(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingUser(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {
      window.location.href = '/login';
    }
  };

  const role = currentUser?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                  Campus<span className="text-indigo-600">Find</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400 block -mt-1">
                  Campus Safety Network
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {(role === 'ADMIN' || role === 'SECURITY') && (
              <Link href="/browse" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Search className="h-4 w-4" />
                Browse Registry
              </Link>
            )}
            <a href="/#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            
            {/* Contextual Link based on role */}
            {role === 'ADMIN' || role === 'SECURITY' ? (
              <Link href="/admin" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-purple-600" />
                Admin Console
              </Link>
            ) : null}

            {currentUser && role === 'STUDENT' ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Student Portal
              </Link>
            ) : null}

            {/* Profile Dropdown / Login Link */}
            {!loadingUser && (
              <>
                {currentUser ? (
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                    >
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                        role === 'ADMIN' ? 'bg-purple-600' : role === 'SECURITY' ? 'bg-blue-600' : 'bg-indigo-600'
                      }`}>
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="max-w-[120px] truncate">{currentUser.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                        {role}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        </div>

                        {role === 'STUDENT' && (
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                            My Reports &amp; Claims
                          </Link>
                        )}

                        {(role === 'ADMIN' || role === 'SECURITY') && (
                          <>
                            <Link
                              href="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Shield className="h-4 w-4 text-purple-600" />
                              Administrator Console
                            </Link>
                            <Link
                              href="/admin/matches"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Compass className="h-4 w-4 text-indigo-600" />
                              Match &amp; Return
                            </Link>
                            <Link
                              href="/admin/settings"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Settings className="h-4 w-4 text-slate-500" />
                              Admin Settings
                            </Link>
                          </>
                        )}

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100 mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Action CTAs & Notifications (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/report-lost"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-all active:scale-95"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Report Lost
            </Link>
            <Link
              href="/report-found"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Report Found
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          
          {/* User badge on mobile */}
          {currentUser && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  role === 'ADMIN' ? 'bg-purple-600' : 'bg-indigo-600'
                }`}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 bg-white rounded-lg border border-slate-200"
              >
                Sign Out
              </button>
            </div>
          )}

          <nav className="flex flex-col space-y-2 pt-1 text-base font-medium text-slate-700">
            {role === 'STUDENT' && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-2 text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                Student Portal / Dashboard
              </Link>
            )}

            {role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold flex items-center gap-2 text-sm"
              >
                <Shield className="h-4 w-4" />
                Administrator Console
              </Link>
            )}

            {(role === 'ADMIN' || role === 'SECURITY') && (
              <Link
                href="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
              >
                <Search className="h-4 w-4 text-indigo-600" />
                Browse Registry
              </Link>
            )}
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
            >
              How It Works
            </a>

            {!currentUser && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold flex items-center gap-2 text-sm text-center justify-center"
              >
                Sign In
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <Link
              href="/report-lost"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg text-center"
            >
              <AlertCircle className="h-4 w-4" />
              Report Lost
            </Link>
            <Link
              href="/report-found"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg text-center"
            >
              <PlusCircle className="h-4 w-4" />
              Report Found
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
