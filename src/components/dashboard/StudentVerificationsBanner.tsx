'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  X, 
  PackageCheck, 
  MessageSquare, 
  Sparkles, 
  ArrowRight,
  Package
} from 'lucide-react';
import { 
  getMyVerificationRequests, 
  submitVerificationAnswers, 
  VerificationRequestData 
} from '@/app/actions/verification';

export default function StudentVerificationsBanner() {
  const [requests, setRequests] = useState<VerificationRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalRequest, setActiveModalRequest] = useState<VerificationRequestData | null>(null);
  const [answersInput, setAnswersInput] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const data = await getMyVerificationRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load verification requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const openAnswerModal = (req: VerificationRequestData) => {
    const initial: Record<string, string> = {};
    req.questions.forEach((q) => {
      initial[q.id] = q.answerText || '';
    });
    setAnswersInput(initial);
    setActiveModalRequest(req);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswersInput((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleSubmitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalRequest) return;

    const payload = activeModalRequest.questions.map((q) => ({
      questionId: q.id,
      answerText: (answersInput[q.id] || '').trim(),
    }));

    const hasEmpty = payload.some((a) => !a.answerText);
    if (hasEmpty) {
      setSubmitError('Please provide an answer for each question before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const res = await submitVerificationAnswers(activeModalRequest.id, payload);

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit verification answers.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setActiveModalRequest(null);
        fetchVerifications();
      }, 1200);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit answers.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || requests.length === 0) {
    return null;
  }

  const pendingAction = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'CLARIFICATION_REQUESTED'
  );

  return (
    <div className="space-y-4">
      {/* 1. Critical Alert: Questions Awaiting Response */}
      {pendingAction.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-purple-200">
                <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
                Action Required: {pendingAction.length} Verification Inquir{pendingAction.length > 1 ? 'ies' : 'y'}
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Campus Security requested proof of ownership!
              </h3>
              <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                Please answer the custom questions sent by security to confirm ownership and authorize custody release.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link
                href="/dashboard/verification"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
              >
                <span>View &amp; Answer Inquiries</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal for fast answering from banner */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-purple-400" />
                  Verification Inquiry
                </h3>
                <p className="text-xs text-slate-400">
                  Item: <span className="text-white font-medium">{activeModalRequest.item.name}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveModalRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAnswers} className="p-6 overflow-y-auto space-y-4 flex-1">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Your answers have been submitted for administrator review!</span>
                </div>
              )}

              <div className="space-y-4">
                {activeModalRequest.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Question {idx + 1}: <span className="font-normal text-slate-600">{q.questionText}</span>
                    </label>
                    <textarea
                      rows={2}
                      value={answersInput[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Provide specific details only the genuine owner would know..."
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || submitSuccess}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit Answers
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
