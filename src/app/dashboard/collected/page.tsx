'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PackageCheck, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  Tag, 
  RefreshCw, 
  Package, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getMyCollectedItems, CollectedItemEntry } from '@/app/actions/matching';

export default function CollectedItemsPage() {
  const [collectedItems, setCollectedItems] = useState<CollectedItemEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollectedItems = async () => {
    setLoading(true);
    try {
      const items = await getMyCollectedItems();
      setCollectedItems(items || []);
    } catch (err) {
      console.error('Error fetching collected items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectedItems();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Student Portal
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  My Collected Items
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Official history of lost items returned to your custody with verified security handovers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCollectedItems}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900">
            <strong>Verified Custody Handover Log:</strong> Items appear on this page only after physical handover has been officially confirmed by campus security personnel.
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading your verified collected items...</p>
          </div>
        ) : collectedItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <PackageCheck className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Collected Items Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You currently have no lost items with completed handovers. When a matched item has its handover confirmed by security, it will be permanently cataloged here.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {collectedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  
                  {/* Status Badge & Handover Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Handover Confirmed
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Collected {new Date(item.confirmedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Item Image & Title */}
                  <div className="flex items-start gap-3.5">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-16 w-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="h-7 w-7" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Report IDs Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Lost Report ID:</span>
                      <span className="font-mono text-slate-800 font-bold truncate block">#{item.lostItemId}</span>
                      <span className="text-[11px] text-slate-500 truncate block">📍 {item.lostLocation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Found Report ID:</span>
                      <span className="font-mono text-slate-800 font-bold truncate block">#{item.foundItemId}</span>
                      <span className="text-[11px] text-slate-500 truncate block">📍 {item.foundLocation}</span>
                    </div>
                  </div>

                  {/* Handover Details */}
                  <div className="text-[11px] text-slate-500 space-y-1">
                    {item.confirmedBy?.name && (
                      <div>
                        Handover verified by: <strong className="text-slate-700">{item.confirmedBy.name}</strong>
                      </div>
                    )}
                    {item.notes && (
                      <div className="bg-slate-100/70 p-2 rounded-lg text-slate-600 italic">
                        Notes: "{item.notes}"
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Custody Transferred to You
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
