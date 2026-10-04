'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon } from '@/components/ui/Icon';
import { registerStudent } from '@/app/actions/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerStudent({
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        phone: formData.phone,
        password: formData.password,
      });

      if (!res.success) {
        setError(res.error || 'Registration failed. Please check information.');
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="app flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
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
                background: 'var(--coral-soft)',
                color: 'var(--coral)',
              }}
            >
              <Icon name="user" size={26} />
            </div>
            <span className="eyebrow" style={{ marginBottom: '10px' }}>
              <span><Icon name="sparkle" size={13} /></span> Student Registration
            </span>
            <h1
              style={{
                margin: '8px 0 6px',
                font: "800 28px 'Manrope', sans-serif",
                color: 'var(--navy)',
                letterSpacing: '-1px',
              }}
            >
              Create Student Account
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5' }}>
              Register with your collegiate credentials to track reports and submit ownership claims.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
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
              <span>Account registered successfully! Redirecting to login...</span>
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
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>
                Full Name
                <b>Required</b>
              </label>
              <div className="input-wrap" style={{ margin: 0 }}>
                <Icon name="user" size={17} />
                <input
                  type="text"
                  required
                  placeholder="Maya Lin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-two-col">
              <div className="field" style={{ margin: 0 }}>
                <label>
                  College Email
                  <b>Required</b>
                </label>
                <div className="input-wrap" style={{ margin: 0 }}>
                  <Icon name="user" size={17} />
                  <input
                    type="email"
                    required
                    placeholder="maya@campus.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label>
                  Student ID
                  <b>Required</b>
                </label>
                <div className="input-wrap" style={{ margin: 0 }}>
                  <Icon name="wallet" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="STU-88291"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label>
                Phone Number
                <span>Optional</span>
              </label>
              <div className="input-wrap" style={{ margin: 0 }}>
                <Icon name="phone" size={17} />
                <input
                  type="tel"
                  placeholder="(555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-two-col">
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label>
                  Confirm Password
                  <b>Required</b>
                </label>
                <div className="input-wrap" style={{ margin: 0 }}>
                  <Icon name="key" size={17} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="button button-lost"
              style={{ width: '100%', marginTop: '8px', minHeight: '48px' }}
            >
              {loading ? (
                <span>Registering Student...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <Icon name="arrow" size={16} />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
              Already have an account?{' '}
              <Link
                href="/login"
                style={{
                  fontWeight: 700,
                  color: 'var(--blue)',
                  textDecoration: 'underline',
                  marginLeft: '4px',
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
