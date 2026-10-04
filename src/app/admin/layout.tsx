import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Admin Portal | Campus Lost & Found',
  description: 'Operations console for managing lost and found reports, claims, matches, and custody.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SECURITY')) {
    redirect('/dashboard');
  }

  // Fetch count indicators for sidebar badges safely
  let matchesCount = 0;
  let claimsCount = 0;
  let custodyCount = 0;

  try {
    const [suggestedCount, pendingClaims, custodyItems] = await Promise.all([
      prisma.match.count({
        where: { status: 'SUGGESTED' },
      }),
      prisma.claim.count({
        where: { status: 'PENDING' },
      }),
      prisma.item.count({
        where: {
          type: 'FOUND',
          status: { notIn: ['RESOLVED', 'ITEM_RETURNED', 'ARCHIVED'] },
          archived: false,
        },
      }),
    ]);
    matchesCount = suggestedCount;
    claimsCount = pendingClaims;
    custodyCount = custodyItems;
  } catch (err) {
    console.error('Error fetching admin counts:', err);
  }

  return (
    <div className="admin-page">
      <AdminSidebar
        user={user}
        counts={{
          matches: matchesCount,
          claims: claimsCount,
          custody: custodyCount,
        }}
      />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
