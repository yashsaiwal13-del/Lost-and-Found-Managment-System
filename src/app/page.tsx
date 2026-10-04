'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon, type IconName } from '@/components/ui/Icon';
import { getFoundItemsFromDatabase } from '@/app/actions/getFoundItems';
import type { CampusItem } from '@/types';

const feedCategories = [
  'Electronics',
  'IDs & Cards',
  'Books & Notes',
  'Keys & Access',
  'Clothing & Accessories',
  'Bags & Wallets',
  'Bottles & Containers',
  'Other',
];

function getCategoryIcon(category?: string, title?: string): IconName {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (
    cat.includes('electronic') ||
    t.includes('phone') ||
    t.includes('laptop') ||
    t.includes('airpod') ||
    t.includes('headphone')
  ) {
    if (t.includes('phone')) return 'phone';
    if (t.includes('laptop')) return 'laptop';
    return 'headphones';
  }
  if (
    cat.includes('card') ||
    cat.includes('id') ||
    cat.includes('wallet') ||
    t.includes('wallet') ||
    t.includes('card')
  ) {
    return 'wallet';
  }
  if (cat.includes('key') || t.includes('key')) {
    return 'key';
  }
  if (
    cat.includes('bottle') ||
    cat.includes('container') ||
    t.includes('bottle') ||
    t.includes('mug') ||
    t.includes('flask')
  ) {
    return 'bottle';
  }
  if (
    cat.includes('bag') ||
    t.includes('bag') ||
    t.includes('backpack') ||
    t.includes('pouch')
  ) {
    return 'bag';
  }
  if (
    cat.includes('book') ||
    cat.includes('note') ||
    t.includes('book') ||
    t.includes('notebook')
  ) {
    return 'calendar';
  }
  return 'sparkle';
}

function getTone(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('electronic') || cat.includes('book')) return 'violet';
  if (cat.includes('key') || cat.includes('clothing')) return 'amber';
  if (cat.includes('card') || cat.includes('wallet') || cat.includes('id')) return 'amber';
  return 'mint';
}

