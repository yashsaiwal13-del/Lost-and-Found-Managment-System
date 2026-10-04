'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  GitCompare, 
  FileCheck2, 
  Package, 
  HelpCircle, 
  Users, 
  History, 
  Settings, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  counts?: {
    matches?: number;
    claims?: number;
    custody?: number;
  };
}

export function AdminSidebar({ user, counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'matches';

  const isMatchesActive = (pathname === '/admin' && (tab === 'matches' || !tab)) || pathname === '/admin/matches';
  const isClaimsActive = pathname === '/admin' && tab === 'claims';
  const isCustodyActive = pathname === '/admin' && tab === 'custody';
  const isVerificationActive = pathname.startsWith('/admin/verification');
  const isStudentsActive = pathname.startsWith('/admin/students');
  const isAuditActive = pathname.startsWith('/admin/audit-log');
  const isSettingsActive = pathname.startsWith('/admin/settings');

  // Compute user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'AD';

  const roleDisplay = user?.role === 'ADMIN' ? 'Campus Safety Admin' : 'Security Officer';

  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand">
        <span>
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <div>
          <strong>Campus Lost &amp; Found</strong>
          <small>Admin Operations</small>
        </div>
      </Link>

      <nav>
        <span>Workspace</span>
        
        <Link 
          href="/admin?tab=matches" 
          className={isMatchesActive ? 'active' : ''}
        >
          <GitCompare className="h-4 w-4" />
          <span>Match &amp; Return</span>
          {counts?.matches !== undefined && counts.matches > 0 && <b>{counts.matches}</b>}
        </Link>

        <Link 
          href="/admin?tab=claims" 
          className={isClaimsActive ? 'active' : ''}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Claims Review</span>
          {counts?.claims !== undefined && counts.claims > 0 && <b>{counts.claims}</b>}
        </Link>

        <Link 
          href="/admin?tab=custody" 
          className={isCustodyActive ? 'active' : ''}
        >
          <Package className="h-4 w-4" />
          <span>Custody Locker</span>
          {counts?.custody !== undefined && counts.custody > 0 && <b>{counts.custody}</b>}
        </Link>

        <Link 
          href="/admin/verification" 
          className={isVerificationActive ? 'active' : ''}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Verification Hub</span>
        </Link>

        <span>System</span>

        <Link 
          href="/admin/students" 
          className={isStudentsActive ? 'active' : ''}
        >
          <Users className="h-4 w-4" />
          <span>Student Directory</span>
        </Link>

        <Link 
          href="/admin/audit-log" 
          className={isAuditActive ? 'active' : ''}
        >
          <History className="h-4 w-4" />
          <span>Record Manager</span>
        </Link>

        <Link 
          href="/admin/settings" 
          className={isSettingsActive ? 'active' : ''}
        >
          <Settings className="h-4 w-4" />
          <span>Admin Settings</span>
        </Link>
      </nav>

      <div className="admin-user">
        <span>{initials}</span>
        <div>
          <strong>{user?.name || 'Administrator'}</strong>
          <small>{roleDisplay}</small>
        </div>
      </div>

      <Link href="/" className="admin-exit">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to campus app</span>
      </Link>
    </aside>
  );
}
