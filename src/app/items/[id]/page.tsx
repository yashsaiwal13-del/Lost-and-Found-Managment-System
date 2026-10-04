'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Lock, 
  Sparkles, 
  Info,
  Check,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';
import { getCurrentUser } from '@/app/actions/auth';
import { CampusItem } from '@/types';
import { submitOwnershipClaim } from '@/app/actions/claims';
import { getCampusItemById } from '@/app/actions/getItems';

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

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = (params?.id as string) || '';

  const [item, setItem] = useState<CampusItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fullImage, setFullImage] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        setCurrentUser(u);
        setClaimData((prev) => ({
          ...prev,
          studentName: u.name || '',
          studentId: u.studentId || '',
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (!itemId) return;
    let isMounted = true;
    getCampusItemById(itemId)
      .then((data) => {
        if (isMounted && data) {
          setItem(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load item:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  // Claim Form State
  const [showClaimForm, setShowClaimForm] = useState(true);
  const [claimData, setClaimData] = useState({
    exactColor: '',
    uniqueMark: '',
    lastSeenLocation: '',
    studentName: '',
    studentId: '',
  });

  const [claimErrors, setClaimErrors] = useState<{
    exactColor?: string;
    uniqueMark?: string;
    lastSeenLocation?: string;
    server?: string;
  }>({});

  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [generatedClaimId, setGeneratedClaimId] = useState('');

  // Claim Form Validation
  const validateClaim = (): boolean => {
    const errors: typeof claimErrors = {};

    if (!claimData.exactColor.trim()) {
      errors.exactColor = 'Please specify the exact color or shade.';
    }
    if (!claimData.uniqueMark.trim()) {
      errors.uniqueMark = 'Please describe at least one unique identifying mark or detail.';
    } else if (claimData.uniqueMark.trim().length < 5) {
      errors.uniqueMark = 'Please provide a more descriptive detail (at least 5 characters).';
    }
    if (!claimData.lastSeenLocation.trim()) {
      errors.lastSeenLocation = 'Please mention where you last saw or remember having it.';
    }

    setClaimErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateClaim()) {
      return;
    }

    setIsSubmittingClaim(true);
    setClaimErrors({});

    try {
      const res = await submitOwnershipClaim({
        itemId: item ? item.id : itemId,
        color: claimData.exactColor,
        uniqueMark: claimData.uniqueMark,
        lastSeenLocation: claimData.lastSeenLocation,
      });

      if (res.success && res.claimId) {
        setGeneratedClaimId(res.claimId);
        setClaimSuccess(true);
      } else {
        setClaimErrors({ server: res.error || 'Could not submit claim. Please try again.' });
      }
    } catch (err: any) {
      console.error(err);
      setClaimErrors({ server: err?.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="dashboard-page section-shell" style={{ textAlign: 'center', padding: '120px 20px' }}>
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: 'var(--purple)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Retrieving item from campus database...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // If item not found
  if (!item) {
    return (
      <div className="app">
        <Header />
        <main className="dashboard-page section-shell" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="recent-empty" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <AlertCircle className="h-10 w-10" style={{ color: 'var(--coral)', margin: '0 auto 10px' }} />
            <h1 style={{ font: '800 24px "Manrope"', color: 'var(--navy)', margin: '0 0 8px' }}>Item Not Found</h1>
            <p style={{ margin: 0, fontSize: '12px' }}>
              No item matching reference code &quot;{itemId}&quot; exists in the campus lost &amp; found registry.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Link href="/browse" className="button button-found">
                Browse Registry
              </Link>
              <Link href="/" className="button button-ghost">
                Return Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const iconName = getItemIcon(item.category, item.title);

  return (
    <div className="app">
      <Header />

      <main className="dashboard-page section-shell" style={{ paddingBottom: '90px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href={currentUser?.role === 'ADMIN' || currentUser?.role === 'SECURITY' ? '/browse' : '/dashboard'}
            className="back-link"
            style={{ marginBottom: '14px', display: 'inline-flex' }}
          >
            <Icon name="arrow" size={16} />
            {currentUser?.role === 'ADMIN' || currentUser?.role === 'SECURITY' ? 'Back to Registry' : 'Back to Dashboard'}
          </Link>
        </div>

        {/* 2-Column Presentation Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
          
          {/* Col 1: Main Item Card & Claim Form */}
          <div style={{ display: 'grid', gap: '24px' }}>
            
            {/* Main Item Presentation Card */}
            <article className="recent-card mint" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="recent-art"
                style={{
                  height: '240px',
                  position: 'relative',
                  cursor: item.image ? 'pointer' : 'default',
                  background: item.image ? '#1d151a' : undefined,
                }}
                onClick={() => {
                  if (item.image) {
                    setFullImage({
                      url: item.image,
                      title: item.title,
                      subtitle: `Ref #${item.id} · ${item.category} · Found at ${item.location}`,
                    });
                  }
                }}
              >
                <span className="recent-pill" style={{ zIndex: 2 }}>Ref #{item.id} · Found Item</span>
                {item.image ? (
                  <>
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: '16px',
                        bottom: '16px',
                        background: 'rgba(0,0,0,0.65)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2,
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Click to Examine Full Image</span>
                    </div>
                  </>
                ) : (
                  <Icon name={iconName} size={84} />
                )}
              </div>

              <div style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <span className="type-badge found">{item.category}</span>
                    <h1 style={{ margin: '8px 0 0', font: '800 26px "Manrope"', color: 'var(--navy)', letterSpacing: '-.8px' }}>
                      {item.title}
                    </h1>
                  </div>

                  <span className="status ready">
                    <i></i>
                    In Custody Locker
                  </span>
                </div>

                <div style={{ background: '#f1e6d7', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '20px 0' }}>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Discovery Spot</span>
                    <strong style={{ display: 'block', color: 'var(--navy)', marginTop: '2px', fontSize: '12px' }}>{item.location}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Date Logged</span>
                    <strong style={{ display: 'block', color: 'var(--navy)', marginTop: '2px', fontSize: '12px' }}>{item.date}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Custody Location</span>
                    <strong style={{ display: 'block', color: 'var(--teal)', marginTop: '2px', fontSize: '12px' }}>{item.storageLocation || 'Campus Security Locker'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Reported by</span>
                    <strong style={{ display: 'block', color: 'var(--navy)', marginTop: '2px', fontSize: '12px' }}>{item.reportedBy?.name || 'Campus Member'}</strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Public Details &amp; Notes</span>
                  <p style={{ margin: '6px 0 0', padding: '14px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '12px', color: 'var(--ink)', fontSize: '12px', lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            </article>

            {/* OWNERSHIP CLAIM FORM CONTAINER */}
            <div id="claim-form-section">
              {claimSuccess ? (
                /* Success Screen */
                <div className="success-state" style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '40px 30px' }}>
                  <div className="success-art">
                    <span className="success-ring ring-one"></span>
                    <span className="success-ring ring-two"></span>
                    <div className="success-icon" style={{ background: 'var(--teal)', color: 'white' }}>
                      <Check className="h-6 w-6" />
                    </div>
                  </div>

                  <span className="type-badge found" style={{ margin: '0 auto 10px', display: 'table' }}>
                    Claim Received by Security
                  </span>

                  <h1>Ownership Claim Submitted!</h1>

                  <p>
                    Your verification proof answers for <strong>{item.title}</strong> have been securely dispatched to Campus Safety.
                  </p>

                  <div className="review-card" style={{ maxWidth: '420px', margin: '24px auto', textAlign: 'left' }}>
                    <dl>
                      <div>
                        <dt>Claim Reference</dt>
                        <dd style={{ color: 'var(--purple)', fontWeight: 800 }}>{generatedClaimId}</dd>
                      </div>
                      <div>
                        <dt>Claimant Account</dt>
                        <dd>{claimData.studentName} ({claimData.studentId})</dd>
                      </div>
                      <div>
                        <dt>Pick-up Spot</dt>
                        <dd>{item.storageLocation || 'Main Campus Security Desk'}</dd>
                      </div>
                      <div>
                        <dt>Review Time</dt>
                        <dd style={{ color: 'var(--teal)' }}>15 – 30 Minutes</dd>
                      </div>
                    </dl>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
                    <Link href="/dashboard" className="button button-found">
                      Track in Dashboard
                    </Link>
                    <Link href="/browse" className="button button-ghost">
                      Browse More Items
                    </Link>
                  </div>
                </div>
              ) : (
                /* 3-Question Verification Form */
                <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '32px' }}>
                  <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '20px' }}>
                    <span className="section-kicker">Confidential ownership proof</span>
                    <h2 style={{ font: '800 22px "Manrope"', color: 'var(--navy)', margin: '4px 0 2px' }}>
                      Verify &amp; Claim Item
                    </h2>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                      Answer these 3 secret questions. Answers are checked privately by Campus Security.
                    </p>
                  </div>

                  {claimErrors.server && (
                    <div style={{ padding: '12px', background: 'var(--coral-soft)', color: 'var(--coral)', borderRadius: '10px', fontSize: '11px', marginBottom: '16px', fontWeight: 700 }}>
                      {claimErrors.server}
                    </div>
                  )}

                  <form onSubmit={handleClaimSubmit} style={{ display: 'grid', gap: '18px' }}>
                    {/* Q1: Exact Color */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                        1. What is the exact color or shade? *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Matte midnight black, rose gold with bumper case..."
                        value={claimData.exactColor}
                        onChange={(e) => {
                          setClaimData({ ...claimData, exactColor: e.target.value });
                          if (claimErrors.exactColor) setClaimErrors({ ...claimErrors, exactColor: undefined });
                        }}
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 14px',
                          borderRadius: '10px',
                          border: `1px solid ${claimErrors.exactColor ? 'var(--coral)' : 'var(--line)'}`,
                          background: '#f8f4ee',
                          fontSize: '12px',
                          outline: 0
                        }}
                      />
                      {claimErrors.exactColor && (
                        <span style={{ fontSize: '10px', color: 'var(--coral)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {claimErrors.exactColor}
                        </span>
                      )}
                    </div>

                    {/* Q2: Unique Marks */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                        2. What unique marks, stickers, or scratches does it have? *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Small scratch near top right corner, sticker on back, custom lockscreen..."
                        value={claimData.uniqueMark}
                        onChange={(e) => {
                          setClaimData({ ...claimData, uniqueMark: e.target.value });
                          if (claimErrors.uniqueMark) setClaimErrors({ ...claimErrors, uniqueMark: undefined });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: `1px solid ${claimErrors.uniqueMark ? 'var(--coral)' : 'var(--line)'}`,
                          background: '#f8f4ee',
                          fontSize: '12px',
                          outline: 0
                        }}
                      />
                      {claimErrors.uniqueMark && (
                        <span style={{ fontSize: '10px', color: 'var(--coral)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {claimErrors.uniqueMark}
                        </span>
                      )}
                      <small style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                        Kept confidential. Only seen by Campus Safety officers during verification.
                      </small>
                    </div>

                    {/* Q3: Last Seen Spot */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                        3. Where did you last see or remember having it? *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2nd floor library study booth around 3:30 PM..."
                        value={claimData.lastSeenLocation}
                        onChange={(e) => {
                          setClaimData({ ...claimData, lastSeenLocation: e.target.value });
                          if (claimErrors.lastSeenLocation) setClaimErrors({ ...claimErrors, lastSeenLocation: undefined });
                        }}
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 14px',
                          borderRadius: '10px',
                          border: `1px solid ${claimErrors.lastSeenLocation ? 'var(--coral)' : 'var(--line)'}`,
                          background: '#f8f4ee',
                          fontSize: '12px',
                          outline: 0
                        }}
                      />
                      {claimErrors.lastSeenLocation && (
                        <span style={{ fontSize: '10px', color: 'var(--coral)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {claimErrors.lastSeenLocation}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingClaim}
                      className="button button-found"
                      style={{ width: '100%', marginTop: '6px' }}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {isSubmittingClaim ? 'Submitting Claim...' : 'Submit Claim to Campus Security'}
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

          {/* Col 2: Sidebar Security Info Cards */}
          <div style={{ display: 'grid', gap: '20px' }}>
            
            {/* Safe Custody Protocol Card */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--purple)', fontWeight: 800, fontSize: '12px', marginBottom: '12px' }}>
                <ShieldCheck className="h-4 w-4" />
                Security Verification Protocol
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Campus safety protects student belongings by locking found items in designated custody lockers until genuine owners submit matching proof.
              </p>
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line)', display: 'grid', gap: '8px', fontSize: '11px', color: 'var(--navy)', fontWeight: 600 }}>
                <div>• Only true owners know secret marks and identifying details.</div>
                <div>• College Student ID card required at physical handover.</div>
                <div>• Unclaimed items held safely for 90 days per policy.</div>
              </div>
            </div>

            {/* Campus Safety Desk Card */}
            <div style={{ background: 'var(--navy)', color: 'var(--paper)', borderRadius: '16px', padding: '24px' }}>
              <span className="match-kicker" style={{ color: '#d4ae68' }}>Physical Collection Spot</span>
              <h3 style={{ font: '800 18px "Manrope"', margin: '8px 0 6px', color: 'var(--paper)' }}>Main Security Desk</h3>
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(246,237,223,.65)', lineHeight: 1.5 }}>
                Visit the central security dispatch desk to collect verified items once your claim is approved.
              </p>
              <div style={{ fontSize: '11px', display: 'grid', gap: '6px', borderTop: '1px solid rgba(246,237,223,.12)', paddingTop: '14px', color: 'rgba(246,237,223,.8)' }}>
                <div><strong>Building:</strong> Administration Complex #4</div>
                <div><strong>Room:</strong> Ground Floor, Room 102</div>
                <div><strong>Hours:</strong> 7:00 AM – 9:00 PM Daily</div>
                <div><strong>Desk Phone:</strong> (555) 019-2834</div>
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />

      {/* Full Image Viewer Lightbox */}
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
