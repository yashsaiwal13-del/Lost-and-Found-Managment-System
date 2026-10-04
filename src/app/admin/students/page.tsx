'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
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
  Trash2,
  Eye,
  KeyRound,
  Mail,
  User as UserIcon,
  ShieldAlert,
  MapPin,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  getAdminStudents, 
  getStudentAccountDetails, 
  deleteStudentAccount, 
  AdminStudentRecord, 
  StudentAccountDetails 
} from '@/app/actions/adminStudents';
import { getCurrentUser } from '@/app/actions/auth';

export default function AdminStudentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<AdminStudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Modal States
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentAccountDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete Student Modal
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<AdminStudentRecord | StudentAccountDetails | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const loadStudents = async (page = currentPage, query = searchQuery, filter = activeFilter) => {
    setLoading(true);
    setError(null);
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
    } catch (err: any) {
      console.error('Failed to load students:', err);
      setError(err?.message || 'Failed to load students.');
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

  // View Student Details
  const handleInspectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingDetails(true);
    try {
      const details = await getStudentAccountDetails(studentId);
      setStudentDetails(details);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch student details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!deleteTargetStudent) return;
    setDeletePending(true);
    try {
      const res = await deleteStudentAccount(deleteTargetStudent.id);
      if (res.success) {
        setSuccessMsg(`Student account "${deleteTargetStudent.name}" (${deleteTargetStudent.email}) successfully deleted.`);
        setDeleteTargetStudent(null);
        if (selectedStudentId === deleteTargetStudent.id) {
          setSelectedStudentId(null);
          setStudentDetails(null);
        }
        loadStudents(currentPage, searchQuery, activeFilter);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(res.error || 'Failed to delete student account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete student account.');
    } finally {
      setDeletePending(false);
    }
  };

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
    <div className="space-y-6">
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <span className="match-kicker">Campus Member Registry</span>
          <h1>Student Directory &amp; Accounts</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
            Review registered student accounts, inspect credential security, monitor report history, and manage accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="verified">
            <ShieldCheck className="h-4 w-4" />
            <span>Active Campus Directory</span>
          </div>

          <button
            onClick={() => loadStudents(currentPage, searchQuery, activeFilter)}
            disabled={loading}
            className="button button-ghost"
            style={{ minHeight: '36px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Directory"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {/* 3 Metric Cards - Warm Figma Make Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Total Registered Students</span>
            <div className="h-8 w-8 rounded-xl bg-[var(--paper)] text-[var(--navy)] flex items-center justify-center font-bold">
              <Users className="h-4 w-4 text-amber-800" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--navy)] tracking-tight">{metrics.totalStudents}</div>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Campus member accounts in PostgreSQL</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active in Last 7 Days</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 tracking-tight">{metrics.activeInLast7Days}</div>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Logged in within the past 7 days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Never Logged In</span>
            <div className="h-8 w-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-700 tracking-tight">{metrics.neverLoggedIn}</div>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Accounts pending initial session</p>
        </div>
      </div>

      {/* Directory Controls & Table */}
      <section className="bg-white rounded-2xl border border-[var(--line)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--line)] space-y-4">
          
          {/* Search & Filter row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by student name, email, or campus ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2 text-xs bg-[var(--paper)]/50 border border-[var(--line)] rounded-xl focus:outline-none focus:border-[var(--navy)] text-[var(--navy)]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-[var(--navy)] hover:opacity-90 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-[var(--paper)] rounded-xl text-xs font-bold border border-[var(--line)] overflow-x-auto">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-[var(--navy)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                All ({metrics.totalStudents})
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'active'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                Active 7d ({metrics.activeInLast7Days})
              </button>
              <button
                onClick={() => handleFilterChange('never_logged_in')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'never_logged_in'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--navy)]'
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
            <thead className="bg-[var(--paper)] border-b border-[var(--line)] text-[var(--ink)] uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Student Account</th>
                <th className="px-5 py-3">Campus ID</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Registered Date</th>
                <th className="px-5 py-3">Last Login</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]/50 text-[var(--navy)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-700" />
                    Loading campus student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40 text-stone-400" />
                    <p className="font-semibold text-sm">No student records found.</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Try adjusting your search query or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                    {/* Name & ID */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-[var(--paper)] border border-[var(--line)] text-[var(--navy)] font-black flex items-center justify-center text-xs">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-[var(--navy)] block">{st.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">ID: {st.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Campus Student ID */}
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-900">
                      {st.studentId || <span className="text-stone-400 font-normal italic">Unassigned</span>}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-stone-700 font-medium">
                      {st.email}
                    </td>

                    {/* Registered Date */}
                    <td className="px-5 py-3.5 text-[var(--muted)] font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {new Date(st.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Last Login Activity */}
                    <td className="px-5 py-3.5">
                      {st.lastLoginAt ? (
                        <div className="space-y-0.5">
                          <div>
                            {st.isActiveLast7Days ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active 7d
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] font-mono">
                            {new Date(st.lastLoginAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Never</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleInspectStudent(st.id)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--paper)] hover:bg-[var(--canvas)] border border-[var(--line)] text-xs font-bold text-[var(--navy)] transition inline-flex items-center gap-1"
                          title="View Student Details & Password Status"
                        >
                          <Eye className="h-3 w-3" /> Details
                        </button>
                        <button
                          onClick={() => setDeleteTargetStudent(st)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 transition"
                          title="Delete Student Account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
          <div className="p-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <div>
              Showing page <span className="font-bold text-[var(--navy)]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[var(--navy)]">{pagination.totalPages}</span> ({pagination.totalCount} total students)
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-[var(--line)] text-[var(--navy)] hover:bg-[var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-[var(--navy)] bg-[var(--paper)] border border-[var(--line)] rounded-xl">
                {currentPage}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-[var(--line)] text-[var(--navy)] hover:bg-[var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </section>

      {/* ----------------- MODAL 1: VIEW STUDENT DETAILS & PASS CREDENTIALS ----------------- */}
      {selectedStudentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[var(--line)] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-[var(--navy)] text-base">Student Account Details</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedStudentId(null);
                  setStudentDetails(null);
                }}
                className="text-stone-400 hover:text-[var(--navy)] text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-[var(--muted)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
                <span>Loading student account profile and credentials...</span>
              </div>
            ) : !studentDetails ? (
              <div className="py-8 text-center text-rose-600 font-semibold">
                Student account not found or was deleted.
              </div>
            ) : (
              <div className="space-y-4 text-xs text-[var(--navy)]">
                {/* Account Profile Header */}
                <div className="p-4 bg-[var(--paper)] rounded-2xl border border-[var(--line)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center text-base font-black text-[var(--navy)] shadow-xs">
                      {studentDetails.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--navy)]">{studentDetails.name}</h4>
                      <p className="text-stone-600 font-medium">{studentDetails.email}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--navy)] text-white">
                        {studentDetails.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] space-y-1">
                    <div>
                      <span className="text-[var(--muted)]">Campus ID: </span>
                      <span className="font-mono font-bold text-amber-900">{studentDetails.studentId || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)]">Registered: </span>
                      <span className="font-medium">{new Date(studentDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Credentials & Password Security Card */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>Credentials &amp; Security Overview</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Password Security Status</span>
                      <span className="font-mono text-xs font-bold text-stone-800">
                        {studentDetails.passwordPreview}
                      </span>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {studentDetails.hasPassword ? 'Encrypted via BCrypt 12-rounds' : 'Account uses Single Sign-On / OAuth'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Last Authentication</span>
                      <span className="text-xs font-bold text-stone-800">
                        {studentDetails.lastLoginAt ? new Date(studentDetails.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </span>
                      <p className="text-[10px] text-stone-500 mt-0.5">Database session verification</p>
                    </div>
                  </div>
                </div>

                {/* Activity Summary Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[var(--paper)] rounded-xl border border-[var(--line)] text-center">
                    <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Reports Filed</span>
                    <span className="text-base font-black text-[var(--navy)]">{studentDetails.reportedItems.length}</span>
                  </div>
                  <div className="p-3 bg-[var(--paper)] rounded-xl border border-[var(--line)] text-center">
                    <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Claims Submitted</span>
                    <span className="text-base font-black text-[var(--navy)]">{studentDetails.claims.length}</span>
                  </div>
                  <div className="p-3 bg-[var(--paper)] rounded-xl border border-[var(--line)] text-center">
                    <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Inquiries Received</span>
                    <span className="text-base font-black text-[var(--navy)]">{studentDetails.verificationRequests.length}</span>
                  </div>
                </div>

                {/* Student's Reported Items List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--navy)] block">
                    Reported Items History ({studentDetails.reportedItems.length}):
                  </span>
                  {studentDetails.reportedItems.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] italic p-2.5 bg-stone-50 rounded-xl">
                      This student has not filed any lost or found reports.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {studentDetails.reportedItems.map((item) => (
                        <div key={item.id} className="p-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`type-badge ${item.type.toLowerCase()}`}>
                              {item.type}
                            </span>
                            <span className="font-bold text-stone-900">{item.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">#{item.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-[var(--muted)]">{item.location}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-stone-200">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
                  <button
                    onClick={() => {
                      setDeleteTargetStudent(studentDetails);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Student Account
                  </button>

                  <button
                    onClick={() => {
                      setSelectedStudentId(null);
                      setStudentDetails(null);
                    }}
                    className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: DELETE STUDENT ACCOUNT CONFIRMATION MODAL ----------------- */}
      {deleteTargetStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--navy)] text-base">Delete Student Account</h3>
                <p className="text-xs text-[var(--muted)]">Permanently delete account from campus database</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-bold">Student: {deleteTargetStudent.name} ({deleteTargetStudent.email})</p>
              <p className="text-[11px] text-rose-700">
                Warning: Deleting this student will cascade-delete their filed reports, claims, and inquiries. An immutable security audit log entry will record this deletion.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setDeleteTargetStudent(null)}
                disabled={deletePending}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={deletePending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
              >
                {deletePending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Account Deletion
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

