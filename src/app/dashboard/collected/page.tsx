'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon, type IconName } from '@/components/ui/Icon';
import { getMyCollectedItems, type CollectedItemEntry } from '@/app/actions/matching';

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

export default function CollectedItemsPage() {
  const [collectedItems, setCollectedItems] = useState<CollectedItemEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollectedItems = async () => {
    setLoading(true);
    try {
      const items = await getMyCollectedItems();
      setCollectedItems(items || []);
    } catch (err) {
      console.error('Error fetching collected items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectedItems();
  }, []);

  return (
    <div className="app">
      <Header />

      <main className="dashboard-page section-shell">
        {/* Breadcrumb Navigation & Header */}
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
              <span className="section-kicker">Custody handover history</span>
              <h1>My Collected Items</h1>
              <p>Official history of lost belongings successfully returned to your custody.</p>
            </div>
            <button
              type="button"
              onClick={loadCollectedItems}
              className="button button-quiet"
              style={{ minHeight: '40px', fontSize: '12px' }}
            >
              <Icon name="sparkle" size={16} /> Refresh Log
            </button>
          </div>
        </div>

        {/* Informational Security Banner */}
        <div
          style={{
            padding: '16px 20px',
            marginBottom: '28px',
            borderRadius: '14px',
            background: 'var(--teal-soft)',
            border: '1px solid rgba(168, 115, 54, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--navy)',
            fontSize: '12px',
          }}
        >
          <Icon name="shield" size={20} />
          <span>
            <strong>Verified Custody Log:</strong> Items are listed here once physical handover has been officially verified by Campus Safety.
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '13px',
              background: 'var(--paper)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
            }}
          >
            Loading your verified collected items...
          </div>
        ) : collectedItems.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '13px',
              background: 'var(--paper)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ marginBottom: '16px', display: 'inline-block' }}>
              <Icon name="check" size={32} />
            </div>
            <h3 style={{ margin: '0 0 6px', color: 'var(--navy)', fontSize: '18px', fontWeight: 800 }}>
              No Collected Items Yet
            </h3>
            <p style={{ margin: '0 0 20px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              When a matching lost item has its security handover confirmed, it will appear in your permanent return history.
            </p>
            <Link href="/dashboard" className="button button-lost">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="report-table">
            <div className="table-head">
              <span>Item</span>
              <span>Category</span>
              <span>Locations</span>
              <span>Status</span>
              <span />
            </div>

            {collectedItems.map((item) => {
              const icon = getItemIcon(item.category, item.title);

              return (
                <article className="report-row" key={item.id}>
                  <div className="report-item">
                    <span>
                      <Icon name={icon} size={22} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '10px', marginTop: '2px' }}>
                        Collected {new Date(item.confirmedAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  <span className="type-badge found">
                    {item.category}
                  </span>

                  <div className="report-location">
                    <strong>Lost: {item.lostLocation}</strong>
                    <small>Found: {item.foundLocation}</small>
                  </div>

                  <span className="status returned">
                    <i />
                    Handover Complete
                  </span>

                  <Link
                    href={`/items/${item.lostItemId}`}
                    aria-label={`View details for ${item.title}`}
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
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
