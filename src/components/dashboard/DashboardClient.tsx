'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { StudentReport } from '@/types';
import type { StudentMatchedItem } from '@/app/actions/matching';
import { ConnectionReviewModal } from '@/components/dashboard/ConnectionReviewModal';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
    role?: string;
  };
  reports: StudentReport[];
  matchedItems: StudentMatchedItem[];
}

function getItemIcon(category: string, name: string): IconName {
  const lower = `${name} ${category}`.toLowerCase();
  if (lower.includes('headphone') || lower.includes('airpod') || lower.includes('audio') || lower.includes('earbud') || lower.includes('sound')) {
    return 'headphones';
  }
  if (lower.includes('wallet') || lower.includes('purse') || lower.includes('card') || lower.includes('id')) {
    return 'wallet';
  }
  if (lower.includes('bottle') || lower.includes('flask') || lower.includes('mug') || lower.includes('cup') || lower.includes('tumbler')) {
    return 'bottle';
  }
  if (lower.includes('phone') || lower.includes('iphone') || lower.includes('mobile') || lower.includes('android')) {
    return 'phone';
  }
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('tote') || lower.includes('pouch')) {
    return 'bag';
  }
  if (lower.includes('key')) {
    return 'key';
  }
  if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('computer') || lower.includes('ipad') || lower.includes('tablet')) {
    return 'laptop';
  }
  return 'sparkle';
}

function getStatusDetails(report: StudentReport): { label: string; classKey: string } {
  if (report.status === 'resolved') {
    return { label: 'Returned', classKey: 'returned' };
  }
  if (report.connectedMatch?.returnStatus === 'ARRANGED' || report.connectedMatch?.returnStatus === 'CONFIRMED') {
    return { label: 'Ready for Collection', classKey: 'ready' };
  }
  if (report.matchesCount > 0 || report.connectedMatch) {
    return { label: 'Connection Ready', classKey: 'match' };
  }
  if (report.status === 'pending_verification' || report.hasPendingVerification) {
    return { label: 'Under Review', classKey: 'review' };
  }
  return { label: 'Searching', classKey: 'searching' };
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0] || 'there';
  if (hour < 12) return `Good morning, ${firstName}.`;
  if (hour < 18) return `Good afternoon, ${firstName}.`;
  return `Good evening, ${firstName}.`;
}

