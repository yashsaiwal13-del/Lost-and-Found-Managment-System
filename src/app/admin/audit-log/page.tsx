'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  GitCompare, 
  Eye, 
  KeyRound, 
  Mail, 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Users, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Package,
  Layers,
  Check,
  X
} from 'lucide-react';
import { getAllAdminItems, AdminCampusItem } from '@/app/actions/getAllItems';
import { getReportDetails, deleteReportPermanently, DetailedReportView } from '@/app/actions/moderation';
import { connectReportsManually } from '@/app/actions/matching';
import { 
  getAdminStudents, 
  getStudentAccountDetails, 
  deleteStudentAccount, 
  AdminStudentRecord, 
  StudentAccountDetails 
} from '@/app/actions/adminStudents';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';

export default function AdminRecordManagerPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'compare' | 'students'>('reports');
  const [fullImage, setFullImage] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Reports State
  const [items, setItems] = useState<AdminCampusItem[]>([]);
  const [reportSearch, setReportSearch] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [loadingReports, setLoadingReports] = useState(true);

  // Students State
  const [students, setStudents] = useState<AdminStudentRecord[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'active' | 'inactive' | 'never_logged_in'>('all');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPagination, setStudentPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [studentMetrics, setStudentMetrics] = useState({ totalStudents: 0, activeInLast7Days: 0, neverLoggedIn: 0 });
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Global Messages
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals: Report Details
  const [inspectReportId, setInspectReportId] = useState<string | null>(null);
  const [inspectedReport, setInspectedReport] = useState<DetailedReportView | null>(null);
  const [inspectReportLoading, setInspectReportLoading] = useState(false);

  // Modals: Delete Report
  const [deleteReportTarget, setDeleteReportTarget] = useState<AdminCampusItem | DetailedReportView | null>(null);
  const [deleteReportReason, setDeleteReportReason] = useState('');
  const [deleteReportPending, setDeleteReportPending] = useState(false);

  // Comparison Studio State
  const [compareId1, setCompareId1] = useState<string>('');
  const [compareId2, setCompareId2] = useState<string>('');
  const [report1Details, setReport1Details] = useState<DetailedReportView | null>(null);
  const [report2Details, setReport2Details] = useState<DetailedReportView | null>(null);
  const [connectingMatches, setConnectingMatches] = useState(false);

  // Modals: Student Details
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentAccountDetails | null>(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);

  // Modals: Delete Student
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<AdminStudentRecord | StudentAccountDetails | null>(null);
  const [deleteStudentPending, setDeleteStudentPending] = useState(false);

  // Load Reports
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await getAllAdminItems({ includeArchived: true });
      if (res) setItems(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports.');
    } finally {
      setLoadingReports(false);
    }
  };

  // Load Students
  const fetchStudents = async (page = studentPage, query = studentSearch, filter = studentFilter) => {
    setLoadingStudents(true);
    try {
      const res = await getAdminStudents({
        search: query,
        page: page,
        limit: 10,
        filter: filter,
      });
      if (res) {
        setStudents(res.students);
        setStudentPagination(res.pagination);
        setStudentMetrics(res.metrics);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStudents(1, studentSearch, studentFilter);
  }, []);

  // Inspect Report
  const handleInspectReport = async (reportId: string) => {
    setInspectReportId(reportId);
    setInspectReportLoading(true);
    try {
      const details = await getReportDetails(reportId);
      setInspectedReport(details);
    } catch (e: any) {
      setError(e?.message || 'Failed to load report details.');
    } finally {
      setInspectReportLoading(false);
    }
  };

  // Delete Report
  const handleDeleteReport = async () => {
    if (!deleteReportTarget) return;
    setDeleteReportPending(true);
    try {
      const res = await deleteReportPermanently(deleteReportTarget.id, deleteReportReason.trim() || 'Deleted by administrator');
      if (res.success) {
        setSuccessMsg(`Report #${deleteReportTarget.id.slice(0, 8)} was permanently deleted.`);
        setDeleteReportTarget(null);
        setDeleteReportReason('');
        if (inspectReportId === deleteReportTarget.id) {
          setInspectReportId(null);
          setInspectedReport(null);
        }
        fetchReports();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(res.error || 'Failed to delete report.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error deleting report.');
    } finally {
      setDeleteReportPending(false);
    }
  };

  // Comparison loading
  useEffect(() => {
    if (!compareId1) {
      setReport1Details(null);
      return;
    }
    getReportDetails(compareId1).then((res) => setReport1Details(res));
  }, [compareId1]);

  useEffect(() => {
    if (!compareId2) {
      setReport2Details(null);
      return;
    }
    getReportDetails(compareId2).then((res) => setReport2Details(res));
  }, [compareId2]);

  // Connect reports in Comparison Studio
  const handleConnectReports = async () => {
    if (!report1Details || !report2Details) return;
    const lostItem = report1Details.type === 'LOST' ? report1Details : report2Details.type === 'LOST' ? report2Details : null;
    const foundItem = report1Details.type === 'FOUND' ? report1Details : report2Details.type === 'FOUND' ? report2Details : null;

    if (!lostItem || !foundItem) {
      setError('To connect reports, select one LOST report and one FOUND report.');
      return;
    }

    setConnectingMatches(true);
    try {
      const res = await connectReportsManually(lostItem.id, foundItem.id, 'Manually connected in Record Manager Comparison Studio');
      if (res.success) {
        setSuccessMsg(`Successfully matched Lost #${lostItem.id.slice(0, 8)} with Found #${foundItem.id.slice(0, 8)}!`);
        fetchReports();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(res.error || 'Failed to connect reports.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting reports.');
    } finally {
      setConnectingMatches(false);
    }
  };

  // Inspect Student Details
  const handleInspectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingStudentDetails(true);
    try {
      const details = await getStudentAccountDetails(studentId);
      setStudentDetails(details);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch student details.');
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!deleteStudentTarget) return;
    setDeleteStudentPending(true);
    try {
      const res = await deleteStudentAccount(deleteStudentTarget.id);
      if (res.success) {
        setSuccessMsg(`Student account "${deleteStudentTarget.name}" was permanently deleted.`);
        setDeleteStudentTarget(null);
        if (selectedStudentId === deleteStudentTarget.id) {
          setSelectedStudentId(null);
          setStudentDetails(null);
        }
        fetchStudents(studentPage, studentSearch, studentFilter);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(res.error || 'Failed to delete student account.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete student account.');
    } finally {
      setDeleteStudentPending(false);
    }
  };

  // Filtered reports
  const filteredReports = items.filter((item) => {
    const matchesType = reportTypeFilter === 'ALL' || item.type === reportTypeFilter;
    const q = reportSearch.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.reportedByName.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const lostCount = items.filter((i) => i.type === 'LOST').length;
  const foundCount = items.filter((i) => i.type === 'FOUND').length;

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <span className="match-kicker">Administrative Studio</span>
          <h1>Record Manager</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
            View, delete, and compare campus reports, plus inspect student profiles, credentials, and accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchReports();
              fetchStudents();
            }}
            disabled={loadingReports || loadingStudents}
            className="button button-ghost"
            style={{ minHeight: '36px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh All Records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingReports || loadingStudents ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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

      {/* 3 Studio Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('reports')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'reports' ? 'bg-white border-[var(--navy)] shadow-md' : 'bg-white border-[var(--line)] hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Campus Reports</span>
            <div className="h-8 w-8 rounded-xl bg-[var(--paper)] text-[var(--navy)] flex items-center justify-center font-bold">
              <FileText className="h-4 w-4 text-amber-800" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--navy)]">{items.length}</div>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">{lostCount} Lost • {foundCount} Found Reports</p>
        </div>

        <div 
          onClick={() => setActiveTab('compare')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'compare' ? 'bg-white border-[var(--navy)] shadow-md' : 'bg-white border-[var(--line)] hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Comparison Studio</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold">
              <GitCompare className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950">2 Reports</div>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Side-by-side matching &amp; connect</p>
        </div>

        <div 
          onClick={() => setActiveTab('students')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'students' ? 'bg-white border-[var(--navy)] shadow-md' : 'bg-white border-[var(--line)] hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Student Accounts</span>
            <div className="h-8 w-8 rounded-xl bg-[var(--paper)] text-[var(--navy)] flex items-center justify-center font-bold">
              <Users className="h-4 w-4 text-purple-800" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--navy)]">{studentMetrics.totalStudents}</div>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">{studentMetrics.activeInLast7Days} active in last 7 days</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'bg-white text-[var(--navy)] border border-[var(--line)] hover:bg-[var(--paper)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Campus Reports ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'compare'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'bg-white text-[var(--navy)] border border-[var(--line)] hover:bg-[var(--paper)]'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Comparison Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'bg-white text-[var(--navy)] border border-[var(--line)] hover:bg-[var(--paper)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Accounts ({studentMetrics.totalStudents})</span>
        </button>
      </div>

      {/* -------------------- TAB 1: REPORTS MANAGER -------------------- */}
      {activeTab === 'reports' && (
        <section className="bg-white rounded-2xl border border-[var(--line)] shadow-xs overflow-hidden space-y-4 p-5">
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search reports by item name, report ID, category, or location..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--paper)]/50 border border-[var(--line)] rounded-xl text-xs text-[var(--navy)] focus:outline-none focus:border-[var(--navy)]"
              />
            </div>

            <div className="inline-flex p-1 bg-[var(--paper)] rounded-xl text-xs font-bold border border-[var(--line)]">
              <button
                onClick={() => setReportTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reportTypeFilter === 'ALL' ? 'bg-white text-[var(--navy)] shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setReportTypeFilter('LOST')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reportTypeFilter === 'LOST' ? 'bg-amber-800 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                Lost ({lostCount})
              </button>
              <button
                onClick={() => setReportTypeFilter('FOUND')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reportTypeFilter === 'FOUND' ? 'bg-emerald-800 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                Found ({foundCount})
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--paper)] text-[var(--ink)] text-[10px] uppercase font-bold tracking-wider border-b border-[var(--line)]">
                <tr>
                  <th className="py-3 px-4">Item Report</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location &amp; Date</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/50 text-[var(--navy)]">
                {loadingReports ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-800" />
                      Loading campus reports...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
                      <p className="font-bold text-sm">No reports match your search or filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`type-badge ${item.type.toLowerCase()}`}>
                            {item.type}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--navy)] block">{item.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">#{item.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-stone-700">
                        {item.category}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-stone-800">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] font-bold text-[var(--navy)]">{item.reportedByName}</div>
                        <div className="text-[10px] text-[var(--muted)] font-mono">{item.reportedByEmail}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[var(--line)]">
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleInspectReport(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--paper)] hover:bg-[var(--canvas)] border border-[var(--line)] text-xs font-bold text-[var(--navy)] transition inline-flex items-center gap-1 cursor-pointer"
                            title="View Full Report Details"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button
                            onClick={() => {
                              setCompareId1(item.id);
                              setActiveTab('compare');
                            }}
                            className="p-1 rounded-lg hover:bg-[var(--paper)] text-stone-600 border border-transparent hover:border-[var(--line)] transition cursor-pointer"
                            title="Compare in Studio"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteReportTarget(item)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Delete Report Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* -------------------- TAB 2: REPORT COMPARISON STUDIO -------------------- */}
      {activeTab === 'compare' && (
        <section className="bg-white rounded-2xl border border-[var(--line)] shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
            <div>
              <h3 className="font-bold text-base text-[var(--navy)]">Report Comparison &amp; Match Studio</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Select any two reports across the campus registry to inspect side-by-side details, images, and manually connect them.
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-[var(--paper)] px-3 py-1.5 rounded-xl border border-[var(--line)]">
              {items.length} Total Reports Available
            </span>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--navy)] block mb-1.5">Select Report A:</label>
              <select
                value={compareId1}
                onChange={(e) => setCompareId1(e.target.value)}
                className="w-full p-2.5 bg-[var(--paper)]/50 border border-[var(--line)] rounded-xl text-xs text-[var(--navy)] font-medium"
              >
                <option value="">-- Choose first report to compare --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.type}] {item.name} ({item.category}) - {item.location} (#{item.id.slice(0, 6)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--navy)] block mb-1.5">Select Report B:</label>
              <select
                value={compareId2}
                onChange={(e) => setCompareId2(e.target.value)}
                className="w-full p-2.5 bg-[var(--paper)]/50 border border-[var(--line)] rounded-xl text-xs text-[var(--navy)] font-medium"
              >
                <option value="">-- Choose second report to compare --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.type}] {item.name} ({item.category}) - {item.location} (#{item.id.slice(0, 6)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Report 1 Card */}
            <div className="p-4 bg-[var(--paper)] rounded-2xl border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Report A</span>
                {report1Details && (
                  <span className={`type-badge ${report1Details.type.toLowerCase()}`}>
                    {report1Details.type}
                  </span>
                )}
              </div>

              {!report1Details ? (
                <div className="py-12 text-center text-[var(--muted)] italic text-xs">
                  Select Report A from the dropdown above.
                </div>
              ) : (
                <div className="space-y-3 text-xs text-[var(--navy)]">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--navy)]">{report1Details.name}</h4>
                    <span className="text-[11px] text-[var(--muted)] font-medium">{report1Details.category} • Status: {report1Details.status}</span>
                  </div>

                  <p className="text-stone-700 bg-white p-3 rounded-xl border border-[var(--line)]/60 text-xs">
                    {report1Details.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-[var(--line)]/60">
                      <span className="text-[10px] text-[var(--muted)] block">Location</span>
                      <span className="font-semibold text-stone-800">{report1Details.location}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[var(--line)]/60">
                      <span className="text-[10px] text-[var(--muted)] block">Reported Date</span>
                      <span className="font-semibold text-stone-800">{new Date(report1Details.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-[var(--line)]/60">
                    <span className="text-[10px] text-[var(--muted)] block">Reported By</span>
                    <span className="font-bold text-stone-900 block">{report1Details.reportedBy.name}</span>
                    <span className="text-[11px] text-stone-500 font-mono">{report1Details.reportedBy.email}</span>
                  </div>

                  {report1Details.image && (
                    <div
                      onClick={() =>
                        setFullImage({
                          url: report1Details.image!,
                          title: report1Details.name,
                          subtitle: `Report A (${report1Details.type}) · Ref #${report1Details.id} · ${report1Details.location}`,
                        })
                      }
                      className="cursor-pointer relative group rounded-xl overflow-hidden"
                      title="Click to view full image"
                    >
                      <img
                        src={report1Details.image}
                        alt="Report A Photo"
                        className="w-full h-36 object-cover rounded-xl border border-[var(--line)] transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Click to Inspect
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Report 2 Card */}
            <div className="p-4 bg-[var(--paper)] rounded-2xl border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Report B</span>
                {report2Details && (
                  <span className={`type-badge ${report2Details.type.toLowerCase()}`}>
                    {report2Details.type}
                  </span>
                )}
              </div>

              {!report2Details ? (
                <div className="py-12 text-center text-[var(--muted)] italic text-xs">
                  Select Report B from the dropdown above.
                </div>
              ) : (
                <div className="space-y-3 text-xs text-[var(--navy)]">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--navy)]">{report2Details.name}</h4>
                    <span className="text-[11px] text-[var(--muted)] font-medium">{report2Details.category} • Status: {report2Details.status}</span>
                  </div>

                  <p className="text-stone-700 bg-white p-3 rounded-xl border border-[var(--line)]/60 text-xs">
                    {report2Details.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-[var(--line)]/60">
                      <span className="text-[10px] text-[var(--muted)] block">Location</span>
                      <span className="font-semibold text-stone-800">{report2Details.location}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[var(--line)]/60">
                      <span className="text-[10px] text-[var(--muted)] block">Reported Date</span>
                      <span className="font-semibold text-stone-800">{new Date(report2Details.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-[var(--line)]/60">
                    <span className="text-[10px] text-[var(--muted)] block">Reported By</span>
                    <span className="font-bold text-stone-900 block">{report2Details.reportedBy.name}</span>
                    <span className="text-[11px] text-stone-500 font-mono">{report2Details.reportedBy.email}</span>
                  </div>

                  {report2Details.image && (
                    <div
                      onClick={() =>
                        setFullImage({
                          url: report2Details.image!,
                          title: report2Details.name,
                          subtitle: `Report B (${report2Details.type}) · Ref #${report2Details.id} · ${report2Details.location}`,
                        })
                      }
                      className="cursor-pointer relative group rounded-xl overflow-hidden"
                      title="Click to view full image"
                    >
                      <img
                        src={report2Details.image}
                        alt="Report B Photo"
                        className="w-full h-36 object-cover rounded-xl border border-[var(--line)] transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Click to Inspect
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action & Connection Footer */}
          <div className="p-4 bg-[var(--paper)] rounded-2xl border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              {report1Details && report2Details && report1Details.type !== report2Details.type ? (
                <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Eligible for match connection (1 Lost report + 1 Found report selected)
                </span>
              ) : report1Details && report2Details ? (
                <span className="text-amber-800 font-semibold">
                  Both selected reports are of type "{report1Details.type}". (Select 1 Lost and 1 Found report to match)
                </span>
              ) : (
                <span className="text-[var(--muted)]">Select two reports to review similarity and connection options.</span>
              )}
            </div>

            {report1Details && report2Details && report1Details.type !== report2Details.type && (
              <button
                onClick={handleConnectReports}
                disabled={connectingMatches}
                className="button button-admin text-xs"
                style={{ minHeight: '36px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {connectingMatches ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Connect Reports Manually
              </button>
            )}
          </div>
        </section>
      )}

      {/* -------------------- TAB 3: STUDENT ACCOUNTS MANAGER -------------------- */}
      {activeTab === 'students' && (
        <section className="bg-white rounded-2xl border border-[var(--line)] shadow-xs overflow-hidden space-y-4 p-5">
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setStudentPage(1);
                fetchStudents(1, studentSearch, studentFilter);
              }} 
              className="relative flex-1 max-w-md"
            >
              <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search students by name, email, or campus ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-20 py-2 text-xs bg-[var(--paper)]/50 border border-[var(--line)] rounded-xl focus:outline-none focus:border-[var(--navy)] text-[var(--navy)]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-[var(--navy)] hover:opacity-90 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="inline-flex p-1 bg-[var(--paper)] rounded-xl text-xs font-bold border border-[var(--line)]">
              <button
                onClick={() => {
                  setStudentFilter('all');
                  setStudentPage(1);
                  fetchStudents(1, studentSearch, 'all');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  studentFilter === 'all' ? 'bg-white text-[var(--navy)] shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                All ({studentMetrics.totalStudents})
              </button>
              <button
                onClick={() => {
                  setStudentFilter('active');
                  setStudentPage(1);
                  fetchStudents(1, studentSearch, 'active');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  studentFilter === 'active' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                Active 7d ({studentMetrics.activeInLast7Days})
              </button>
              <button
                onClick={() => {
                  setStudentFilter('never_logged_in');
                  setStudentPage(1);
                  fetchStudents(1, studentSearch, 'never_logged_in');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  studentFilter === 'never_logged_in' ? 'bg-stone-700 text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                Never Logged In ({studentMetrics.neverLoggedIn})
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--paper)] border-b border-[var(--line)] text-[var(--ink)] uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Student Account</th>
                  <th className="px-4 py-3">Campus ID</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/50 text-[var(--navy)]">
                {loadingStudents ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-700" />
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40 text-stone-400" />
                      <p className="font-semibold text-sm">No student accounts found.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-[var(--paper)]/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-[var(--paper)] border border-[var(--line)] text-[var(--navy)] font-black flex items-center justify-center text-xs">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--navy)] block">{st.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">ID: {st.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-amber-900">
                        {st.studentId || <span className="text-stone-400 font-normal italic">Unassigned</span>}
                      </td>

                      <td className="px-4 py-3.5 text-stone-700 font-medium">
                        {st.email}
                      </td>

                      <td className="px-4 py-3.5 text-[var(--muted)] font-medium">
                        {new Date(st.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3.5">
                        {st.lastLoginAt ? (
                          <div className="space-y-0.5">
                            <div>
                              {st.isActiveLast7Days ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Active 7d
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              {new Date(st.lastLoginAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">Never</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleInspectStudent(st.id)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--paper)] hover:bg-[var(--canvas)] border border-[var(--line)] text-xs font-bold text-[var(--navy)] transition inline-flex items-center gap-1 cursor-pointer"
                            title="View Student Details & Password Status"
                          >
                            <Eye className="h-3 w-3" /> View Details
                          </button>
                          <button
                            onClick={() => setDeleteStudentTarget(st)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 transition cursor-pointer"
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
          {studentPagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-2">
              <div>
                Page <span className="font-bold text-[var(--navy)]">{studentPagination.page}</span> of{' '}
                <span className="font-bold text-[var(--navy)]">{studentPagination.totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const prev = Math.max(1, studentPage - 1);
                    setStudentPage(prev);
                    fetchStudents(prev, studentSearch, studentFilter);
                  }}
                  disabled={studentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-[var(--line)] text-[var(--navy)] hover:bg-[var(--paper)] disabled:opacity-40 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(studentPagination.totalPages, studentPage + 1);
                    setStudentPage(next);
                    fetchStudents(next, studentSearch, studentFilter);
                  }}
                  disabled={studentPage === studentPagination.totalPages}
                  className="px-3 py-1.5 rounded-xl border border-[var(--line)] text-[var(--navy)] hover:bg-[var(--paper)] disabled:opacity-40 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ----------------- MODAL 1: VIEW REPORT DETAILS MODAL ----------------- */}
      {inspectReportId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[var(--line)] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-[var(--navy)] text-base">
                  Report #{inspectReportId.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => {
                  setInspectReportId(null);
                  setInspectedReport(null);
                }}
                className="text-stone-400 hover:text-[var(--navy)] text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {inspectReportLoading ? (
              <div className="py-12 text-center text-[var(--muted)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
                <span>Loading report details...</span>
              </div>
            ) : !inspectedReport ? (
              <div className="py-8 text-center text-rose-600 font-semibold">
                Report not found.
              </div>
            ) : (
              <div className="space-y-4 text-xs text-[var(--navy)]">
                {/* Header card */}
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`type-badge ${inspectedReport.type.toLowerCase()}`}>
                        {inspectedReport.type}
                      </span>
                      <span className="font-bold text-sm text-[var(--navy)]">{inspectedReport.name}</span>
                    </div>
                    <p className="text-stone-600">{inspectedReport.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white border border-[var(--line)]">
                      {inspectedReport.status}
                    </span>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Location &amp; Date</div>
                    <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span>{inspectedReport.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <span>{new Date(inspectedReport.date).toLocaleDateString()} {inspectedReport.time ? `(${inspectedReport.time})` : ''}</span>
                    </div>
                    {inspectedReport.storageLocation && (
                      <div className="text-[11px] text-amber-800 font-bold bg-amber-50 p-1.5 rounded border border-amber-200">
                        Custody Locker: {inspectedReport.storageLocation}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Reported By</div>
                    <div className="font-bold text-stone-900">{inspectedReport.reportedBy.name}</div>
                    <div className="text-stone-600 font-mono text-[11px]">{inspectedReport.reportedBy.email}</div>
                    <div className="text-stone-500 text-[11px]">
                      Student ID: {inspectedReport.reportedBy.studentId || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {inspectedReport.additionalDetails && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block mb-0.5">
                      Private Identifying Details (Security Only):
                    </span>
                    <p className="text-stone-700 font-medium">{inspectedReport.additionalDetails}</p>
                  </div>
                )}

                {/* Photo */}
                {inspectedReport.image && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)] block mb-1">Attached Photo:</span>
                    <div
                      onClick={() =>
                        setFullImage({
                          url: inspectedReport.image!,
                          title: inspectedReport.name,
                          subtitle: `Ref #${inspectedReport.id} · ${inspectedReport.category} · Found at ${inspectedReport.location}`,
                        })
                      }
                      className="cursor-pointer relative group rounded-xl overflow-hidden"
                      title="Click to view full image"
                    >
                      <img
                        src={inspectedReport.image}
                        alt={inspectedReport.name}
                        className="w-full max-h-48 object-cover rounded-xl border border-[var(--line)] transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Click to Inspect Full Image
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
                  <button
                    onClick={() => setDeleteReportTarget(inspectedReport)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Report
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCompareId1(inspectedReport.id);
                        setActiveTab('compare');
                        setInspectReportId(null);
                      }}
                      className="px-3 py-1.5 bg-[var(--paper)] hover:bg-[var(--canvas)] border border-[var(--line)] text-[var(--navy)] rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      Compare in Studio
                    </button>
                    <button
                      onClick={() => {
                        setInspectReportId(null);
                        setInspectedReport(null);
                      }}
                      className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: DELETE REPORT CONFIRMATION MODAL ----------------- */}
      {deleteReportTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--navy)] text-base">Delete Report Permanently</h3>
                <p className="text-xs text-[var(--muted)]">Report #{deleteReportTarget.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-bold">Item: {deleteReportTarget.name} ({deleteReportTarget.category})</p>
              <p className="text-[11px] text-rose-700">
                Warning: This will permanently remove the report and any associated matches and claims.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--navy)] block mb-1">
                Reason for Deletion:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Duplicate test report, spam, or solved offline..."
                value={deleteReportReason}
                onChange={(e) => setDeleteReportReason(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-[var(--line)] rounded-xl text-xs text-[var(--navy)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  setDeleteReportTarget(null);
                  setDeleteReportReason('');
                }}
                disabled={deleteReportPending}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleteReportPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
              >
                {deleteReportPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: VIEW STUDENT DETAILS & PASS MODAL ----------------- */}
      {selectedStudentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[var(--line)] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-purple-800" />
                <h3 className="font-bold text-[var(--navy)] text-base">Student Account &amp; Credential Overview</h3>
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

            {loadingStudentDetails ? (
              <div className="py-12 text-center text-[var(--muted)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-800" />
                <span>Loading student account profile and credentials...</span>
              </div>
            ) : !studentDetails ? (
              <div className="py-8 text-center text-rose-600 font-semibold">
                Student account not found.
              </div>
            ) : (
              <div className="space-y-4 text-xs text-[var(--navy)]">
                {/* Profile Header */}
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
                      <span className="text-[var(--muted)]">Campus Student ID: </span>
                      <span className="font-mono font-bold text-amber-900">{studentDetails.studentId || 'None Assigned'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)]">Registered: </span>
                      <span className="font-medium">{new Date(studentDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Password & Security Card */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>Password &amp; Credentials Security Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Password Status</span>
                      <span className="font-mono text-xs font-bold text-stone-800">
                        {studentDetails.passwordPreview}
                      </span>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {studentDetails.hasPassword ? 'Encrypted via BCrypt 12-rounds' : 'OAuth / SSO Authentication'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold uppercase text-[var(--muted)] block">Last Login Timestamp</span>
                      <span className="text-xs font-bold text-stone-800">
                        {studentDetails.lastLoginAt ? new Date(studentDetails.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </span>
                      <p className="text-[10px] text-stone-500 mt-0.5">Session tracking in PostgreSQL</p>
                    </div>
                  </div>
                </div>

                {/* Reports History */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--navy)] block">
                    Reported Items History ({studentDetails.reportedItems.length}):
                  </span>
                  {studentDetails.reportedItems.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] italic p-2.5 bg-stone-50 rounded-xl">
                      No lost or found reports filed by this student.
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
                    onClick={() => setDeleteStudentTarget(studentDetails)}
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

      {/* ----------------- MODAL 4: DELETE STUDENT CONFIRMATION MODAL ----------------- */}
      {deleteStudentTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--navy)] text-base">Delete Student Account</h3>
                <p className="text-xs text-[var(--muted)]">Permanently delete account from database</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-bold">Student: {deleteStudentTarget.name} ({deleteStudentTarget.email})</p>
              <p className="text-[11px] text-rose-700">
                Warning: Deleting this student account will also remove all their associated reports, claims, and inquiries.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setDeleteStudentTarget(null)}
                disabled={deleteStudentPending}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={deleteStudentPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
              >
                {deleteStudentPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Account Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!fullImage}
        imageUrl={fullImage?.url || null}
        title={fullImage?.title}
        subtitle={fullImage?.subtitle}
        onClose={() => setFullImage(null)}
      />
    </div>
  );
}


