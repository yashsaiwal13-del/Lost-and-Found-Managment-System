'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { getCurrentUser, logoutUser } from '@/app/actions/auth';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'SECURITY' | 'ADMIN';
    studentId?: string;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
          setLoadingUser(false);
          if (user) {
            fetchNotifications();
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingUser(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (notifOpen || userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen, userDropdownOpen]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {
      window.location.href = '/login';
    }
  };

  const role = currentUser?.role;
  const isHomeActive = pathname === '/';
  const isDashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isAdminActive = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <header className="site-header">
      <Logo href="/" onClick={() => setOpen(false)} />

      <nav
        className={open ? "main-nav open" : "main-nav"}
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className={isHomeActive ? "nav-link active" : "nav-link"}
          onClick={() => setOpen(false)}
        >
          Home
        </Link>

        {currentUser && (
          <Link
            href="/dashboard"
            className={isDashboardActive ? "nav-link active" : "nav-link"}
            onClick={() => setOpen(false)}
          >
            My reports
          </Link>
        )}

        {(role === 'ADMIN' || role === 'SECURITY') && (
          <Link
            href="/admin"
            className={isAdminActive ? "nav-link active" : "nav-link"}
            onClick={() => setOpen(false)}
          >
            Admin portal
          </Link>
        )}

        <Link
          href="/report-lost"
          className="nav-mobile-action lost"
          onClick={() => setOpen(false)}
        >
          Report lost item
        </Link>

        <Link
          href="/report-found"
          className="nav-mobile-action found"
          onClick={() => setOpen(false)}
        >
          Report found item
        </Link>

        {currentUser ? (
          <button
            type="button"
            className="nav-mobile-action"
            style={{
              marginTop: '8px',
              background: 'var(--paper)',
              color: 'var(--coral)',
              border: '1px solid var(--line)',
            }}
            onClick={() => {
              setOpen(false);
              handleSignOut();
            }}
          >
            Sign out ({currentUser.name})
          </button>
        ) : (
          <Link
            href="/login"
            className="nav-mobile-action"
            style={{
              marginTop: '8px',
              background: 'var(--navy)',
              color: 'var(--paper)',
            }}
            onClick={() => setOpen(false)}
          >
            Sign In
          </Link>
        )}
      </nav>

      <div className="header-actions">
        {!loadingUser && (
          <>
            {currentUser ? (
              <>
                <div style={{ position: 'relative' }} ref={notifRef}>
                  <button
                    type="button"
                    className="icon-button notification"
                    aria-label="Notifications"
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (!notifOpen) fetchNotifications();
                    }}
                  >
                    <Icon name="bell" size={19} />
                    {unreadCount > 0 && <i />}
                  </button>

                  {notifOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 12px)',
                        width: '320px',
                        maxHeight: '400px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow)',
                        zIndex: 100,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--line)',
                          background: 'rgba(56, 38, 49, 0.03)',
                        }}
                      >
                        <strong style={{ fontSize: '12px', color: 'var(--navy)' }}>
                          Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </strong>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            style={{
                              border: 0,
                              background: 'none',
                              color: 'var(--blue)',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
                        {notifications.length === 0 ? (
                          <div
                            style={{
                              padding: '32px 16px',
                              textAlign: 'center',
                              color: 'var(--muted)',
                              fontSize: '12px',
                            }}
                          >
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (!item.isRead) markAsRead(item.id);
                              }}
                              style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--line)',
                                background: item.isRead ? 'transparent' : 'var(--blue-soft)',
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                }}
                              >
                                <strong style={{ fontSize: '12px', color: 'var(--navy)' }}>
                                  {item.title}
                                </strong>
                                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                  {new Date(item.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p
                                style={{
                                  margin: '4px 0 0',
                                  fontSize: '11px',
                                  color: 'var(--muted)',
                                  lineHeight: '1.4',
                                }}
                              >
                                {item.message}
                              </p>
                              {item.link && (
                                <Link
                                  href={item.link}
                                  onClick={() => setNotifOpen(false)}
                                  style={{
                                    display: 'inline-block',
                                    marginTop: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--blue)',
                                    textDecoration: 'none',
                                  }}
                                >
                                  View Details →
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/report-found" className="header-cta">
                  <Icon name="plus" size={17} /> Report an item
                </Link>

                <div style={{ position: 'relative' }} ref={userDropdownRef}>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="User profile"
                    title={`${currentUser.name} (${currentUser.role})`}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <Icon name="user" size={18} />
                  </button>

                  {userDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 12px)',
                        width: '220px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)',
                        borderRadius: '14px',
                        boxShadow: 'var(--shadow)',
                        padding: '8px',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)' }}>
                        <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--navy)' }}>
                          {currentUser.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                          {currentUser.email}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '6px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '9px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            background: role === 'ADMIN' ? 'var(--purple-soft)' : 'var(--teal-soft)',
                            color: role === 'ADMIN' ? 'var(--purple)' : 'var(--teal)',
                          }}
                        >
                          {role}
                        </span>
                      </div>

                      {role === 'STUDENT' && (
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--navy)',
                            textDecoration: 'none',
                            borderRadius: '8px',
                          }}
                        >
                          My Reports &amp; Claims
                        </Link>
                      )}

                      {(role === 'ADMIN' || role === 'SECURITY') && (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'block',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--navy)',
                              textDecoration: 'none',
                              borderRadius: '8px',
                            }}
                          >
                            Admin Console
                          </Link>
                          <Link
                            href="/admin/matches"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'block',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--navy)',
                              textDecoration: 'none',
                              borderRadius: '8px',
                            }}
                          >
                            Matches &amp; Custody
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleSignOut}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--coral)',
                          background: 'none',
                          border: 0,
                          borderTop: '1px solid var(--line)',
                          marginTop: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="header-cta">
                <Icon name="user" size={17} /> Sign In
              </Link>
            )}
          </>
        )}

        <button
          className="menu-button"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>
    </header>
  );
}

export default Header;