export default function DashboardClient({
  user,
  reports: initialReports,
  matchedItems: initialMatchedItems,
}: DashboardClientProps) {
  const [reports, setReports] = useState<StudentReport[]>(initialReports);
  const [matchedItems, setMatchedItems] = useState<StudentMatchedItem[]>(initialMatchedItems);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found' | 'resolved'>('all');
  
  // Active Match to Review in Modal
  const [reviewMatch, setReviewMatch] = useState<StudentMatchedItem | null>(null);

  // Real Metric Calculations
  const activeLostCount = reports.filter(
    (r) => r.type === 'lost' && r.status !== 'resolved'
  ).length;
  const foundCount = reports.filter((r) => r.type === 'found').length;
  const potentialMatchesCount = matchedItems.length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  // Real Top Confirmed Match for the Banner
  const topMatch = matchedItems.length > 0
    ? matchedItems.reduce((prev, curr) => (curr.similarityScore > prev.similarityScore ? curr : prev), matchedItems[0])
    : null;

  // Filtered Reports
  const filteredReports = reports.filter((r) => {
    if (filter === 'lost') return r.type === 'lost';
    if (filter === 'found') return r.type === 'found';
    if (filter === 'resolved') return r.status === 'resolved';
    return true;
  });

  const handleRefreshData = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      <Header />

      <main className="dashboard-page section-shell">
        {/* 1. Greeting Header */}
        <div className="dashboard-heading">
          <div>
            <span className="section-kicker">Student dashboard</span>
            <h1>{getGreeting(user.name)}</h1>
            <p>Here’s what’s happening with your campus reports.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/report-lost" className="button button-lost">
              <Icon name="plus" size={18} /> Report Lost
            </Link>
            <Link href="/report-found" className="button button-found">
              <Icon name="plus" size={18} /> Report Found
            </Link>
          </div>
        </div>

        {/* 2. Potential Match Banner (Admin-Confirmed Connection Ready for Student Review) */}
        {topMatch ? (
          <section className="potential-match">
            <div className="match-copy">
              <span className="match-kicker">
                <Icon name="sparkle" size={15} /> Campus Security Connection Request
              </span>
              <h2>We may have found your {topMatch.lostItem.name}.</h2>
              <p>
                A similar item was registered at {topMatch.foundItem.reportedLocation || 'campus'}. Campus Safety connected this report for your review.
              </p>
              <div className="match-meta">
                <span>
                  <Icon name="location" size={17} />
                  <small>Found at</small>
                  <strong>{topMatch.foundItem.reportedLocation}</strong>
                </span>
                <span>
                  <Icon name="clock" size={17} />
                  <small>Status</small>
                  <strong>
                    {topMatch.returnStatus === 'ARRANGED'
                      ? 'Ready for Collection'
                      : topMatch.returnStatus === 'CONFIRMED'
                      ? 'Handover Completed'
                      : 'Connection Awaiting Your Review'}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReviewMatch(topMatch)}
                className="button button-light"
                style={{ cursor: 'pointer' }}
              >
                Review Connection <Icon name="arrow" size={18} />
              </button>
            </div>
            <div className="match-visual">
              <div className="match-item lost">
                <small>Your report</small>
                <span>
                  <Icon name={getItemIcon(topMatch.lostItem.category, topMatch.lostItem.name)} size={35} />
                </span>
                <strong>
                  {topMatch.lostItem.name}
                </strong>
              </div>
              <div className="match-score">
                <Icon name="link" size={19} />
                <strong>{Math.round(topMatch.similarityScore * 100)}%</strong>
                <small>match</small>
              </div>
              <div className="match-item found">
                <small>Found report</small>
                <span>
                  <Icon name={getItemIcon(topMatch.foundItem.category, topMatch.foundItem.title)} size={35} />
                </span>
                <strong>
                  {topMatch.foundItem.title}
                </strong>
              </div>
            </div>
          </section>
        ) : null}

        {/* 3. Metric Cards Grid */}
        <section className="metric-grid">
          <article
            className={`metric-card coral ${filter === 'lost' ? 'active' : ''}`}
            onClick={() => setFilter(filter === 'lost' ? 'all' : 'lost')}
            style={{ cursor: 'pointer' }}
          >
            <span>
              <Icon name="search" size={21} />
            </span>
            <div>
              <strong>{activeLostCount}</strong>
              <small>Active Lost Reports</small>
            </div>
          </article>

          <article
            className={`metric-card teal ${filter === 'found' ? 'active' : ''}`}
            onClick={() => setFilter(filter === 'found' ? 'all' : 'found')}
            style={{ cursor: 'pointer' }}
          >
            <span>
              <Icon name="plus" size={21} />
            </span>
            <div>
              <strong>{foundCount}</strong>
              <small>Found Reports</small>
            </div>
          </article>

          <article
            className="metric-card violet"
            onClick={() => setFilter('all')}
            style={{ cursor: 'pointer' }}
          >
            <span>
              <Icon name="sparkle" size={21} />
            </span>
            <div>
              <strong>{potentialMatchesCount}</strong>
              <small>Potential Matches</small>
            </div>
          </article>

          <Link
            href="/dashboard/collected"
            className="metric-card blue"
            style={{ textDecoration: 'none' }}
          >
            <span>
              <Icon name="check" size={21} />
            </span>
            <div>
              <strong>{resolvedCount}</strong>
              <small>Resolved Items</small>
            </div>
          </Link>
        </section>

        {/* 4. Reports Table */}
        <section className="reports-section">
          <div className="section-row">
            <div>
              <h2>My reports ({filteredReports.length})</h2>
              <p>Track status and real-time security verification across all your submissions.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'lost', 'found', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: '1px solid var(--line)',
                    background: filter === f ? 'var(--navy)' : 'var(--paper)',
                    color: filter === f ? 'var(--paper)' : 'var(--muted)',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="report-table">
            <div className="table-head">
              <span>Item</span>
              <span>Type</span>
              <span>Location &amp; date</span>
              <span>Status</span>
              <span />
            </div>

            {filteredReports.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '13px',
                }}
              >
                <p style={{ margin: '0 0 12px' }}>
                  {filter === 'all'
                    ? "You haven't submitted any lost or found reports yet."
                    : `No ${filter} reports found.`}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Link href="/report-lost" className="button button-lost" style={{ minHeight: '40px', fontSize: '12px' }}>
                    Report a Lost Item
                  </Link>
                  <Link href="/report-found" className="button button-found" style={{ minHeight: '40px', fontSize: '12px' }}>
                    Register a Found Item
                  </Link>
                </div>
              </div>
            ) : (
              filteredReports.map((report) => {
                const status = getStatusDetails(report);
                const icon = getItemIcon(report.category, report.title);
                const isLost = report.type === 'lost';

                return (
                  <article className="report-row" key={report.id}>
                    <div className="report-item">
                      <span>
                        <Icon name={icon} size={22} />
                      </span>
                      <div>
                        <strong>{report.title}</strong>
                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: '10px', marginTop: '2px' }}>
                          {report.category}
                        </small>
                      </div>
                    </div>

                    <span className={`type-badge ${isLost ? 'lost' : 'found'}`}>
                      {isLost ? 'Lost' : 'Found'}
                    </span>

                    <div className="report-location">
                      <strong>{report.location}</strong>
                      <small>{report.dateReported}</small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`status ${status.classKey}`}>
                        <i />
                        {status.label}
                      </span>

                      {report.connectedMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            const foundMatchItem = matchedItems.find((m) => m.id === report.connectedMatch?.matchId);
                            if (foundMatchItem) {
                              setReviewMatch(foundMatchItem);
                            }
                          }}
                          className="button button-found"
                          style={{ minHeight: '30px', padding: '0 10px', fontSize: '10px' }}
                        >
                          Review Match
                        </button>
                      )}
                    </div>

                    <Link
                      href={`/items/${report.id}`}
                      aria-label={`View details for ${report.title}`}
                      style={{
                        color: 'var(--muted)',
                        display: 'grid',
                        placeItems: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon name="chevron" size={18} />
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Student Connection Review Modal */}
      <ConnectionReviewModal
        isOpen={!!reviewMatch}
        match={reviewMatch}
        onClose={() => setReviewMatch(null)}
        onStatusUpdated={handleRefreshData}
      />
    </div>
  );
}
