'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Filter,
  Layers,
  Settings
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getAdminStudents, AdminStudentRecord } from '@/app/actions/adminStudents';
import { getCurrentUser } from '@/app/actions/auth';

export default function AdminStudentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<AdminStudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'never_logged_in'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeInLast7Days: 0,
    neverLoggedIn: 0,
  });

  const loadStudents = async (page = currentPage, query = searchQuery, filter = activeFilter) => {
    setLoading(true);
    try {
      const res = await getAdminStudents({
        search: query,
        page: page,
        limit: pageSize,
        filter: filter,
      });

      if (res) {
        setStudents(res.students);
        setPagination(res.pagination);
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
    loadStudents(1, searchQuery, activeFilter);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadStudents(1, searchQuery, activeFilter);
  };

  const handleFilterChange = (newFilter: 'all' | 'active' | 'inactive' | 'never_logged_in') => {
    setActiveFilter(newFilter);
    setCurrentPage(1);
    loadStudents(1, searchQuery, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setCurrentPage(newPage);
    loadStudents(newPage, searchQuery, activeFilter);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 shrink-0 border border-purple-400/30">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                    Administrator Directory
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Database
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  Campus Student Accounts &amp; Activity
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search registered campus members, monitor 7-day login activity, and inspect report counts.
                </p>
              </div>
            </div>

            {/* Nav & Quick Actions */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <Layers className="h-4 w-4 text-purple-400" />
                Admin Dashboard
              </Link>
              <Link
                href="/admin/verification"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <HelpCircle className="h-4 w-4 text-purple-400" />
                Verification Center
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <Settings className="h-4 w-4 text-purple-400" />
                Settings
              </Link>
              <button
                onClick={() => loadStudents(currentPage, searchQuery, activeFilter)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered Students</span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{metrics.totalStudents}</div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Role: STUDENT in PostgreSQL</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Active in Last 7 Days</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{metrics.activeInLast7Days}</div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Logged in within the past 7 days</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Never Logged In</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-600 tracking-tight">{metrics.neverLoggedIn}</div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Accounts pending first sign in</p>
          </div>
        </div>

        {/* Directory Controls & Table */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 space-y-4">
            
            {/* Search & Filter row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or campus ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Filter Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({metrics.totalStudents})
                </button>
                <button
                  onClick={() => handleFilterChange('active')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active 7d ({metrics.activeInLast7Days})
                </button>
                <button
                  onClick={() => handleFilterChange('never_logged_in')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeFilter === 'never_logged_in'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Never Logged In ({metrics.neverLoggedIn})
                </button>
              </div>

            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Student Account</th>
                  <th className="px-6 py-3.5">Campus Student ID</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5">Last Login Activity</th>
                  <th className="px-6 py-3.5 text-right">Activity &amp; Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                      Loading student records from PostgreSQL...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-50 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No student records found.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try adjusting your search query or active filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-xs">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{st.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {st.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {st.studentId || <span className="text-slate-400 font-normal italic">Unassigned</span>}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {st.email}
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(st.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Last Login Activity */}
                      <td className="px-6 py-4">
                        {st.lastLoginAt ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {st.isActiveLast7Days ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active (7d)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {new Date(st.lastLoginAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Never logged in</span>
                        )}
                      </td>

                      {/* Activity & Reports */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            <FileText className="h-3 w-3 text-slate-500" />
                            {st.reportsCount} {st.reportsCount === 1 ? 'Report' : 'Reports'}
                          </span>
                          {st.inquiriesCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                              <HelpCircle className="h-3 w-3 text-purple-500" />
                              {st.inquiriesCount} Inq
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.totalCount} total students)
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="px-3 py-1.5 font-bold text-purple-700 bg-purple-50 rounded-xl">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </section>

      </main>

      <Footer />
    </div>
  );
}