function formatRelativeTime(daysAgo?: number): string {
  if (daysAgo === undefined || daysAgo === null) return 'Recently';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}w ago`;
  return `${Math.floor(daysAgo / 30)}mo ago`;
}

function HeroIllustration() {
  return (
    <div
      className="hero-art"
      aria-label="CampusFind live item recovery journey"
    >
      <img
        className="hero-journey-image"
        src="/campusfind-item-journey.jpg"
        alt="Live item journey from reported and verified to matched and returned"
      />
      <div className="journey-animation-layer" aria-hidden="true">
        <i className="journey-pulse reported" />
        <i className="journey-pulse review" />
        <i className="journey-pulse item" />
        <i className="journey-pulse matched" />
        <i className="journey-pulse returned" />
      </div>
      <div className="recovery-ribbon">
        <span>
          <i>1</i> Reported
        </span>
        <b>
          <Icon name="arrow" size={16} />
        </b>
        <span>
          <i>2</i> Matched
        </span>
        <b>
          <Icon name="arrow" size={16} />
        </b>
        <span>
          <i>3</i> Returned
        </span>
      </div>
    </div>
  );
}

function RecentlyFoundSection({ items, loading }: { items: CampusItem[]; loading: boolean }) {
  const [filter, setFilter] = useState('All reports');
  const [query, setQuery] = useState('');

  const visible = items.filter((item) => {
    const matchCategory =
      filter === 'All reports' ||
      item.category.toLowerCase() === filter.toLowerCase() ||
      item.category.toLowerCase().includes(filter.toLowerCase()) ||
      filter.toLowerCase().includes(item.category.toLowerCase());

    const matchQuery =
      !query.trim() ||
      item.title.toLowerCase().includes(query.trim().toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.trim().toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(query.trim().toLowerCase()));

    return matchCategory && matchQuery;
  });

  const showCustomCard = filter === 'All reports' && !query.trim();

  return (
    <section className="recent-section" id="recent">
      <div className="section-shell">
        <div className="section-intro split">
          <div>
            <span className="section-kicker">The latest</span>
            <h2>Recently found on campus.</h2>
          </div>
          <p>
            From an ID card to a project model, any belonging can be reported
            here. There is no fixed item catalogue.
          </p>
        </div>

        <div className="recent-tools">
          <label className="recent-search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items found on campus…"
              aria-label="Search recently found items"
            />
          </label>
          <button
            type="button"
            className="recent-reset"
            onClick={() => {
              setFilter('All reports');
              setQuery('');
            }}
          >
            View all reports <Icon name="arrow" size={16} />
          </button>
        </div>

        <div
          className="recent-filters"
          role="group"
          aria-label="Filter found items"
        >
          {['All reports', ...feedCategories].map((category) => (
            <button
              type="button"
              key={category}
              className={filter === category ? 'active' : ''}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="recent-grid">
          {showCustomCard && (
            <article className="recent-any">
              <span>
                <Icon name="sparkle" size={22} />
              </span>
              <div>
                <small>Can’t see your item type?</small>
                <h3>Report absolutely anything.</h3>
                <p>
                  Describe it in your own words. No preset category required.
                </p>
              </div>
              <Link
                href="/report-lost"
                className="button button-light"
              >
                Create a custom report <Icon name="arrow" size={16} />
              </Link>
            </article>
          )}

          {loading ? (
            <div className="recent-empty" style={{ padding: '48px 20px' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
                Loading live items from campus registry...
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                Connecting to safe storage registry
              </p>
            </div>
          ) : (
            <>
              {visible.map((item, index) => {
                const iconName = getCategoryIcon(item.category, item.title);
                const tone = getTone(item.category);
                const timeLabel = formatRelativeTime(item.daysAgo);

                return (
                  <article
                    className={`recent-card ${tone}`}
                    key={item.id}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="recent-art">
                      <Icon name={iconName} size={52} />
                      <span className="recent-pill">Found</span>
                    </div>
                    <div className="recent-body">
                      <span className="recent-time">{timeLabel}</span>
                      <h3 title={item.title}>{item.title}</h3>
                      <p>
                        <Icon name="location" size={14} /> {item.location}
                      </p>
                      <Link
                        href={`/items/${item.id}`}
                        style={{
                          width: '100%',
                          marginTop: '15px',
                          padding: '12px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: 0,
                          borderTop: '1px solid var(--line)',
                          background: 'none',
                          color: 'var(--blue)',
                          fontSize: '11px',
                          fontWeight: 800,
                          textDecoration: 'none',
                        }}
                      >
                        This might be mine <Icon name="arrow" size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}

              {!loading && visible.length === 0 && (
                <div className="recent-empty">
                  No close matches found. Try another phrase or filter, or report your item so
                  we can look out for it.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [foundItems, setFoundItems] = useState<CampusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getFoundItemsFromDatabase()
      .then((items) => {
        if (isMounted) {
          setFoundItems(items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load found items:', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="app flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="hero section-shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>
                <Icon name="sparkle" size={14} />
              </span>{' '}
              Your campus is looking out for you
            </div>
            <h1>
              Lost on campus.
              <br />
              <em>Found by community.</em>
            </h1>
            <p>
              Report, match, and safely recover your belongings with one trusted
              place for your whole campus.
            </p>
            <div className="hero-actions">
              <Link href="/report-lost" className="button button-lost">
                <Icon name="search" size={19} /> I Lost Something
              </Link>
              <Link href="/report-found" className="button button-found">
                <Icon name="plus" size={19} /> I Found Something
              </Link>
            </div>
            <div className="trust-note">
              <span>
                <Icon name="shield" size={17} />
              </span>
              <p>
                <strong>Safe, verified handovers</strong>
                <small>Every return is managed through Campus Safety</small>
              </p>
            </div>
          </div>
          <HeroIllustration />
        </section>

        {/* 2. Trust Metrics Bar */}
        <section className="trust-bar">
          <div>
            <strong>450+</strong>
            <span>items returned</span>
          </div>
          <div>
            <strong>92%</strong>
            <span>recovery rate</span>
          </div>
          <div>
            <strong>&lt; 2 min</strong>
            <span>average report time</span>
          </div>
          <div className="trust-copy">
            <Icon name="shield" />
            <span>
              Protected by
              <br />
              <strong>Campus Safety</strong>
            </span>
          </div>
        </section>

        {/* 3. How It Works Section */}
        <section className="how-section section-shell" id="how-it-works">
          <div className="section-intro centered">
            <span className="section-kicker">Simple by design</span>
            <h2>From missing to back in your hands.</h2>
            <p>
              CampusFind brings every step into one calm, transparent process.
            </p>
          </div>
          <div className="step-grid">
            {[
              [
                '01',
                'Report',
                'Tell us what happened with a quick, guided report.',
                'phone',
              ],
              [
                '02',
                'Match',
                'We compare item details, time, and campus location.',
                'sparkle',
              ],
              [
                '03',
                'Verify',
                'Campus Safety confirms ownership and custody.',
                'shield',
              ],
              [
                '04',
                'Recover',
                'Collect your item safely and close the report.',
                'check',
              ],
            ].map(([number, title, text, icon], index) => (
              <article className="step-card" key={title}>
                <span className="step-number">{number}</span>
                <div className="step-icon">
                  <Icon name={icon as IconName} size={25} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < 3 && (
                  <span className="step-connector">
                    <Icon name="arrow" size={17} />
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* 4. Live Recently Found Section */}
        <RecentlyFoundSection items={foundItems} loading={loading} />

        {/* 5. Final Call to Action */}
        <section className="final-cta section-shell">
          <div>
            <span className="section-kicker">We’re here when it matters</span>
            <h2>
              Lost something?
              <br />
              Let’s bring it home.
            </h2>
            <p>
              A clear report is the first step. It only takes a couple of minutes.
            </p>
            <Link href="/report-lost" className="button button-light">
              Start a lost report <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="cta-mark">
            <span>
              <Icon name="location" size={40} />
            </span>
            <i className="orbit orbit-a" />
            <i className="orbit orbit-b" />
            <i className="orbit orbit-c" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
