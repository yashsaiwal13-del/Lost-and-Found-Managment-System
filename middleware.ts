import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = (req.auth?.user as any)?.role;
  const pathname = nextUrl.pathname;

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin');

  // 1. Unauthenticated users cannot access /dashboard/** or /admin/**
  if (!isLoggedIn && (isDashboardRoute || isAdminRoute)) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated STUDENT users cannot access /admin/**
  if (isLoggedIn && isAdminRoute && role === 'STUDENT') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
