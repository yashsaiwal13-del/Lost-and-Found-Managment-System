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
  Sparkles, 
  Check, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon } from '@/components/ui/Icon';
import { 
  getMyVerificationRequests, 
  submitVerificationAnswers, 
  VerificationRequestData 
} from '@/app/actions/verification';
import { getCurrentUser } from '@/app/actions/auth';

export default function StudentVerificationPage() {
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
      (data || []).forEach((req) => {
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
          <span className="status ready">
            <i></i> Verified &amp; Accepted
          </span>
        );
      case 'ANSWERED':
        return (
          <span className="status review">
            <i></i> Answers Under Review
          </span>
        );
      case 'CLARIFICATION_REQUESTED':
        return (
          <span className="status searching">
            <i></i> Clarification Requested
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status searching">
            <i></i> Verification Unsuccessful
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="status match">
            <i></i> Action Required: Answer Questions
          </span>
        );
    }
  };

  return (
    <div className="app">
      <Header />

      <main className="dashboard-page section-shell" style={{ paddingBottom: '90px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '28px' }}>
          <Link
            href="/dashboard"
            className="back-link"
            style={{ marginBottom: '16px', display: 'inline-flex' }}
          >
            <Icon name="arrow" size={16} /> Back to dashboard
          </Link>

          <div className="dashboard-heading" style={{ marginBottom: 0 }}>
            <div>
              <span className="section-kicker">Proof of ownership queue</span>
              <h1>My Verification Inquiries</h1>
              <p>Answer specific proof questions sent by Campus Safety to verify your ownership.</p>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              className="button button-quiet"
              style={{ minHeight: '40px', fontSize: '12px' }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Inquiries
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <div
          style={{
            padding: '18px 22px',
            marginBottom: '28px',
            borderRadius: '16px',
            background: 'var(--navy)',
            color: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(246,237,223,.1)', display: 'grid', placeItems: 'center', color: '#d4ae68', flexShrink: 0 }}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '13px', color: 'var(--paper)' }}>
              How Ownership Verification Works
            </strong>
            <span style={{ fontSize: '11px', color: 'rgba(246,237,223,.65)', lineHeight: 1.5 }}>
              Security cross-examines your confidential answers (color details, unique markings, internal items) against the held property before clearing physical handover.
            </span>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="recent-empty">
            <RefreshCw className="h-8 w-8 animate-spin" style={{ color: 'var(--purple)', margin: '0 auto 10px' }} />
            <p>Loading your verification inquiries...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="recent-empty" style={{ padding: '60px 20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--teal-soft)', color: 'var(--teal)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 style={{ font: '800 20px "Manrope"', color: 'var(--navy)', margin: '0 0 6px' }}>No Pending Inquiries</h2>
            <p style={{ margin: 0, fontSize: '12px' }}>
              You have no active verification questionnaires awaiting your response.
            </p>
            <Link href="/dashboard" className="button button-quiet" style={{ marginTop: '18px', minHeight: '38px', fontSize: '11px', display: 'inline-flex' }}>
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {requests.map((req) => {
              const canEdit = req.status === 'PENDING' || req.status === 'CLARIFICATION_REQUESTED';

              return (
                <div
                  key={req.id}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid var(--line)',
                      background: '#f8f4ee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="type-badge found">{req.item.category}</span>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>
                          Ref #{req.item.id} · Found at {req.item.location}
                        </span>
                      </div>
                      <h3 style={{ font: '800 18px "Manrope"', color: 'var(--navy)', margin: 0 }}>
                        {req.item.name}
                      </h3>
                      {req.item.storageLocation && (
                        <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                          Locker Storage: {req.item.storageLocation}
                        </span>
                      )}
                    </div>

                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {req.adminNotes && (
                    <div
                      style={{
                        padding: '12px 24px',
                        background: 'var(--coral-soft)',
                        borderBottom: '1px solid var(--line)',
                        fontSize: '11px',
                        color: 'var(--coral)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                      }}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span><strong>Officer Note:</strong> {req.adminNotes}</span>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {feedback?.id === req.id && (
                    <div
                      style={{
                        margin: '16px 24px 0',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: feedback.error ? 'var(--coral-soft)' : 'var(--teal-soft)',
                        color: feedback.error ? 'var(--coral)' : 'var(--teal)',
                      }}
                    >
                      {feedback.error ? feedback.error : feedback.success}
                    </div>
                  )}

                  {/* Questions List */}
                  <div style={{ padding: '24px', display: 'grid', gap: '18px' }}>
                    {req.questions.map((q, idx) => {
                      const currentValue = answersState[req.id]?.[q.id] ?? (q.answerText || '');

                      return (
                        <div
                          key={q.id}
                          style={{
                            background: '#f8f4ee',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--line)',
                          }}
                        >
                          <label
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              fontWeight: 800,
                              color: 'var(--navy)',
                              marginBottom: '8px',
                            }}
                          >
                            <span style={{ color: 'var(--purple)', marginRight: '6px' }}>Q{idx + 1}.</span>
                            {q.questionText}
                          </label>

                          {canEdit ? (
                            <textarea
                              rows={2}
                              value={currentValue}
                              onChange={(e) => handleAnswerChange(req.id, q.id, e.target.value)}
                              placeholder="Provide identifying color, unique scratches, engravings, internal contents..."
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--line)',
                                background: 'var(--paper)',
                                fontSize: '11px',
                                outline: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'var(--paper)',
                                border: '1px solid var(--line)',
                                fontSize: '11px',
                                color: 'var(--ink)',
                                fontStyle: 'italic',
                              }}
                            >
                              {q.answerText || 'No answer recorded.'}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {canEdit && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                        <button
                          type="button"
                          onClick={() => handleSubmit(req)}
                          disabled={submittingId === req.id}
                          className="button button-found"
                        >
                          <Send className="h-4 w-4" />
                          {submittingId === req.id ? 'Submitting Proof...' : 'Submit Proof Answers'}
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

      <Footer />
    </div>
  );
}
