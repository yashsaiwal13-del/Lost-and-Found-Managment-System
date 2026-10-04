'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';

export interface AdminStatsData {
  totalStudents: number;
  studentsWithLogin: number;
  studentsActiveLast7Days: number;
  totalLostReports: number;
  totalFoundReports: number;
  totalItems: number;
  reportsAwaitingReview: number;
  pendingVerificationRequests: number;
  answeredVerificationRequests: number;
  acceptedVerificationsCount: number;
  resolvedItemsCount: number;
  archivedItemsCount: number;
  lastUpdated: string;
}

/**
 * Server Action: Calculates and returns live administrative statistics from PostgreSQL via Prisma.
 * Strictly protected: ADMIN or SECURITY role required via requireRole().
 * 
 * "active in the last 7 days" is strictly defined as lastLoginAt within the past 7 days from now.
 */
export async function getAdminStats(): Promise<AdminStatsData> {
  await requireRole(['ADMIN', 'SECURITY']);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Execute all Prisma count queries concurrently for maximum performance
  const [
    totalStudents,
    studentsWithLogin,
    studentsActiveLast7Days,
    totalLostReports,
    totalFoundReports,
    totalItems,
    reportsAwaitingReview,
    pendingVerificationRequests,
    answeredVerificationRequests,
    acceptedVerificationsCount,
    resolvedItemsCount,
    archivedItemsCount,
  ] = await Promise.all([
    // 1. Total registered students (role: STUDENT)
    prisma.user.count({
      where: { role: 'STUDENT' },
    }),

    // 2. Students with lastLoginAt not null
    prisma.user.count({
      where: {
        role: 'STUDENT',
        lastLoginAt: { not: null },
      },
    }),

    // 3. Students active in last 7 days (lastLoginAt within the past 7 days)
    prisma.user.count({
      where: {
        role: 'STUDENT',
        lastLoginAt: {
          gte: sevenDaysAgo,
        },
      },
    }),

    // 4. Total lost reports
    prisma.item.count({
      where: { type: 'LOST' },
    }),

    // 5. Total found reports
    prisma.item.count({
      where: { type: 'FOUND' },
    }),

    // 6. Total items (all reports)
    prisma.item.count(),

    // 7. Reports with status REPORTED (awaiting admin review/triage)
    prisma.item.count({
      where: {
        status: {
          in: ['REPORTED', 'PENDING_REVIEW'],
        },
      },
    }),

    // 8. Pending VerificationRequests (awaiting student answers)
    prisma.verificationRequest.count({
      where: { status: 'PENDING' },
    }),

    // 9. Answered VerificationRequests (awaiting admin review)
    prisma.verificationRequest.count({
      where: { status: 'ANSWERED' },
    }),

    // 10. Accepted verification requests count
    prisma.verificationRequest.count({
      where: { status: 'ACCEPTED' },
    }),

    // 11. Resolved items count
    prisma.item.count({
      where: {
        status: {
          in: ['RESOLVED', 'ITEM_RETURNED'],
        },
      },
    }),

    // 12. Archived items count
    prisma.item.count({
      where: { archived: true },
    }),
  ]);

  return {
    totalStudents,
    studentsWithLogin,
    studentsActiveLast7Days,
    totalLostReports,
    totalFoundReports,
    totalItems,
    reportsAwaitingReview,
    pendingVerificationRequests,
    answeredVerificationRequests,
    acceptedVerificationsCount,
    resolvedItemsCount,
    archivedItemsCount,
    lastUpdated: now.toISOString(),
  };
}
