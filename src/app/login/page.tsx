'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon } from '@/components/ui/Icon';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid collegiate email or password. Please verify your credentials.');
        setLoading(false);
      } else {
        if (email.includes('security') || email.includes('admin')) {
          router.push('/admin');
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, destination: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email: demoEmail,
      password: 'password123',
      redirect: false,
    });

    if (res?.error) {
      setError('Could not sign in with demo credentials.');
      setLoading(false);
    } else {
      router.push(destination);
      router.refresh();
    }
  };

  return (
    <div className="app flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow)',
            padding: '38px 32px',
          }}
        >
          {/* Header Badge & Title */}
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                margin: '0 auto 16px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '16px',
                background: 'var(--blue-soft)',
                color: 'var(--blue)',
              }}
            >
              <Icon name="shield" size={26} />
            </div>
            <span className="eyebrow" style={{ marginBottom: '10px' }}>
              <span><Icon name="sparkle" size={13} /></span> Secure Access
            </span>
            <h1
              style={{
                margin: '8px 0 6px',
                font: "800 28px 'Manrope', sans-serif",
                color: 'var(--navy)',
                letterSpacing: '-1px',
              }}
            >
              Sign in to campus<strong>find</strong>
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5' }}>
              University single sign-on for students, staff, and campus safety.
            </p>
          </div>

          {/* Success Banner */}
          {searchParams.get('updated') === 'true' && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--teal-soft)',
                border: '1px solid var(--teal)',
                color: 'var(--teal-dark)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              <Icon name="check" size={16} />
              <span>Password updated successfully. Please log in with your new credentials.</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--coral-soft)',
                border: '1px solid var(--coral)',
                color: 'var(--coral-dark)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              <Icon name="x" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>
                Collegiate Email
                <b>Required</b>
              </label>
              <div className="input-wrap" style={{ margin: 0 }}>
                <Icon name="user" size={17} />
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label>
                Password
                <b>Required</b>
              </label>
              <div className="input-wrap" style={{ margin: 0 }}>
                <Icon name="key" size={17} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button button-found"
              style={{ width: '100%', marginTop: '8px', minHeight: '48px' }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <Icon name="arrow" size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <span
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '12px',
              }}
            >
              One-Click Demo Profiles
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('maya.lin@campus.edu', '/dashboard')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: '0.2s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--navy)' }}>
                  <Icon name="user" size={14} /> Student
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Maya Lin</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('vance.security@campus.edu', '/admin')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: '0.2s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--navy)' }}>
                  <Icon name="shield" size={14} /> Security
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Officer Vance</div>
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div style={{ textAlign: 'center', marginTop: '22px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
              New campus student?{' '}
              <Link
                href="/register"
                style={{
                  fontWeight: 700,
                  color: 'var(--blue)',
                  textDecoration: 'underline',
                  marginLeft: '4px',
                }}
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="app flex items-center justify-center min-h-screen">
          <div style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: 700 }}>
            Loading login portal...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
