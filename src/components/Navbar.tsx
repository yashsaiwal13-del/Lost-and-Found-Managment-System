'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Shield, Menu, X, PlusCircle, AlertCircle, Compass, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link href="/browse" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              Browse Registry
            </Link>
            <a href="/#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="/#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <Link href="/admin" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              Security Desk
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Student Portal
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
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

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
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
          <nav className="flex flex-col space-y-3 pt-2 text-base font-medium text-slate-700">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Student Portal / Dashboard
            </Link>
            <Link
              href="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Search className="h-4 w-4 text-indigo-600" />
              Browse Registry
            </Link>
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              How It Works
            </a>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Features
            </a>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-emerald-600" />
              Security Desk
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 text-indigo-600 font-semibold flex items-center gap-2"
            >
              Sign In / Register
            </Link>
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
