'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  ShieldCheck, 
  Package, 
  ExternalLink, 
  ZoomIn, 
  ArrowRight,
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';
import type { StudentMatchedItem } from '@/app/actions/matching';
import { studentAcceptMatch, studentRejectMatch, studentClaimItem } from '@/app/actions/matching';

interface ConnectionReviewModalProps {
  isOpen: boolean;
  match: StudentMatchedItem | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

function getItemIcon(category: string, name: string): IconName {
  const lower = `${name} ${category}`.toLowerCase();
  if (lower.includes('headphone') || lower.includes('airpod') || lower.includes('audio') || lower.includes('earbud')) return 'headphones';
  if (lower.includes('wallet') || lower.includes('purse') || lower.includes('card')) return 'wallet';
  if (lower.includes('bottle') || lower.includes('flask') || lower.includes('mug')) return 'bottle';
  if (lower.includes('phone') || lower.includes('iphone') || lower.includes('mobile')) return 'phone';
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('tote')) return 'bag';
  if (lower.includes('key')) return 'key';
  if (lower.includes('laptop') || lower.includes('macbook')) return 'laptop';
  return 'sparkle';
}

export function ConnectionReviewModal({
  isOpen,
  match,
  onClose,
  onStatusUpdated,
}: ConnectionReviewModalProps) {
  const [submittingAction, setSubmittingAction] = useState<'accept' | 'reject' | 'claim' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Full Image Modal State
  const [fullImage, setFullImage] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  if (!isOpen || !match) return null;

  const isAccepted = match.returnStatus === 'ARRANGED' || match.returnStatus === 'CONFIRMED';
  const isClaimed = match.returnStatus === 'CONFIRMED' || match.lostItem.status === 'RESOLVED';

  const handleAccept = async () => {
    setSubmittingAction('accept');
    setFeedback(null);
    try {
      const res = await studentAcceptMatch(match.id);
      if (res.success) {
        setFeedback({ success: 'Match accepted! You can now visit the security desk or collect your item.' });
        onStatusUpdated();
      } else {
        setFeedback({ error: res.error || 'Failed to accept match.' });
      }
    } catch (err: any) {
      setFeedback({ error: err.message || 'Error accepting match.' });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleReject = async () => {
    setSubmittingAction('reject');
    setFeedback(null);
    try {
      const res = await studentRejectMatch(match.id, rejectReason.trim() || undefined);
      if (res.success) {
        setFeedback({ success: 'Connection dismissed. We will keep searching for your item.' });
        setTimeout(() => {
          onStatusUpdated();
          onClose();
        }, 1200);
      } else {
        setFeedback({ error: res.error || 'Failed to reject match.' });
      }
    } catch (err: any) {
      setFeedback({ error: err.message || 'Error rejecting match.' });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleClaim = async () => {
    setSubmittingAction('claim');
    setFeedback(null);
    try {
      const res = await studentClaimItem(match.id);
      if (res.success) {
        setFeedback({ success: 'Item marked as Claimed & Collected! Report is now officially resolved.' });
        onStatusUpdated();
      } else {
        setFeedback({ error: res.error || 'Failed to confirm item claim.' });
      }
    } catch (err: any) {
      setFeedback({ error: err.message || 'Error confirming item claim.' });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9990,
          background: 'rgba(29, 21, 26, .75)',
          backdropFilter: 'blur(6px)',
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--paper)',
            borderRadius: '24px',
            border: '1px solid var(--line)',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
            position: 'relative',
          }}
        >
          {/* Top Banner Header */}
          <div
            style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--navy)',
              color: 'var(--paper)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="match-kicker" style={{ color: '#d4ae68' }}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Campus Security Connection Request
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '99px',
                    background: 'rgba(255,255,255,0.15)',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {Math.round(match.similarityScore * 100)}% Confidence
                </span>
              </div>
              <h2
                style={{
                  font: '800 20px "Manrope", sans-serif',
                  color: 'var(--paper)',
                  margin: '4px 0 0',
                }}
              >
                Review Found Item Connection
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close review"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                color: 'var(--paper)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
            
            {/* Feedback Message */}
            {feedback && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: feedback.error ? 'var(--coral-soft)' : 'var(--teal-soft)',
                  color: feedback.error ? 'var(--coral)' : 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {feedback.error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>{feedback.error || feedback.success}</span>
              </div>
            )}

            {/* Admin Note if Present */}
            {match.adminNote && (
              <div
                style={{
                  padding: '12px 18px',
                  background: 'var(--coral-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: 'var(--coral)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>Campus Safety Note:</strong> {match.adminNote}
                </div>
              </div>
            )}

            {/* Side-by-Side Comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              {/* Left: Your Lost Report */}
              <div
                style={{
                  background: '#f8f4ee',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className="type-badge lost">Your Lost Report</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--coral)' }}>
                    Ref #{match.lostItem.id}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  {match.lostItem.image ? (
                    <div
                      onClick={() =>
                        setFullImage({
                          url: match.lostItem.image!,
                          title: match.lostItem.name,
                          subtitle: `Your Lost Report · Ref #${match.lostItem.id}`,
                        })
                      }
                      title="Click to examine full image"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid var(--line)',
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={match.lostItem.image}
                        alt={match.lostItem.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.25)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--coral)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={getItemIcon(match.lostItem.category, match.lostItem.name)} size={36} />
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                      {match.lostItem.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                      {match.lostItem.category}
                    </span>
                  </div>
                </div>

                <dl style={{ margin: 0, display: 'grid', gap: '10px', fontSize: '11px' }}>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Location Lost
                    </dt>
                    <dd style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--navy)' }}>
                      {match.lostItem.location}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Date &amp; Time
                    </dt>
                    <dd style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--navy)' }}>
                      {new Date(match.lostItem.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {match.lostItem.time ? ` at ${match.lostItem.time}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Your Description
                    </dt>
                    <dd style={{ margin: '2px 0 0', color: 'var(--ink)', lineHeight: 1.5 }}>
                      {match.lostItem.description || 'No description provided.'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Right: Found Product Details Posted by Finder */}
              <div
                style={{
                  background: '#f8f4ee',
                  border: '2px solid var(--teal)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(45, 157, 134, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className="type-badge found">Found Item Details (Posted)</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--teal)' }}>
                    Ref #{match.foundItem.id}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  {match.foundItem.image ? (
                    <div
                      onClick={() =>
                        setFullImage({
                          url: match.foundItem.image!,
                          title: match.foundItem.title,
                          subtitle: `Found Item Discovery · Ref #${match.foundItem.id}`,
                        })
                      }
                      title="Click to examine full image"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid var(--line)',
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={match.foundItem.image}
                        alt={match.foundItem.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.25)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--teal)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={getItemIcon(match.foundItem.category, match.foundItem.title)} size={36} />
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                      {match.foundItem.title}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 700 }}>
                      {match.foundItem.category}
                    </span>
                    {match.foundItem.image && (
                      <button
                        type="button"
                        onClick={() =>
                          setFullImage({
                            url: match.foundItem.image!,
                            title: match.foundItem.title,
                            subtitle: `Found Item Discovery · Ref #${match.foundItem.id}`,
                          })
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: 0,
                          background: 'none',
                          color: 'var(--purple)',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          marginTop: '4px',
                        }}
                      >
                        <ZoomIn className="h-3 w-3" /> Examine Full Image
                      </button>
                    )}
                  </div>
                </div>

                <dl style={{ margin: 0, display: 'grid', gap: '10px', fontSize: '11px' }}>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Discovery Location
                    </dt>
                    <dd style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--navy)' }}>
                      {match.foundItem.reportedLocation}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Date &amp; Time Found
                    </dt>
                    <dd style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--navy)' }}>
                      {new Date(match.foundItem.reportedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {match.foundItem.time ? ` at ${match.foundItem.time}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Custody Locker / Desk Spot
                    </dt>
                    <dd style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--teal)' }}>
                      {match.foundItem.collectionPoint || 'Main Campus Security Locker #102'}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                      Finder Description &amp; Details
                    </dt>
                    <dd
                      style={{
                        margin: '2px 0 0',
                        color: 'var(--ink)',
                        lineHeight: 1.5,
                        background: 'var(--paper)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {match.foundItem.description || 'No additional finder details.'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Collection / Claimed Status Section */}
            {isAccepted && (
              <div
                style={{
                  background: isClaimed ? 'var(--teal-soft)' : 'var(--paper)',
                  border: '1.5px solid var(--teal)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal)', fontWeight: 800, fontSize: '13px' }}>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>
                    {isClaimed
                      ? 'Item Officially Claimed & Handover Complete'
                      : 'Connection Accepted! Ready for Collection'}
                  </span>
                </div>

                <p style={{ margin: '8px 0 14px', fontSize: '12px', color: 'var(--ink)', lineHeight: 1.6 }}>
                  {isClaimed
                    ? 'You have confirmed the physical collection and claim of this item. Both your lost report and the found registry entry are permanently marked as RESOLVED.'
                    : `Please visit ${match.foundItem.collectionPoint || 'the Campus Safety Desk'} with your Student ID card to collect your item. Once you receive the item, click "Claimed Product" below so Campus Security knows the handover is complete.`}
                </p>

                {!isClaimed && (
                  <button
                    type="button"
                    disabled={submittingAction === 'claim'}
                    onClick={handleClaim}
                    className="button button-found"
                    style={{ minHeight: '42px', fontSize: '12px', padding: '0 20px' }}
                  >
                    <Check className="h-4 w-4" />
                    {submittingAction === 'claim' ? 'Recording Claim...' : 'Claimed Product (I Have Collected My Item)'}
                  </button>
                )}
              </div>
            )}

            {/* Reject Form (Optional notes before rejecting) */}
            {showRejectForm && (
              <div
                style={{
                  background: 'var(--coral-soft)',
                  border: '1px solid var(--coral)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <h4 style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--coral)', fontWeight: 800 }}>
                  Reject Connection
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: '11px', color: 'var(--ink)' }}>
                  Are you sure this is not your item? Please tell us why so we can refine future search matches:
                </p>
                <input
                  type="text"
                  placeholder="e.g. Different color/model, wrong stickers..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--paper)',
                    fontSize: '11px',
                    outline: 0,
                    marginBottom: '10px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="button button-ghost"
                    style={{ minHeight: '32px', fontSize: '11px' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submittingAction === 'reject'}
                    onClick={handleReject}
                    className="button"
                    style={{ background: '#be4b5e', color: 'white', minHeight: '32px', fontSize: '11px' }}
                  >
                    {submittingAction === 'reject' ? 'Rejecting...' : 'Confirm Reject ("Not Mine")'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Action Footer */}
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--line)',
              background: '#f8f4ee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="button button-ghost"
              style={{ minHeight: '40px', fontSize: '12px' }}
            >
              Close
            </button>

            {!isAccepted && !showRejectForm && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="button button-ghost"
                  style={{ minHeight: '40px', fontSize: '12px', color: '#be4b5e' }}
                >
                  <X className="h-4 w-4" /> Reject (Not Mine)
                </button>
                <button
                  type="button"
                  disabled={submittingAction === 'accept'}
                  onClick={handleAccept}
                  className="button button-found"
                  style={{ minHeight: '40px', fontSize: '12px', padding: '0 22px' }}
                >
                  <Check className="h-4 w-4" />
                  {submittingAction === 'accept' ? 'Accepting...' : 'Accept Match (This Is Mine)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Viewer Lightbox */}
      <ImageViewerModal
        isOpen={!!fullImage}
        imageUrl={fullImage?.url || null}
        title={fullImage?.title}
        subtitle={fullImage?.subtitle}
        onClose={() => setFullImage(null)}
      />
    </>
  );
}
