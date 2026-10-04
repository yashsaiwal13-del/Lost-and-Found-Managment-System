'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';

export interface AdminStudentRecord {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActiveLast7Days: boolean;
  reportsCount: number;
  inquiriesCount: number;
}

export interface GetAdminStudentsResult {
  students: AdminStudentRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  metrics: {
    totalStudents: number;
    activeInLast7Days: number;
    neverLoggedIn: number;
  };
}

/**
 * Server Action: Searchable, paginated query of campus students directly from PostgreSQL via Prisma.
 * Strictly protected: ADMIN or SECURITY role required via requireRole().
 * Explicitly excludes password hashes and sensitive credential fields.
 */
export async function getAdminStudents(params?: {
  search?: string;
  page?: number;
  limit?: number;
  filter?: 'all' | 'active' | 'inactive' | 'never_logged_in';
}): Promise<GetAdminStudentsResult> {
  await requireRole(['ADMIN', 'SECURITY']);

  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(100, params?.limit || 15));
  const skip = (page - 1) * limit;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Build where clause
  const where: any = {
    role: 'STUDENT',
  };

  if (params?.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { studentId: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (params?.filter === 'active') {
    where.lastLoginAt = { gte: sevenDaysAgo };
  } else if (params?.filter === 'inactive') {
    where.OR = [
      { lastLoginAt: { lt: sevenDaysAgo } },
      { lastLoginAt: null },
    ];
  } else if (params?.filter === 'never_logged_in') {
    where.lastLoginAt = null;
  }

  // Execute queries
  const [totalFiltered, rawStudents, totalStudentsCount, activeLast7Count, neverLoggedCount] =
    await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              reportedItems: true,
              verificationRequestsReceived: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          lastLoginAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          lastLoginAt: null,
        },
      }),
    ]);

  const students: AdminStudentRecord[] = rawStudents.map((st) => {
    const isRecent = st.lastLoginAt ? new Date(st.lastLoginAt) >= sevenDaysAgo : false;
    return {
      id: st.id,
      name: st.name,
      email: st.email,
      studentId: st.studentId,
      role: st.role,
      createdAt: st.createdAt.toISOString(),
      lastLoginAt: st.lastLoginAt?.toISOString() || null,
      isActiveLast7Days: isRecent,
      reportsCount: st._count.reportedItems,
      inquiriesCount: st._count.verificationRequestsReceived,
    };
  });

  return {
    students,
    pagination: {
      page,
      limit,
      totalCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limit) || 1,
    },
    metrics: {
      totalStudents: totalStudentsCount,
      activeInLast7Days: activeLast7Count,
      neverLoggedIn: neverLoggedCount,
    },
  };
}
