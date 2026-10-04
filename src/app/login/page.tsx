'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Compass, 
  ArrowRight, 
  UserCheck, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
        setError('Invalid collegiate email or password. Please verify credentials.');
        setLoading(false);
      } else {
        // Redirect based on role or callbackUrl
        if (email.includes('security') || email.includes('admin')) {
          router.push('/admin');
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err: any) {
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Compass className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign in to Campus<span className="text-indigo-600">Find</span>
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              University single-sign-on &amp; credentials portal for students, staff, and security.
            </p>
          </div>

          {/* Password Updated Banner */}
          {searchParams.get('updated') === 'true' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Password updated successfully. Please log in with your new credentials.</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Collegiate Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
              One-Click Role Demonstration
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('maya.lin@campus.edu', '/dashboard')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Student</span>
                </div>
                <div className="text-[10px] text-indigo-700/80 mt-0.5 truncate">
                  Maya Lin
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('vance.security@campus.edu', '/admin')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Security</span>
                </div>
                <div className="text-[10px] text-emerald-700/80 mt-0.5 truncate">
                  Officer Vance
                </div>
              </button>
            </div>
          </div>

          {/* Registration Prompt */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              New campus student?{' '}
              <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
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
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium text-sm animate-pulse">Loading login portal...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
