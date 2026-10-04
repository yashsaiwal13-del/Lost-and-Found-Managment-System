'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  Search, 
  User, 
  Package, 
  RefreshCw, 
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Check,
  Ban,
  MessageSquare
} from 'lucide-react';
import { 
  createVerificationRequest, 
  getVerificationRequestsForAdmin, 
  reviewVerificationRequest, 
  VerificationRequestData 
} from '@/app/actions/verification';
import { getAllAdminItems, AdminCampusItem } from '@/app/actions/getAllItems';
import { getCurrentUser } from '@/app/actions/auth';

export default function AdminVerificationHubPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'queue'>('queue');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requests, setRequests] = useState<VerificationRequestData[]>([]);
  const [items, setItems] = useState<AdminCampusItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Sending Inquiry
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedStudentSearch, setSelectedStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [questions, setQuestions] = useState<string[]>([
    'What brand, color shade, or distinctive scratch marks does this item have?',
    'Can you describe any unique items or papers contained inside / attached?',
    'Where exactly on campus was this item lost or last seen?'
  ]);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<VerificationRequestData | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'ACCEPTED' | 'REJECTED' | 'CLARIFICATION_REQUESTED'>('ACCEPTED');
  const [reviewNote, setReviewNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      if (u) setCurrentUser(u);

      const [reqs, allItems, studentsRes] = await Promise.all([
        getVerificationRequestsForAdmin(),
        getAllAdminItems({ includeArchived: false }),
        fetch('/api/admin/students').then((r) => (r.ok ? r.json() : { students: [] })),
      ]);

      setRequests(reqs || []);
      setItems(allItems || []);
      setStudents(studentsRes.students || []);

      if (allItems && allItems.length > 0 && !selectedItemId) {
        setSelectedItemId(allItems[0].id);
      }
      if (studentsRes.students && studentsRes.students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentsRes.students[0].id);
      }
    } catch (err) {
      console.error('Error loading admin verification hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter students for search dropdown
  const filteredStudents = students.filter((s) => {
    if (!selectedStudentSearch) return true;
    const q = selectedStudentSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
  });

  // Question array manipulation
  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, '']);
  };

  const handleQuestionChange = (index: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Inquiry
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Please select a campus item report.');
      return;
    }
    if (!selectedStudentId) {
      alert('Please select a recipient student.');
      return;
    }

    const filtered = questions.map((q) => q.trim()).filter((q) => q.length > 0);
    if (filtered.length === 0) {
      alert('Please provide at least one verification question.');
      return;
    }

    try {
      setSubmittingInquiry(true);
      const res = await createVerificationRequest(selectedItemId, selectedStudentId, filtered);

      if (!res.success) {
        alert(res.error || 'Failed to dispatch verification questions.');
      } else {
        showToast('Verification questions dispatched to student account.');
        setActiveTab('queue');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error dispatching inquiry.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Submit Decision
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;

    try {
      setSubmittingReview(true);
      const res = await reviewVerificationRequest(
        selectedRequestForReview.id,
        reviewDecision,
        reviewNote
      );

      if (!res.success) {
        alert(res.error || 'Failed to save review decision.');
      } else {
        setReviewModalOpen(false);
        setSelectedRequestForReview(null);
        setReviewNote('');
        showToast(`Verification decision recorded: ${reviewDecision}`);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording review decision.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingAnswerCount = requests.filter((r) => r.status === 'ANSWERED').length;

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <span className="match-kicker">Security Inquiries</span>
          <h1>Verification Hub</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
            Send tailored proof questions to students and review submitted answers before releasing custody.
          </p>
        </div>

        <div>
          <div className="verified">
            <ShieldCheck className="h-4 w-4" />
            <span>Verification Queue</span>
          </div>

          <button
            onClick={loadData}
            className="button button-ghost"
            style={{ minHeight: '36px', padding: '0 14px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'queue'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            Verification Review Queue ({requests.length})
            {pendingAnswerCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                {pendingAnswerCount} Ready
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Send New Verification Questions
          </button>
        </div>

        {/* TAB 1: REVIEW QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Verification Requests</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are currently no verification requests dispatched. Switch to &apos;Send New Verification Questions&apos; to query a student.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {requests.map((req) => {
                  const answered = req.status === 'ANSWERED';

                  return (
                    <div key={req.id} className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        
                        {/* Header Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'ANSWERED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                              : req.status === 'CLARIFICATION_REQUESTED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {req.status}
                          </span>

                          <span className="text-xs font-bold text-slate-900">
                            Item: {req.item.name}
                          </span>

                          <span className="text-xs text-slate-400">•</span>
                          
                          <span className="text-xs text-slate-600 font-semibold">
                            Recipient: {req.recipient.name} ({req.recipient.studentId || req.recipient.email})
                          </span>
                        </div>

                        {/* Questions & Answers Preview */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                          {req.questions.map((q, idx) => (
                            <div key={q.id} className="text-xs space-y-1">
                              <span className="font-bold text-slate-800">
                                <span className="text-purple-600 mr-1">Q{idx + 1}:</span>
                                {q.questionText}
                              </span>
                              <div className="pl-3 border-l-2 border-indigo-400 text-slate-700 bg-white p-2 rounded-lg italic">
                                {q.answerText ? (
                                  <span>{q.answerText}</span>
                                ) : (
                                  <span className="text-amber-600 not-italic">Awaiting student response...</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {req.adminNotes && (
                          <p className="text-xs text-slate-600">
                            <strong>Admin Note / Clarification:</strong> {req.adminNotes}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequestForReview(req);
                            setReviewDecision(answered ? 'ACCEPTED' : 'CLARIFICATION_REQUESTED');
                            setReviewNote(req.adminNotes || '');
                            setReviewModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
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
          </div>
        )}

        {/* TAB 2: CREATE INQUIRY */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
            <form onSubmit={handleSendInquiry} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Select Item */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Select Campus Report / Item *
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.type}] {it.name} - #{it.id} ({it.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Select Recipient Student */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Select Recipient Student *
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search student by name, email, or student ID..."
                      value={selectedStudentSearch}
                      onChange={(e) => setSelectedStudentSearch(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      {filteredStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.studentId || 'No ID'} • {s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Questions Builder */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Verification Questions ({questions.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-xl transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Another Question
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-6 shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => handleQuestionChange(idx, e.target.value)}
                        required
                        placeholder="e.g. Can you state any sticker or lockscreen wallpaper on this device?"
                        className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Dispatch */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {submittingInquiry ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Dispatching Questions...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Dispatch Questions to Student
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      {/* REVIEW DECISION MODAL */}
      {reviewModalOpen && selectedRequestForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review Verification Answers</h3>
                  <p className="text-xs text-slate-500">
                    Inquiry for: {selectedRequestForReview.item.name} ({selectedRequestForReview.recipient.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Answer Display */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto border border-slate-200">
              {selectedRequestForReview.questions.map((q, idx) => (
                <div key={q.id} className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">Q{idx + 1}: {q.questionText}</p>
                  <p className="p-2 bg-white rounded-lg text-slate-700 italic border border-slate-200">
                    {q.answerText || <span className="text-amber-600 not-italic">No answer submitted yet.</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Selection Form */}
            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Administrative Decision *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('ACCEPTED')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      reviewDecision === 'ACCEPTED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept Proof
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('CLARIFICATION_REQUESTED')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      reviewDecision === 'CLARIFICATION_REQUESTED'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Ask Clarification
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('REJECTED')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      reviewDecision === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Admin Note / Instructions to Student
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. Verified! You may collect from Main Safety Desk Locker #B-12. Please bring your student ID."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {submittingReview ? 'Recording Decision...' : 'Confirm Decision'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}

