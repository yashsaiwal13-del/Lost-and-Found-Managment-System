'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Search, 
  MapPin, 
  Calendar, 
  Tag, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X,
  Users,
  FileText,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  Filter,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  MessageSquare,
  Archive,
  ArchiveRestore,
  History,
  Send,
  HelpCircle,
  PackageCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Settings,
  GitCompare
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORIES } from '@/lib/constants';
import { getCurrentUser } from '@/app/actions/auth';
import { getAllAdminItems } from '@/app/actions/getAllItems';
import { changeItemStatus, toggleArchiveItem } from '@/app/actions/items';
import { confirmHandover } from '@/app/actions/claims';
import { getAdminStats, AdminStatsData } from '@/app/actions/adminStats';
import { archiveReport, restoreReport } from '@/app/actions/moderation';

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'verifications' | 'students' | 'audit'>('items');
  
  // Data states
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  // 1. Send Questions Modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedItemForQuestions, setSelectedItemForQuestions] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [questionsList, setQuestionsList] = useState<string[]>([
    'What brand, color shade, or distinctive scratch marks does this item have?',
    'Can you describe any unique items or papers contained inside / attached?',
    'Where exactly on campus was this item lost or last seen?'
  ]);
  const [adminNotes, setAdminNotes] = useState('');
  const [sendingQuestions, setSendingQuestions] = useState(false);

  // 2. Review Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [decisionAction, setDecisionAction] = useState<'VERIFY' | 'CLARIFY' | 'REJECT' | 'HANDOVER'>('VERIFY');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [handoverRecipientId, setHandoverRecipientId] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // 3. Archive Modal
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<any>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [submittingArchive, setSubmittingArchive] = useState(false);

  // 4. Direct Item Handover Modal
  const [itemHandoverModalOpen, setItemHandoverModalOpen] = useState(false);
  const [selectedItemForHandover, setSelectedItemForHandover] = useState<any>(null);
  const [itemHandoverRecipientId, setItemHandoverRecipientId] = useState('');
  const [itemHandoverNotes, setItemHandoverNotes] = useState('');
  const [submittingItemHandover, setSubmittingItemHandover] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load all data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Live Admin Stats directly from Prisma via Server Action
      const stats = await getAdminStats();
      if (stats) {
        setAdminStats(stats);
      }

      // 2. Items via Server Action
      const allItems = await getAllAdminItems({ includeArchived: true });
      if (allItems) {
        setItems(allItems);
      }

      // 3. Students
      const studentsRes = await fetch('/api/admin/students');
      if (studentsRes.ok) {
        const d = await studentsRes.json();
        setStudents(d.students || []);
      }

      // 4. Verifications
      const verifRes = await fetch('/api/verification/student');
      if (verifRes.ok) {
        const d = await verifRes.json();
        setVerifications(d.requests || []);
      }

      // 5. Audit Logs
      const auditRes = await fetch('/api/admin/audit-logs?limit=50');
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.auditLogs || []);
      }

      const u = await getCurrentUser();
      if (u) setCurrentUser(u);
    } catch (err) {
      console.error('Failed to fetch admin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handle Quick Status Change
  const handleStatusChange = async (itemId: string, newStatus: string) => {
    setUpdatingId(itemId);
    try {
      const res = await changeItemStatus(itemId, newStatus);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
        );
        showToast(`Status for item #${itemId} updated to ${newStatus}.`);
        loadAdminData();
      } else {
        alert(res.error || 'Failed to update item status.');
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      alert('Network error while updating status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Archive / Restore
  const handleToggleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToArchive) return;

    try {
      setSubmittingArchive(true);
      const isCurrentlyArchived = itemToArchive.isArchived;
      const res = isCurrentlyArchived
        ? await restoreReport(itemToArchive.id)
        : await archiveReport(itemToArchive.id, archiveReason || 'Archived by administrator');

      if (!res.success) {
        throw new Error(res.error || 'Failed to update item archive state.');
      }

      setArchiveModalOpen(false);
      setItemToArchive(null);
      setArchiveReason('');
      showToast(isCurrentlyArchived ? 'Report restored to active registry.' : 'Report archived safely.');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error archiving report.');
    } finally {
      setSubmittingArchive(false);
    }
  };

  // Send Questions Form
  const handleSendQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForQuestions || !selectedStudentId) {
      alert('Please select both an item and a student.');
      return;
    }

    const filteredQs = questionsList.filter((q) => q.trim().length > 0);
    if (filteredQs.length === 0) {
      alert('Please provide at least one verification question.');
      return;
    }

    try {
      setSendingQuestions(true);
      const res = await fetch('/api/verification/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemForQuestions.id,
          studentId: selectedStudentId,
          questions: filteredQs,
          notes: adminNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification questions.');
      }

      setSendModalOpen(false);
      setSelectedItemForQuestions(null);
      setSelectedStudentId('');
      setAdminNotes('');
      showToast('Verification questions dispatched to student account.');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error sending questions.');
    } finally {
      setSendingQuestions(false);
    }
  };

  // Submit Decision
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerification) return;

    try {
      setSubmittingDecision(true);
      const payload: any = { action: decisionAction };
      if (decisionAction === 'REJECT') {
        if (!rejectionReason.trim()) {
          alert('Please enter a rejection reason.');
          setSubmittingDecision(false);
          return;
        }
        payload.rejectionReason = rejectionReason;
      }
      if (decisionNotes.trim()) {
        payload.adminNotes = decisionNotes;
      }
      if (decisionAction === 'HANDOVER') {
        payload.recipientStudentId = handoverRecipientId || selectedVerification.studentId;
      }

      const res = await fetch(`/api/verification/${selectedVerification.id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process decision.');
      }

      setDecisionModalOpen(false);
      setSelectedVerification(null);
      setDecisionNotes('');
      setRejectionReason('');
      showToast(`Decision recorded: ${decisionAction}`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error recording verification decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Direct Handover Confirmation (Intermediate VERIFIED -> RESOLVED)
  const handleDirectHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForHandover) return;
    try {
      setSubmittingItemHandover(true);
      const res = await confirmHandover(
        selectedItemForHandover.id,
        itemHandoverRecipientId || selectedItemForHandover.reportedById || undefined,
        itemHandoverNotes || undefined
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to authorize item handover.');
      }

      setItemHandoverModalOpen(false);
      setSelectedItemForHandover(null);
      setItemHandoverRecipientId('');
      setItemHandoverNotes('');
      showToast(`Item #${selectedItemForHandover.id} officially marked as RESOLVED and handed over.`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Error authorizing item handover.');
    } finally {
      setSubmittingItemHandover(false);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!showArchived && item.isArchived) return false;
      if (showArchived && !item.isArchived) return false;
      if (typeFilter !== 'all' && item.type?.toLowerCase() !== typeFilter) return false;
      if (statusFilter !== 'All' && item.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, categoryFilter, searchQuery, showArchived]);

  // Metrics
  const metrics = useMemo(() => {
    const activeItems = items.filter((i) => !i.isArchived);
    const lostCount = activeItems.filter((i) => i.type === 'LOST').length;
    const foundCount = activeItems.filter((i) => i.type === 'FOUND').length;
    const pendingVerifs = verifications.filter(
      (v) => v.status === 'PENDING' || v.status === 'ANSWERS_SUBMITTED' || v.status === 'CLARIFICATION_REQUESTED'
    ).length;
    const returnedItems = items.filter(
      (i) => i.status === 'RESOLVED' || i.status === 'ITEM_RETURNED'
    ).length;

    return {
      totalStudents: students.length,
      activeItemsCount: activeItems.length,
      lostCount,
      foundCount,
      pendingVerifs,
      returnedItems,
      archivedCount: items.filter((i) => i.isArchived).length,
    };
  }, [items, students, verifications]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      {/* Admin Operations Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* System Admin Title */}
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 shrink-0 border border-purple-400/30">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                    Administrator Console
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live System Active
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  Campus Lost &amp; Found Administration
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged in as: <span className="text-slate-200 font-semibold">{currentUser?.name || 'Administrator'}</span> ({currentUser?.email || 'admin@campus.edu'})
                </p>
              </div>
            </div>

            {/* Top Navigation & Quick Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
              <Link
                href="/admin/students"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
              >
                <Users className="h-4 w-4" />
                Student Directory
              </Link>
              <Link
                href="/admin/matches"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
              >
                <GitCompare className="h-4 w-4" />
                Match &amp; Return
              </Link>
              <Link
                href="/admin/verification"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <HelpCircle className="h-4 w-4 text-purple-400" />
                Verification Hub
              </Link>
              <Link
                href="/admin/audit-log"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <History className="h-4 w-4 text-purple-400" />
                Audit Trail
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition-all"
              >
                <Settings className="h-4 w-4 text-purple-400" />
                Admin Settings
              </Link>
              <Link
                href="/security"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
              >
                <ShieldCheck className="h-4 w-4" />
                Safety Desk
              </Link>
              <button
                onClick={loadAdminData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
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
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 4 Admin Metric Cards — Driven Exclusively by Live Prisma Queries via getAdminStats() */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Reports</span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {adminStats ? adminStats.totalLostReports + adminStats.totalFoundReports : metrics.activeItemsCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              {adminStats
                ? `${adminStats.totalLostReports} Lost • ${adminStats.totalFoundReports} Found (${adminStats.reportsAwaitingReview} Awaiting Review)`
                : `${metrics.lostCount} Lost • ${metrics.foundCount} Found`}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Inquiries</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {adminStats ? adminStats.pendingVerificationRequests + adminStats.answeredVerificationRequests : metrics.pendingVerifs}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              {adminStats
                ? `${adminStats.answeredVerificationRequests} answered awaiting review • ${adminStats.acceptedVerificationsCount} accepted`
                : 'Awaiting student answers or review'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Handed Over Items</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {adminStats ? adminStats.resolvedItemsCount : metrics.returnedItems}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Securely released to verified owners
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Students</span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-600 tracking-tight">
              {adminStats ? adminStats.totalStudents : metrics.totalStudents}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              {adminStats
                ? `${adminStats.studentsActiveLast7Days} active in last 7d • ${adminStats.studentsWithLogin} logged in`
                : 'Searchable campus directory'}
            </p>
          </div>
        </div>

        {/* Console Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'items'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            Registry &amp; Status Controls ({items.length})
          </button>

          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'verifications'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Verification Center ({verifications.length})
            {metrics.pendingVerifs > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
                {metrics.pendingVerifs}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Student Directory ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            Security Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: REGISTRY & ITEMS */}
        {activeTab === 'items' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Campus Item Management &amp; Status Controls
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update statuses, ask verification proof questions, or archive suspicious/duplicate reports.
                  </p>
                </div>

                {/* Type & Archive Toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                      showArchived
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {showArchived ? 'Showing Archived Items' : 'View Archive Vault'}
                  </button>

                  <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTypeFilter('lost')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        typeFilter === 'lost' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lost
                    </button>
                    <button
                      onClick={() => setTypeFilter('found')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        typeFilter === 'found' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Found
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter controls row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by title, location, or ref code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="REPORTED">REPORTED</option>
                    <option value="OPEN">OPEN</option>
                    <option value="VERIFICATION_REQUIRED">VERIFICATION_REQUIRED</option>
                    <option value="AWAITING_STUDENT_ANSWERS">AWAITING_STUDENT_ANSWERS</option>
                    <option value="ANSWERS_SUBMITTED">ANSWERS_SUBMITTED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="ITEM_RETURNED">ITEM_RETURNED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Ref ID</th>
                    <th className="px-6 py-3.5">Item Name &amp; Description</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Reported By</th>
                    <th className="px-6 py-3.5">Location / Custody</th>
                    <th className="px-6 py-3.5">Current Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item) => {
                    const isLost = item.type?.toLowerCase() === 'lost';
                    const currentStatus = item.status?.toUpperCase() || 'OPEN';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">#{item.id}</td>
                        <td className="px-6 py-4 max-w-xs">
                          <Link href={`/items/${item.id}`} className="font-bold text-slate-900 hover:text-purple-600 block">
                            {item.name}
                          </Link>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{item.description}</span>
                          {item.isArchived && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold mt-1">
                              <Archive className="h-2.5 w-2.5" /> Archived: {item.archivedReason || 'No reason noted'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLost ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900 block">{item.reportedByName || 'Student'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.reportedByEmail}</span>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <div>{item.location}</div>
                          {item.storageLocation && (
                            <div className="text-[10px] text-indigo-600 font-bold">Locker: {item.storageLocation}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={currentStatus}
                            disabled={updatingId === item.id}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="REPORTED">REPORTED</option>
                            <option value="OPEN">OPEN</option>
                            <option value="VERIFICATION_REQUIRED">VERIFICATION_REQUIRED</option>
                            <option value="AWAITING_STUDENT_ANSWERS">AWAITING_STUDENT_ANSWERS</option>
                            <option value="ANSWERS_SUBMITTED">ANSWERS_SUBMITTED</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="ITEM_RETURNED">ITEM_RETURNED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {currentStatus === 'VERIFIED' && (
                              <button
                                title="Authorize Item Custody Handover"
                                onClick={() => {
                                  setSelectedItemForHandover(item);
                                  setItemHandoverRecipientId(item.reportedById || '');
                                  setItemHandoverNotes('');
                                  setItemHandoverModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Handover
                              </button>
                            )}
                            <button
                              title="Ask Student Proof Questions"
                              onClick={() => {
                                setSelectedItemForQuestions(item);
                                setSelectedStudentId(item.reportedById || students[0]?.id || '');
                                setSendModalOpen(true);
                              }}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </button>
                            <button
                              title={item.isArchived ? 'Restore Report' : 'Archive Report'}
                              onClick={() => {
                                setItemToArchive(item);
                                setArchiveReason(item.archivedReason || '');
                                setArchiveModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.isArchived
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                            >
                              {item.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: VERIFICATION CENTER */}
        {activeTab === 'verifications' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Verification Inquiries &amp; Custody Handover
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review proof submitted by students, ask follow-up questions, and authorize item handover.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedItemForQuestions(items[0] || null);
                  setSelectedStudentId(students[0]?.id || '');
                  setSendModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                New Verification Inquiry
              </button>
            </div>

            {verifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-50 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No verification inquiries currently active.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &apos;New Verification Inquiry&apos; or select an item from the registry to send questions to a student.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {verifications.map((v) => {
                  let parsedQuestions: string[] = [];
                  let parsedAnswers: string[] = [];
                  try { parsedQuestions = JSON.parse(v.questions); } catch { parsedQuestions = [v.questions]; }
                  try { parsedAnswers = v.answers ? JSON.parse(v.answers) : []; } catch { parsedAnswers = []; }

                  const hasAnswers = parsedAnswers.length > 0;

                  return (
                    <div key={v.id} className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            v.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : v.status === 'HANDED_OVER'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : v.status === 'ANSWERS_SUBMITTED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : v.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {v.status}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Item: {v.item?.name}
                          </span>
                          <span className="text-xs text-slate-400">• Student ID: {v.student?.studentId || v.studentId} ({v.student?.name})</span>
                        </div>

                        {/* Questions & Answers Preview */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                          {parsedQuestions.map((q, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-bold text-slate-700">Q{idx + 1}: {q}</span>
                              <div className="text-slate-600 mt-0.5 pl-3 border-l-2 border-indigo-400 italic">
                                {parsedAnswers[idx] ? parsedAnswers[idx] : <span className="text-amber-600 not-italic">Awaiting student response...</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {v.adminNotes && (
                          <p className="text-xs text-slate-500">
                            <strong>Admin Note:</strong> {v.adminNotes}
                          </p>
                        )}
                        {v.rejectionReason && (
                          <p className="text-xs text-rose-600 font-semibold">
                            <strong>Rejection Reason:</strong> {v.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Review Action */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVerification(v);
                            setDecisionAction('VERIFY');
                            setDecisionNotes(v.adminNotes || '');
                            setHandoverRecipientId(v.student?.studentId || '');
                            setDecisionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Review &amp; Decide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: STUDENT DIRECTORY */}
        {activeTab === 'students' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Student Directory &amp; Activity
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View campus user profiles, report history, and verification activities.
                </p>
              </div>

              <Link
                href="/admin/students"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
              >
                <Users className="h-4 w-4" />
                Open Dedicated Student Directory &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Campus ID</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Reports Filed</th>
                    <th className="px-6 py-3.5">Verifications</th>
                    <th className="px-6 py-3.5">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{st.name}</td>
                      <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{st.studentId || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-500">{st.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[10px]">
                          {st.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-rose-600 font-bold">{st.stats?.lostReports || 0} Lost</span>
                        {' • '}
                        <span className="text-emerald-600 font-bold">{st.stats?.foundReports || 0} Found</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {st.stats?.activeVerifications || 0} Inquiries
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {st.lastLoginAt ? new Date(st.lastLoginAt).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Immutable Administrative Audit Trail
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full chronological log of administrative inquiries, claims verification, status updates, and handovers.
                </p>
              </div>

              <Link
                href="/admin/audit-log"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
              >
                <History className="h-4 w-4" />
                Open Full System Audit Log &rarr;
              </Link>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <History className="h-10 w-10 mx-auto mb-2 opacity-50 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No audit logs recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="mt-1 h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <History className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Performed by: <span className="font-semibold text-slate-800">{log.user?.name}</span> ({log.user?.email})
                        {log.itemId && <> • Target Item: <span className="font-mono text-indigo-600">#{log.itemId}</span></>}
                      </p>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg font-mono">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* MODAL 1: Send Verification Questions */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-purple-200" />
                  Dispatch Verification Questions
                </h3>
                <p className="text-xs text-purple-100">Directly inquiry proof of item ownership from student</p>
              </div>
              <button onClick={() => setSendModalOpen(false)} className="text-purple-200 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendQuestions} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Select Item */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Campus Item</label>
                <select
                  value={selectedItemForQuestions?.id || ''}
                  onChange={(e) => {
                    const it = items.find((i) => i.id === e.target.value);
                    setSelectedItemForQuestions(it || null);
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800 font-semibold"
                  required
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      #{i.id} - {i.name} ({i.type} at {i.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Student Account</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800 font-semibold"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.studentId || st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Questions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Verification Questions</label>
                {questionsList.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => {
                        const copy = [...questionsList];
                        copy[idx] = e.target.value;
                        setQuestionsList(copy);
                      }}
                      className="flex-1 text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                      required
                    />
                    {questionsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setQuestionsList(questionsList.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setQuestionsList([...questionsList, ''])}
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold inline-flex items-center gap-1 pt-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add Another Question
                </button>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Note / Special Instructions</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Please respond within 48 hours to authorize release from the safety custody locker..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSendModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingQuestions}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {sendingQuestions ? 'Dispatching...' : 'Dispatch Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Review Decision & Handover */}
      {decisionModalOpen && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-200" />
                  Verification Decision &amp; Handover
                </h3>
                <p className="text-xs text-indigo-100">Item: {selectedVerification.item?.name}</p>
              </div>
              <button onClick={() => setDecisionModalOpen(false)} className="text-indigo-200 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Decision Action Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionAction('VERIFY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      decisionAction === 'VERIFY'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Verify Ownership
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('HANDOVER')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      decisionAction === 'HANDOVER'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Authorize Handover
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('CLARIFY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      decisionAction === 'CLARIFY'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Ask Clarification
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('REJECT')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      decisionAction === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Reject Claim
                  </button>
                </div>
              </div>

              {decisionAction === 'HANDOVER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Campus Student ID</label>
                  <input
                    type="text"
                    value={handoverRecipientId}
                    onChange={(e) => setHandoverRecipientId(e.target.value)}
                    placeholder="e.g. STU-2026-8819"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                    required
                  />
                </div>
              )}

              {decisionAction === 'REJECT' && (
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">Rejection Reason</label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the submitted answers failed to verify ownership..."
                    className="w-full text-xs rounded-xl border border-rose-200 p-2.5 bg-rose-50 text-rose-900"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Additional custody or handover remarks..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingDecision ? 'Saving...' : 'Record Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Archive / Unarchive */}
      {archiveModalOpen && itemToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Archive className="h-4 w-4 text-amber-400" />
                  {itemToArchive.isArchived ? 'Restore Report' : 'Archive Report'}
                </h3>
                <p className="text-xs text-slate-400">Item #{itemToArchive.id}: {itemToArchive.name}</p>
              </div>
              <button onClick={() => setArchiveModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleToggleArchive} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {itemToArchive.isArchived
                  ? 'Restoring will make this item publicly visible again in the search registry.'
                  : 'Archiving hides this item from public browsing without deleting any database records or audit trails.'}
              </p>

              {!itemToArchive.isArchived && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Archive Reason</label>
                  <textarea
                    rows={3}
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    placeholder="e.g. Duplicate report, spam, resolved outside portal, or expired item..."
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                    required
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArchiveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingArchive}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingArchive
                    ? 'Processing...'
                    : itemToArchive.isArchived
                    ? 'Confirm Restore'
                    : 'Confirm Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Custody Handover */}
      {itemHandoverModalOpen && selectedItemForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-300" />
                  Confirm Item Custody Handover
                </h3>
                <p className="text-xs text-purple-200">
                  Item #{selectedItemForHandover.id}: {selectedItemForHandover.name}
                </p>
              </div>
              <button onClick={() => setItemHandoverModalOpen(false)} className="text-purple-300 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDirectHandoverSubmit} className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-3 text-xs text-purple-900">
                <p className="font-bold">Two-Step Verification Handover</p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Confirming this action stamps the official return date/time, marks the report as <strong>RESOLVED</strong>, and generates an audit log entry.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Student ID or Account ID (Optional)
                </label>
                <input
                  type="text"
                  value={itemHandoverRecipientId}
                  onChange={(e) => setItemHandoverRecipientId(e.target.value)}
                  placeholder="e.g. STU-2026-8819 or User ID"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Handover Notes / Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={itemHandoverNotes}
                  onChange={(e) => setItemHandoverNotes(e.target.value)}
                  placeholder="e.g. Student ID verified in person. Belonging inspected and collected."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemHandoverModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItemHandover}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingItemHandover ? 'Processing...' : 'Authorize Handover & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

