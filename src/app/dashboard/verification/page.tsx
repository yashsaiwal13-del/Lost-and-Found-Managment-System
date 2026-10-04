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
  Package, 
  MapPin, 
  Tag, 
  RefreshCw, 
  ChevronRight,
  Sparkles,
  Check,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Sidebar from '@/components/dashboard/Sidebar';
import { 
  getMyVerificationRequests, 
  submitVerificationAnswers, 
  VerificationRequestData 
} from '@/app/actions/verification';
import { getCurrentUser } from '@/app/actions/auth';

export default function StudentVerificationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requests, setRequests] = useState<VerificationRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [answersState, setAnswersState] = useState<Record<string, Record<string, string>>>({});
  const [feedback, setFeedback] = useState<{ id: string; success?: string; error?: string } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      if (u) setCurrentUser(u);

      const data = await getMyVerificationRequests();
      setRequests(data || []);

      // Initialize answers state
      const initialAnswers: Record<string, Record<string, string>> = {};
      data.forEach((req) => {
        initialAnswers[req.id] = {};
        req.questions.forEach((q) => {
          initialAnswers[req.id][q.id] = q.answerText || '';
        });
      });
      setAnswersState(initialAnswers);
    } catch (err: any) {
      console.error('Error fetching student verification questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAnswerChange = (requestId: string, questionId: string, value: string) => {
    setAnswersState((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [questionId]: value,
      },
    }));
  };

  const handleSubmit = async (req: VerificationRequestData) => {
    const currentReqAnswers = answersState[req.id] || {};
    const formattedPayload = req.questions.map((q) => ({
      questionId: q.id,
      answerText: (currentReqAnswers[q.id] || '').trim(),
    }));

    const unanswered = formattedPayload.filter((a) => !a.answerText);
    if (unanswered.length > 0) {
      setFeedback({ id: req.id, error: 'Please answer all verification questions before submitting.' });
      return;
    }

    try {
      setSubmittingId(req.id);
      setFeedback(null);
      const res = await submitVerificationAnswers(req.id, formattedPayload);

      if (!res.success) {
        setFeedback({ id: req.id, error: res.error || 'Failed to submit answers.' });
      } else {
        setFeedback({ id: req.id, success: 'Your answers have been submitted to Campus Security for review!' });
        loadRequests();
      }
    } catch (err: any) {
      setFeedback({ id: req.id, error: err.message || 'Error submitting answers.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified &amp; Accepted
          </span>
        );
      case 'ANSWERED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            Answers Submitted (Under Review)
          </span>
        );
      case 'CLARIFICATION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Clarification Requested
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            Verification Unsuccessful
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-100 border border-purple-300 px-3 py-1 rounded-full animate-pulse">
            <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
            Action Required: Answer Questions
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* 1. Sidebar */}
      <Sidebar 
        currentTab="verification" 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole="STUDENT"
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <HelpCircle className="h-6 w-6 text-purple-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    Proof &amp; Custody
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">Logged in as {currentUser?.name}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  My Verification Inquiries
                </h1>
              </div>
            </div>

            <button
              onClick={loadRequests}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-amber-300" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-bold">Ownership Verification System</h2>
                <p className="text-xs sm:text-sm text-purple-200 leading-relaxed max-w-2xl">
                  When campus staff or finders hold an item, Campus Security sends custom verification questions to confirm genuine ownership before releasing custody. Answer accurately with distinct identifiers (markings, contents, lockscreen details).
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading your verification inquiries...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Verification Questions Pending</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You currently have no outstanding verification requests. When Campus Security requires proof for a reported item, the questions will appear here.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => {
                const canEdit = req.status === 'PENDING' || req.status === 'CLARIFICATION_REQUESTED';

                return (
                  <div key={req.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    
                    {/* Item and Inquiry Header */}
                    <div className="bg-slate-50/80 p-5 sm:p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Inquiry #{req.id.slice(-6)}
                            </span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <Tag className="h-3 w-3 text-slate-400" />
                              {req.item.category}
                            </span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {req.item.location}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900">
                            {req.item.name}
                          </h3>

                          {req.item.storageLocation && (
                            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                              Locker Storage: {req.item.storageLocation}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="self-start md:self-auto">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Admin Note / Clarification Banner */}
                    {req.adminNotes && (
                      <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Message from Campus Security: </span>
                          <span>{req.adminNotes}</span>
                        </div>
                      </div>
                    )}

                    {/* Feedback message */}
                    {feedback?.id === req.id && (
                      <div className="p-4 mx-6 mt-4 rounded-2xl text-xs font-semibold flex items-center gap-2 bg-slate-50 border">
                        {feedback.error ? (
                          <div className="text-rose-700 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{feedback.error}</span>
                          </div>
                        ) : (
                          <div className="text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{feedback.success}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Questions Form / Preview */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Verification Questions ({req.questions.length})
                        </h4>

                        <div className="space-y-4">
                          {req.questions.map((q, idx) => {
                            const currentValue = answersState[req.id]?.[q.id] ?? (q.answerText || '');

                            return (
                              <div key={q.id} className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-2">
                                <label className="block text-xs font-bold text-slate-800">
                                  <span className="text-purple-600 font-extrabold mr-1.5">Q{idx + 1}.</span>
                                  {q.questionText}
                                </label>

                                {canEdit ? (
                                  <textarea
                                    rows={2}
                                    value={currentValue}
                                    onChange={(e) => handleAnswerChange(req.id, q.id, e.target.value)}
                                    placeholder="Provide detailed description, color shade, unique scratch marks, serial numbers, or internal contents..."
                                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                                  />
                                ) : (
                                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-medium italic">
                                    {q.answerText || <span className="text-slate-400 not-italic">No answer recorded.</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Button */}
                      {canEdit && (
                        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleSubmit(req)}
                            disabled={submittingId === req.id}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            {submittingId === req.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Submitting Proof...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Submit Proof Answers
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
