'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import { StudentReport, ItemStatus } from '@/types';
import { STUDENT_REPORTS } from '@/data/mockData';
import { getStudentReports } from '@/app/actions/getStudentReports';

interface RecentReportsProps {
  filterType?: 'all' | 'lost' | 'found' | 'matches' | 'claims';
}

export default function RecentReports({ filterType = 'all' }: RecentReportsProps) {
  const [activeFilter, setActiveFilter] = useState<string>(filterType);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/user');
      if (res.ok) {
        const data = await res.json();
        if (data.reports) {
          const formatted: StudentReport[] = data.reports.map((item: any) => {
            let statusFormat = item.status?.toLowerCase();
            if (statusFormat === 'pending_claim') statusFormat = 'pending_verification';

            return {
              id: item.id,
              title: item.name,
              description: item.description,
              type: item.type?.toLowerCase() as any,
              category: item.category as any,
              location: item.location,
              dateReported: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              status: statusFormat as any,
              matchesCount: item.type === 'LOST' ? 1 : 0,
            };
          });
          setReports(formatted);
          setLoading(false);
          return;
        }
      }

      // Fallback to Server Action
      const actionData = await getStudentReports();
      setReports(actionData || []);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError('Could not connect to database to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter student reports
  const filteredReports = reports.filter((report) => {
    if (activeFilter === 'lost') return report.type === 'lost';
    if (activeFilter === 'found') return report.type === 'found';
    if (activeFilter === 'matches') return report.matchesCount > 0;
    if (activeFilter === 'claims') return report.status === 'pending_verification';
    return true;
  });

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
            <Clock className="h-3 w-3 text-amber-500" />
            Claim Pending Verification
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Resolved &amp; Reclaimed
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Active / Searching
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      
      {/* Header with Filters */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Recent Reports &amp; Activity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your reported lost belongings and items you turned in.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveFilter('lost')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'lost'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Lost ({reports.filter((r) => r.type === 'lost').length})
          </button>
          <button
            onClick={() => setActiveFilter('found')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'found'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Found ({reports.filter((r) => r.type === 'found').length})
          </button>
          <button
            onClick={() => setActiveFilter('matches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'matches'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Matches ({reports.filter((r) => r.matchesCount > 0).length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center space-y-3">
          <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Connecting to campus database &amp; loading reports...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 text-center bg-red-50/60 border-b border-red-100">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-red-800">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-3 px-4 py-1.5 text-xs font-bold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 shadow-2xs"
          >
            Retry Database Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredReports.length === 0 && (
        <div className="p-12 text-center">
          <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Reports Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeFilter === 'all'
              ? 'You have not submitted any lost or found reports yet. Reports you file will appear here.'
              : `No ${activeFilter} reports currently match this filter.`}
          </p>
        </div>
      )}

      {/* Reports List */}
      {!loading && !error && filteredReports.length > 0 && (
        <div className="divide-y divide-slate-100">
        {filteredReports.map((report) => {
          const isLost = report.type === 'lost';

          return (
            <div
              key={report.id}
              className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isLost
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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

                  {/* Status Badge */}
                  {getStatusBadge(report.status)}

                  {/* Matches Indicator */}
                  {report.matchesCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      {report.matchesCount} Potential Match
                    </span>
                  )}

                  <span className="text-[11px] font-mono text-slate-400">
                    #{report.id}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {report.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                  {report.description}
                </p>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{report.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reported {report.dateReported}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span>{report.category}</span>
                  </div>
                </div>
              </div>

              {/* Right CTA */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 shrink-0">
                {report.matchesCount > 0 ? (
                  <button
                    onClick={() => alert(`Reviewing matching item #${report.matchedItemId} for report ${report.id}. Stored securely at Campus Safety Desk.`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                    View Match
                  </button>
                ) : (
                  <button
                    onClick={() => alert(`Report details for #${report.id}: ${report.title}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs"
                  >
                    View Details
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
      )}

    </div>
  );
}
