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
  Search,
  RefreshCw,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { StudentReport, ItemStatus } from '@/types';
import { getStudentReports } from '@/app/actions/getStudentReports';
import ReportDetailsModal from '@/components/dashboard/ReportDetailsModal';

interface RecentReportsProps {
  filterType?: 'all' | 'lost' | 'found' | 'matches' | 'claims';
}

export default function RecentReports({ filterType = 'all' }: RecentReportsProps) {
  const [activeFilter, setActiveFilter] = useState<string>(filterType);
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
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

  // Filter & Search student reports
  const filteredReports = reports.filter((report) => {
    // 1. Tab filter
    if (activeFilter === 'lost' && report.type !== 'lost') return false;
    if (activeFilter === 'found' && report.type !== 'found') return false;
    if (activeFilter === 'matches' && report.matchesCount === 0) return false;
    if (activeFilter === 'claims' && report.status !== 'pending_verification' && !report.hasPendingVerification) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = report.title.toLowerCase().includes(q);
      const matchDesc = report.description.toLowerCase().includes(q);
      const matchLoc = report.location.toLowerCase().includes(q);
      const matchCat = report.category.toLowerCase().includes(q);
      const matchId = report.id.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat && !matchId) {
        return false;
      }
    }

    return true;
  });

  const handleOpenDetails = (report: StudentReport) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
            <Clock className="h-3 w-3 text-amber-500" />
            Verification In Progress
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
            Active / In Search
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Header with Filters & Search */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                My Reports &amp; Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track lost belongings, turned-in items, similarity matches, and custody verification.
              </p>
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 self-start sm:self-auto p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              title="Refresh reports"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, location, category, or ID..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({reports.length})
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
              <button
                onClick={() => setActiveFilter('claims')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeFilter === 'claims'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Verification ({reports.filter((r) => r.status === 'pending_verification' || r.hasPendingVerification).length})
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center space-y-3">
            <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading your registered reports...</p>
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
              Retry
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
              {searchQuery
                ? `No reports match "${searchQuery}". Try a different keyword.`
                : activeFilter === 'all'
                ? 'You have not submitted any lost or found reports yet.'
                : `No ${activeFilter} reports found.`}
            </p>
          </div>
        )}

        {/* Reports List */}
        {!loading && !error && filteredReports.length > 0 && (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => {
              const isLost = report.type === 'lost';
              const match = report.connectedMatch;

              return (
                <div
                  key={report.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                  onClick={() => handleOpenDetails(report)}
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
                      {match ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          Match Connected ({Math.round(match.similarityScore * 100)}%)
                        </span>
                      ) : report.matchesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          {report.matchesCount} Potential Match
                        </span>
                      ) : null}

                      {/* Pending Verification Inquiries Badge */}
                      {report.hasPendingVerification && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full">
                          <HelpCircle className="h-3 w-3 text-purple-600" />
                          Questions Pending
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(report);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        match
                          ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                          : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {match ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                          <span>View Match &amp; Pickup</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View Details</span>
                        </>
                      )}
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Interactive Report Details Modal */}
      <ReportDetailsModal
        report={selectedReport}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
        }}
      />
    </>
  );
}

